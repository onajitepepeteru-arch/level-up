#!/usr/bin/env python3
"""
Auth Regression Test for LevelUP Fitness App
Focused testing of authentication endpoints as requested in review
"""

import requests
import json
import os
import sys
import uuid
from datetime import datetime

# Load environment variables
sys.path.append('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

# Get backend URL from frontend environment
frontend_env_path = '/app/frontend/.env'
backend_url = None
if os.path.exists(frontend_env_path):
    with open(frontend_env_path, 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                backend_url = line.split('=', 1)[1].strip()
                break

if not backend_url:
    print("❌ ERROR: Could not find REACT_APP_BACKEND_URL in frontend/.env")
    sys.exit(1)

API_BASE_URL = f"{backend_url}/api"
print(f"🔗 Testing backend at: {API_BASE_URL}")

class AuthRegressionTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.utcnow().isoformat()
        })
    
    def test_auth_register_regression(self):
        """Test POST /api/auth/register (name, email, password) -> expect user.id (UUID string) and token"""
        print("\n🔐 Testing Auth Register Regression...")
        
        # Generate unique test data
        test_user_data = {
            "name": "Emma Rodriguez",
            "email": f"emma.regression.{str(uuid.uuid4())}@levelup.com",
            "password": "SecurePass789!"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=test_user_data,
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    user_data = response.json()
                    # Check JSON serialization
                    json.dumps(user_data)
                    
                    # Verify user.id is UUID string
                    user = user_data.get('user', {})
                    user_id = user.get('id')
                    token = user_data.get('token')
                    
                    # Test 1: User ID is UUID string
                    if user_id and isinstance(user_id, str):
                        try:
                            uuid.UUID(user_id)
                            self.log_test("Register - User ID UUID String", True, 
                                        f"✅ User ID is valid UUID string: {user_id}")
                            self.test_user_id = user_id  # Store for login test
                            self.test_email = test_user_data["email"]
                        except ValueError:
                            self.log_test("Register - User ID UUID String", False, 
                                        f"❌ User ID not valid UUID: {user_id}")
                            return False
                    else:
                        self.log_test("Register - User ID UUID String", False, 
                                    f"❌ User ID missing or not string: {type(user_id)}")
                        return False
                    
                    # Test 2: Token is string
                    if token and isinstance(token, str):
                        self.log_test("Register - Token String", True, 
                                    "✅ Token is string")
                    else:
                        self.log_test("Register - Token String", False, 
                                    f"❌ Token missing or not string: {type(token)}")
                        return False
                    
                    # Test 3: No ObjectId leaks
                    user_str = json.dumps(user_data)
                    if 'ObjectId' not in user_str and '_id' not in user_str:
                        self.log_test("Register - No ObjectId Leaks", True, 
                                    "✅ No ObjectId or _id fields in response")
                    else:
                        self.log_test("Register - No ObjectId Leaks", False, 
                                    "❌ ObjectId or _id found in response")
                        return False
                    
                    # Test 4: Required user fields present
                    required_fields = ['id', 'name', 'email']
                    missing_fields = [field for field in required_fields if field not in user]
                    if not missing_fields:
                        self.log_test("Register - Required User Fields", True, 
                                    "✅ All required user fields present")
                    else:
                        self.log_test("Register - Required User Fields", False, 
                                    f"❌ Missing fields: {missing_fields}")
                        return False
                    
                    return True
                    
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Register - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Register - HTTP Status", False, 
                            f"❌ Registration failed: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Register - Connection", False, f"❌ Registration error: {str(e)}")
            return False
    
    def test_auth_login_regression(self):
        """Test POST /api/auth/login with same email, any password -> expect user.id and token, no ObjectId"""
        print("\n🔑 Testing Auth Login Regression...")
        
        if not hasattr(self, 'test_email'):
            self.log_test("Login - Prerequisites", False, "❌ No test email from registration")
            return False
        
        try:
            login_data = {
                "email": self.test_email,
                "password": "AnyPasswordWorks123"  # As per review request - any password should work
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    login_response = response.json()
                    # Check JSON serialization
                    json.dumps(login_response)
                    
                    # Verify user.id is UUID string
                    user = login_response.get('user', {})
                    user_id = user.get('id')
                    token = login_response.get('token')
                    
                    # Test 1: User ID is UUID string
                    if user_id and isinstance(user_id, str):
                        try:
                            uuid.UUID(user_id)
                            self.log_test("Login - User ID UUID String", True, 
                                        f"✅ User ID is valid UUID string: {user_id}")
                            
                            # Verify it matches registration ID
                            if hasattr(self, 'test_user_id') and user_id == self.test_user_id:
                                self.log_test("Login - User ID Consistency", True, 
                                            "✅ Login user ID matches registration ID")
                            else:
                                self.log_test("Login - User ID Consistency", False, 
                                            f"❌ Login ID {user_id} != Registration ID {getattr(self, 'test_user_id', 'N/A')}")
                        except ValueError:
                            self.log_test("Login - User ID UUID String", False, 
                                        f"❌ User ID not valid UUID: {user_id}")
                            return False
                    else:
                        self.log_test("Login - User ID UUID String", False, 
                                    f"❌ User ID missing or not string: {type(user_id)}")
                        return False
                    
                    # Test 2: Token is string
                    if token and isinstance(token, str):
                        self.log_test("Login - Token String", True, 
                                    "✅ Token is string")
                    else:
                        self.log_test("Login - Token String", False, 
                                    f"❌ Token missing or not string: {type(token)}")
                        return False
                    
                    # Test 3: No ObjectId leaks
                    response_str = json.dumps(login_response)
                    if 'ObjectId' not in response_str and '_id' not in response_str:
                        self.log_test("Login - No ObjectId Leaks", True, 
                                    "✅ No ObjectId or _id fields in response")
                    else:
                        self.log_test("Login - No ObjectId Leaks", False, 
                                    "❌ ObjectId or _id found in response")
                        return False
                    
                    # Test 4: Required user fields present
                    required_fields = ['id', 'name', 'email']
                    missing_fields = [field for field in required_fields if field not in user]
                    if not missing_fields:
                        self.log_test("Login - Required User Fields", True, 
                                    "✅ All required user fields present")
                    else:
                        self.log_test("Login - Required User Fields", False, 
                                    f"❌ Missing fields: {missing_fields}")
                        return False
                    
                    return True
                    
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Login - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Login - HTTP Status", False, 
                            f"❌ Login failed: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Login - Connection", False, f"❌ Login error: {str(e)}")
            return False
    
    def test_get_user_regression(self):
        """Test GET /api/user/{user_id} -> returns user JSON serializable"""
        print("\n👤 Testing Get User Regression...")
        
        if not hasattr(self, 'test_user_id'):
            self.log_test("Get User - Prerequisites", False, "❌ No test user ID from registration")
            return False
        
        try:
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}", timeout=10)
            
            if response.status_code == 200:
                try:
                    user_data = response.json()
                    # Check JSON serialization
                    json.dumps(user_data)
                    
                    # Test 1: JSON Serializable
                    self.log_test("Get User - JSON Serializable", True, 
                                "✅ User data is JSON serializable")
                    
                    # Test 2: No ObjectId leaks
                    user_str = json.dumps(user_data)
                    if 'ObjectId' not in user_str and '_id' not in user_str:
                        self.log_test("Get User - No ObjectId Leaks", True, 
                                    "✅ No ObjectId or _id fields in response")
                    else:
                        self.log_test("Get User - No ObjectId Leaks", False, 
                                    "❌ ObjectId or _id found in response")
                        return False
                    
                    # Test 3: User ID is UUID string
                    user_id = user_data.get('id')
                    if user_id and isinstance(user_id, str):
                        try:
                            uuid.UUID(user_id)
                            self.log_test("Get User - User ID UUID String", True, 
                                        f"✅ User ID is valid UUID string: {user_id}")
                        except ValueError:
                            self.log_test("Get User - User ID UUID String", False, 
                                        f"❌ User ID not valid UUID: {user_id}")
                            return False
                    else:
                        self.log_test("Get User - User ID UUID String", False, 
                                    f"❌ User ID missing or not string: {type(user_id)}")
                        return False
                    
                    # Test 4: Required fields present
                    required_fields = ['id', 'name', 'email']
                    missing_fields = [field for field in required_fields if field not in user_data]
                    if not missing_fields:
                        self.log_test("Get User - Required Fields", True, 
                                    "✅ All required user fields present")
                    else:
                        self.log_test("Get User - Required Fields", False, 
                                    f"❌ Missing fields: {missing_fields}")
                        return False
                    
                    # Test 5: No sensitive data leaked
                    sensitive_fields = ['password', 'password_hash']
                    leaked_fields = [field for field in sensitive_fields if field in user_data]
                    if not leaked_fields:
                        self.log_test("Get User - No Sensitive Data", True, 
                                    "✅ No sensitive data in response")
                    else:
                        self.log_test("Get User - No Sensitive Data", False, 
                                    f"❌ Sensitive fields leaked: {leaked_fields}")
                        return False
                    
                    return True
                    
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Get User - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Get User - HTTP Status", False, 
                            f"❌ Get user failed: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get User - Connection", False, f"❌ Get user error: {str(e)}")
            return False
    
    def test_social_feed_sanity_check(self):
        """Sanity check Social feed endpoints still work after auth change"""
        print("\n🌐 Testing Social Feed Sanity Check...")
        
        if not hasattr(self, 'test_user_id'):
            self.log_test("Social Feed - Prerequisites", False, "❌ No test user ID")
            return False
        
        try:
            # Test 1: Create a social post
            post_data = {
                "user_id": self.test_user_id,
                "content": "Auth regression test post - checking social feed still works! 🚀",
                "type": "general"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/social/post",
                json=post_data,
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    post_result = response.json()
                    json.dumps(post_result)  # Test serialization
                    
                    if 'id' in post_result and 'user' in post_result:
                        self.log_test("Social Feed - Create Post", True, 
                                    f"✅ Post created successfully with ID: {post_result['id']}")
                        self.test_post_id = post_result['id']
                    else:
                        self.log_test("Social Feed - Create Post", False, 
                                    "❌ Post missing required fields")
                        return False
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Social Feed - Create Post", False, 
                                f"❌ JSON serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Social Feed - Create Post", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
                return False
            
            # Test 2: Get social feed
            response = self.session.get(
                f"{API_BASE_URL}/social/feed",
                params={"user_id": self.test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    feed_data = response.json()
                    json.dumps(feed_data)  # Test serialization
                    
                    posts = feed_data.get('posts', [])
                    self.log_test("Social Feed - Get Feed", True, 
                                f"✅ Feed retrieved with {len(posts)} posts, all serializable")
                    return True
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Social Feed - Get Feed", False, 
                                f"❌ JSON serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Social Feed - Get Feed", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Social Feed - Connection", False, f"❌ Error: {str(e)}")
            return False
    
    def test_media_endpoints_sanity_check(self):
        """Sanity check Media endpoints still work after auth change"""
        print("\n📁 Testing Media Endpoints Sanity Check...")
        
        try:
            # Test 1: Upload media
            dummy_file_content = b"dummy image data for auth regression test"
            files = {'file': ('test_auth_regression.jpg', dummy_file_content, 'image/jpeg')}
            
            response = self.session.post(
                f"{API_BASE_URL}/media/upload",
                files=files,
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    upload_result = response.json()
                    json.dumps(upload_result)  # Test serialization
                    
                    media_id = upload_result.get('id')
                    if media_id:
                        self.log_test("Media - Upload", True, 
                                    f"✅ Media uploaded successfully with ID: {media_id}")
                        self.test_media_id = media_id
                    else:
                        self.log_test("Media - Upload", False, 
                                    "❌ Upload response missing media ID")
                        return False
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Media - Upload", False, 
                                f"❌ JSON serialization error: {str(e)}")
                    return False
            else:
                self.log_test("Media - Upload", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
                return False
            
            # Test 2: Retrieve media
            if hasattr(self, 'test_media_id'):
                response = self.session.get(f"{API_BASE_URL}/media/{self.test_media_id}", timeout=10)
                
                if response.status_code == 200:
                    # Check content type header
                    content_type = response.headers.get('content-type', '')
                    if 'image' in content_type:
                        self.log_test("Media - Retrieve", True, 
                                    f"✅ Media retrieved successfully with content-type: {content_type}")
                        return True
                    else:
                        self.log_test("Media - Retrieve", False, 
                                    f"❌ Unexpected content-type: {content_type}")
                        return False
                else:
                    self.log_test("Media - Retrieve", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
                    return False
            else:
                self.log_test("Media - Retrieve", False, "❌ No media ID for retrieval test")
                return False
                
        except Exception as e:
            self.log_test("Media - Connection", False, f"❌ Error: {str(e)}")
            return False
    
    def run_auth_regression_tests(self):
        """Run complete auth regression test suite"""
        print("🎯 Starting Auth Regression Testing Suite")
        print("Focus: Auth Register/Login UUID/Token validation, User retrieval, Social/Media sanity")
        print("=" * 80)
        
        # Test 1: Auth Register
        register_success = self.test_auth_register_regression()
        
        # Test 2: Auth Login (depends on register)
        login_success = self.test_auth_login_regression() if register_success else False
        
        # Test 3: Get User (depends on register)
        get_user_success = self.test_get_user_regression() if register_success else False
        
        # Test 4: Social Feed Sanity Check
        social_success = self.test_social_feed_sanity_check() if register_success else False
        
        # Test 5: Media Endpoints Sanity Check
        media_success = self.test_media_endpoints_sanity_check()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 AUTH REGRESSION TEST SUMMARY")
        print("=" * 80)
        
        auth_tests = [
            ("Auth Register", register_success),
            ("Auth Login", login_success),
            ("Get User", get_user_success),
            ("Social Feed Sanity", social_success),
            ("Media Endpoints Sanity", media_success)
        ]
        
        total_tests = len(auth_tests)
        passed_tests = sum(1 for _, success in auth_tests if success)
        failed_tests = total_tests - passed_tests
        
        print(f"Total Auth Regression Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        if total_tests > 0:
            print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for test_name, success in auth_tests:
                if not success:
                    print(f"  - {test_name}")
        
        # Show detailed results
        print(f"\n📋 DETAILED RESULTS: {len(self.test_results)} individual checks")
        detailed_passed = sum(1 for result in self.test_results if result['success'])
        print(f"✅ Detailed Passed: {detailed_passed}")
        print(f"❌ Detailed Failed: {len(self.test_results) - detailed_passed}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AuthRegressionTester()
    success = tester.run_auth_regression_tests()
    
    if success:
        print("\n🎉 All auth regression tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some auth regression tests failed. Check logs above.")
        sys.exit(1)