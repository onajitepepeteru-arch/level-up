#!/usr/bin/env python3
"""
Backend Testing Suite for LevelUP Fitness App
Tests all backend API endpoints and functionality
"""

import requests
import json
import os
import sys
from datetime import datetime
import uuid
import asyncio
import aiohttp
from pathlib import Path

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

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_id = str(uuid.uuid4())
        self.test_session_id = str(uuid.uuid4())
        self.test_email = f"alex.test.{self.test_user_id}@levelup.com"
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
    
    def test_server_health(self):
        """Test basic server connectivity and health"""
        print("\n🏥 Testing Server Health...")
        
        try:
            # Test root endpoint
            response = self.session.get(f"{API_BASE_URL}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Server Root Endpoint", True, 
                            f"Server responding with message: {data.get('message', 'No message')}")
            else:
                self.log_test("Server Root Endpoint", False, 
                            f"Unexpected status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Server Root Endpoint", False, f"Connection failed: {str(e)}")
            return False
        
        try:
            # Test health endpoint
            response = self.session.get(f"{API_BASE_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check Endpoint", True, 
                            f"Health status: {data.get('status', 'unknown')}")
            else:
                self.log_test("Health Check Endpoint", False, 
                            f"Health check failed with status: {response.status_code}")
        except Exception as e:
            self.log_test("Health Check Endpoint", False, f"Health check error: {str(e)}")
        
        return True
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n👤 Testing User Registration...")
        
        test_user_data = {
            "name": "Alex Johnson",
            "email": self.test_email,
            "password": "securepass123"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=test_user_data,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.test_user_id = user_data.get('id', self.test_user_id)
                self.log_test("User Registration", True, 
                            f"User registered successfully with ID: {self.test_user_id}")
                return True
            else:
                self.log_test("User Registration", False, 
                            f"Registration failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n🔐 Testing User Login...")
        
        try:
            # Note: The login endpoint expects query parameters
            login_data = {
                "email": self.test_email,
                "password": "securepass123"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                params=login_data,  # Using params for query parameters
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("User Login", True, 
                            f"Login successful: {data.get('message', 'No message')}")
                return True
            else:
                self.log_test("User Login", False, 
                            f"Login failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_onboarding(self):
        """Test onboarding completion endpoint"""
        print("\n📋 Testing Onboarding...")
        
        onboarding_data = {
            "user_id": self.test_user_id,
            "age": 28,
            "gender": "Male",
            "goals": ["Build Muscle", "Lose Weight"],
            "body_type": "Mesomorph",
            "activity_level": "Moderate",
            "health_conditions": []
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/onboarding",
                json=onboarding_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Onboarding Completion", True, 
                            f"Onboarding completed, XP earned: {data.get('xp_earned', 0)}")
                return True
            else:
                self.log_test("Onboarding Completion", False, 
                            f"Onboarding failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Onboarding Completion", False, f"Onboarding error: {str(e)}")
            return False
    
    def test_ai_chat(self):
        """Test AI chat functionality"""
        print("\n🤖 Testing AI Chat Integration...")
        
        chat_data = {
            "user_id": self.test_user_id,
            "session_id": self.test_session_id,
            "message": "Hi! I'm new to fitness and want to start building muscle. What should I focus on first?"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/chat",
                json=chat_data,
                timeout=30  # AI calls might take longer
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data.get('response', '')
                if ai_response and len(ai_response) > 10:
                    self.log_test("AI Chat Integration", True, 
                                f"AI responded with {len(ai_response)} characters")
                    return True
                else:
                    self.log_test("AI Chat Integration", False, 
                                f"AI response too short or empty: {ai_response}")
                    return False
            else:
                self.log_test("AI Chat Integration", False, 
                            f"Chat failed with status: {response.status_code}, response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Chat Integration", False, f"Chat error: {str(e)}")
            return False
    
    def test_scanning_endpoints(self):
        """Test all scanning endpoints"""
        print("\n📸 Testing Scanning Endpoints...")
        
        # Create a dummy file for testing
        dummy_file_content = b"dummy image data for testing"
        
        scan_types = [
            ("body", "/scan/body", 8),
            ("face", "/scan/face", 6),
            ("food", "/scan/food", 5)
        ]
        
        for scan_name, endpoint, expected_xp in scan_types:
            try:
                files = {'file': ('test_image.jpg', dummy_file_content, 'image/jpeg')}
                params = {'user_id': self.test_user_id}  # user_id as query parameter
                
                response = self.session.post(
                    f"{API_BASE_URL}{endpoint}",
                    files=files,
                    params=params,  # Changed from data to params
                    timeout=15
                )
                
                if response.status_code == 200:
                    result = response.json()
                    xp_earned = result.get('xp_earned', 0)
                    if xp_earned == expected_xp:
                        self.log_test(f"{scan_name.title()} Scan", True, 
                                    f"Scan completed, earned {xp_earned} XP")
                    else:
                        self.log_test(f"{scan_name.title()} Scan", False, 
                                    f"Expected {expected_xp} XP, got {xp_earned}")
                else:
                    self.log_test(f"{scan_name.title()} Scan", False, 
                                f"Scan failed with status: {response.status_code}")
            except Exception as e:
                self.log_test(f"{scan_name.title()} Scan", False, f"Scan error: {str(e)}")
    
    def test_user_data_endpoints(self):
        """Test user data retrieval endpoints with focus on JSON serialization"""
        print("\n📊 Testing User Data Endpoints...")
        
        try:
            # Test get user scans - Focus on ObjectId serialization
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}/scans", timeout=10)
            if response.status_code == 200:
                try:
                    scans = response.json()  # This will fail if ObjectId not serialized
                    # Check that all objects are JSON serializable
                    json.dumps(scans)  # This will raise exception if not serializable
                    
                    # Verify structure
                    if isinstance(scans, list):
                        self.log_test("Get User Scans - JSON Serialization", True, 
                                    f"✅ Retrieved {len(scans)} scan records, all JSON serializable")
                        
                        # Check timestamp format if scans exist
                        if scans:
                            for scan in scans:
                                if 'timestamp' in scan:
                                    # Verify timestamp is string or serializable
                                    timestamp = scan['timestamp']
                                    if isinstance(timestamp, str):
                                        self.log_test("Scan Timestamp Format", True, 
                                                    "Timestamps are ISO strings")
                                    else:
                                        self.log_test("Scan Timestamp Format", False, 
                                                    f"Timestamp not string: {type(timestamp)}")
                                    break
                    else:
                        self.log_test("Get User Scans - JSON Serialization", False, 
                                    f"Expected list, got {type(scans)}")
                except json.JSONDecodeError as je:
                    self.log_test("Get User Scans - JSON Serialization", False, 
                                f"JSON decode error: {str(je)}")
                except TypeError as te:
                    self.log_test("Get User Scans - JSON Serialization", False, 
                                f"❌ CRITICAL: ObjectId serialization error: {str(te)}")
            else:
                self.log_test("Get User Scans - JSON Serialization", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get User Scans - JSON Serialization", False, f"❌ Scans error: {str(e)}")
        
        try:
            # Test get chat history with session_id parameter
            response = self.session.get(
                f"{API_BASE_URL}/user/{self.test_user_id}/chat-history",
                params={"session_id": self.test_session_id},
                timeout=10
            )
            if response.status_code == 200:
                try:
                    messages = response.json()
                    # Check JSON serialization
                    json.dumps(messages)
                    self.log_test("Get Chat History - JSON Serialization", True, 
                                f"✅ Retrieved {len(messages)} chat messages, all JSON serializable")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Get Chat History - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
            else:
                self.log_test("Get Chat History - JSON Serialization", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Chat History - JSON Serialization", False, f"❌ Chat history error: {str(e)}")
    
    def test_notifications_api(self):
        """Test notifications API endpoints"""
        print("\n🔔 Testing Notifications API...")
        
        # First create a notification for testing
        notification_id = None
        try:
            # Create a test notification
            notification_data = {
                "user_id": self.test_user_id,
                "title": "Test Notification",
                "message": "This is a test notification for API testing",
                "type": "info"
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/notifications",
                json=notification_data,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test("Create Notification", True, "Test notification created successfully")
            else:
                self.log_test("Create Notification", False, 
                            f"Failed to create notification: {response.status_code}")
        except Exception as e:
            self.log_test("Create Notification", False, f"Notification creation error: {str(e)}")
        
        try:
            # Test get user notifications
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}/notifications", timeout=10)
            if response.status_code == 200:
                try:
                    notifications = response.json()
                    # Check JSON serialization
                    json.dumps(notifications)
                    
                    if isinstance(notifications, list):
                        self.log_test("Get User Notifications - JSON Serialization", True, 
                                    f"✅ Retrieved {len(notifications)} notifications, all JSON serializable")
                        
                        # Find a notification to test read functionality
                        if notifications:
                            notification_id = notifications[0].get('id')
                            # Check unread count logic (can be inferred by read flag)
                            unread_count = sum(1 for n in notifications if not n.get('read', False))
                            self.log_test("Notifications Unread Count Logic", True, 
                                        f"Found {unread_count} unread notifications")
                    else:
                        self.log_test("Get User Notifications - JSON Serialization", False, 
                                    f"Expected list, got {type(notifications)}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Get User Notifications - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
            else:
                self.log_test("Get User Notifications - JSON Serialization", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get User Notifications - JSON Serialization", False, f"❌ Notifications error: {str(e)}")
        
        # Test mark notification as read
        if notification_id:
            try:
                response = self.session.patch(
                    f"{API_BASE_URL}/notifications/{notification_id}/read",
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_test("Mark Notification Read", True, 
                                "✅ Notification marked as read successfully")
                else:
                    self.log_test("Mark Notification Read", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Mark Notification Read", False, f"❌ Mark read error: {str(e)}")
        else:
            self.log_test("Mark Notification Read", False, "❌ No notification ID available for testing")
    
    def test_auth_login_serialization(self):
        """Test auth login with focus on JSON serialization"""
        print("\n🔐 Testing Auth Login Serialization...")
        
        # Test registration first
        test_user_data = {
            "name": "Sarah Wilson",
            "email": f"sarah.test.{str(uuid.uuid4())}@levelup.com",
            "password": "securepass456"
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
                    
                    if user_id and isinstance(user_id, str):
                        # Verify it's a valid UUID format
                        try:
                            uuid.UUID(user_id)
                            self.log_test("Auth Register - User ID UUID", True, 
                                        f"✅ User ID is valid UUID string: {user_id}")
                        except ValueError:
                            self.log_test("Auth Register - User ID UUID", False, 
                                        f"❌ User ID not valid UUID: {user_id}")
                    else:
                        self.log_test("Auth Register - User ID UUID", False, 
                                    f"❌ User ID missing or not string: {type(user_id)}")
                    
                    if token and isinstance(token, str):
                        self.log_test("Auth Register - Token String", True, 
                                    "✅ Token is string")
                    else:
                        self.log_test("Auth Register - Token String", False, 
                                    f"❌ Token missing or not string: {type(token)}")
                    
                    # Check no ObjectId leaks
                    user_str = json.dumps(user_data)
                    if 'ObjectId' not in user_str and '_id' not in user_str:
                        self.log_test("Auth Register - No ObjectId Leaks", True, 
                                    "✅ No ObjectId or _id fields in response")
                    else:
                        self.log_test("Auth Register - No ObjectId Leaks", False, 
                                    "❌ ObjectId or _id found in response")
                    
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Auth Register - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
                    return
            else:
                self.log_test("Auth Register - JSON Serialization", False, 
                            f"❌ Registration failed: {response.status_code}")
                return
        except Exception as e:
            self.log_test("Auth Register - JSON Serialization", False, f"❌ Registration error: {str(e)}")
            return
        
        # Now test login with same credentials
        try:
            login_data = {
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
            
            response = self.session.post(
                f"{API_BASE_URL}/auth/login",
                json=login_data,  # Try JSON first
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
                    
                    if user_id and isinstance(user_id, str):
                        try:
                            uuid.UUID(user_id)
                            self.log_test("Auth Login - User ID UUID", True, 
                                        f"✅ User ID is valid UUID string: {user_id}")
                        except ValueError:
                            self.log_test("Auth Login - User ID UUID", False, 
                                        f"❌ User ID not valid UUID: {user_id}")
                    else:
                        self.log_test("Auth Login - User ID UUID", False, 
                                    f"❌ User ID missing or not string: {type(user_id)}")
                    
                    if token and isinstance(token, str):
                        self.log_test("Auth Login - Token String", True, 
                                    "✅ Token is string")
                    else:
                        self.log_test("Auth Login - Token String", False, 
                                    f"❌ Token missing or not string: {type(token)}")
                    
                    # Check no ObjectId leaks
                    response_str = json.dumps(login_response)
                    if 'ObjectId' not in response_str and '_id' not in response_str:
                        self.log_test("Auth Login - No ObjectId Leaks", True, 
                                    "✅ No ObjectId or _id fields in response")
                    else:
                        self.log_test("Auth Login - No ObjectId Leaks", False, 
                                    "❌ ObjectId or _id found in response")
                    
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Auth Login - JSON Serialization", False, 
                                f"❌ Serialization error: {str(e)}")
            else:
                self.log_test("Auth Login - JSON Serialization", False, 
                            f"❌ Login failed: {response.status_code}, response: {response.text}")
        except Exception as e:
            self.log_test("Auth Login - JSON Serialization", False, f"❌ Login error: {str(e)}")
    
    def run_focused_tests(self):
        """Run focused backend tests as requested in review"""
        print("🎯 Starting Focused Backend Testing Suite")
        print("Focus: User Data Retrieval, Notifications, Auth Serialization")
        print("=" * 60)
        
        # Test server health first
        if not self.test_server_health():
            print("\n❌ Server health check failed. Stopping tests.")
            return False
        
        # Create a test user for the focused tests
        print("\n👤 Setting up test user...")
        if not self.test_user_registration():
            print("❌ Failed to create test user. Some tests may fail.")
        
        # Complete onboarding to have data for testing
        print("📋 Completing onboarding for test data...")
        self.test_onboarding()
        
        # Create some scan data for testing user data retrieval
        print("📸 Creating test scan data...")
        self.test_scanning_endpoints()
        
        # Create chat data for testing
        print("💬 Creating test chat data...")
        self.test_ai_chat()
        
        # Now run the focused tests
        print("\n" + "=" * 60)
        print("🎯 FOCUSED TESTS - As Requested")
        print("=" * 60)
        
        # 1) User Data Retrieval APIs
        self.test_user_data_endpoints()
        
        # 2) Notifications API  
        self.test_notifications_api()
        
        # 3) Auth Login Serialization
        self.test_auth_login_serialization()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 FOCUSED TEST SUMMARY")
        print("=" * 60)
        
        # Filter results to show only the focused tests
        focused_test_keywords = [
            "JSON Serialization", "Notifications", "Auth Register", "Auth Login", 
            "User ID UUID", "Token String", "ObjectId Leaks", "Unread Count"
        ]
        
        focused_results = []
        for result in self.test_results:
            if any(keyword in result['test'] for keyword in focused_test_keywords):
                focused_results.append(result)
        
        total_focused = len(focused_results)
        passed_focused = sum(1 for result in focused_results if result['success'])
        failed_focused = total_focused - passed_focused
        
        print(f"Focused Tests: {total_focused}")
        print(f"✅ Passed: {passed_focused}")
        print(f"❌ Failed: {failed_focused}")
        if total_focused > 0:
            print(f"Success Rate: {(passed_focused/total_focused)*100:.1f}%")
        
        if failed_focused > 0:
            print("\n❌ FAILED FOCUSED TESTS:")
            for result in focused_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Show all test results for context
        print(f"\n📋 TOTAL TESTS RUN: {len(self.test_results)}")
        total_passed = sum(1 for result in self.test_results if result['success'])
        print(f"✅ Total Passed: {total_passed}")
        print(f"❌ Total Failed: {len(self.test_results) - total_passed}")
        
        return failed_focused == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some backend tests failed. Check logs above.")
        sys.exit(1)