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
            "email": f"alex.test.{self.test_user_id}@levelup.com",
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
            # Note: The login endpoint expects form parameters, not JSON
            login_data = {
                "email": f"alex.test.{self.test_user_id}@levelup.com",
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
                data = {'user_id': self.test_user_id}
                
                response = self.session.post(
                    f"{API_BASE_URL}{endpoint}",
                    files=files,
                    data=data,
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
        """Test user data retrieval endpoints"""
        print("\n📊 Testing User Data Endpoints...")
        
        try:
            # Test get user
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}", timeout=10)
            if response.status_code == 200:
                user_data = response.json()
                self.log_test("Get User Data", True, 
                            f"Retrieved user: {user_data.get('name', 'Unknown')}")
            else:
                self.log_test("Get User Data", False, 
                            f"Failed to get user data: {response.status_code}")
        except Exception as e:
            self.log_test("Get User Data", False, f"User data error: {str(e)}")
        
        try:
            # Test get user scans
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}/scans", timeout=10)
            if response.status_code == 200:
                scans = response.json()
                self.log_test("Get User Scans", True, 
                            f"Retrieved {len(scans)} scan records")
            else:
                self.log_test("Get User Scans", False, 
                            f"Failed to get scans: {response.status_code}")
        except Exception as e:
            self.log_test("Get User Scans", False, f"Scans error: {str(e)}")
        
        try:
            # Test get chat history
            response = self.session.get(
                f"{API_BASE_URL}/user/{self.test_user_id}/chat-history",
                params={"session_id": self.test_session_id},
                timeout=10
            )
            if response.status_code == 200:
                messages = response.json()
                self.log_test("Get Chat History", True, 
                            f"Retrieved {len(messages)} chat messages")
            else:
                self.log_test("Get Chat History", False, 
                            f"Failed to get chat history: {response.status_code}")
        except Exception as e:
            self.log_test("Get Chat History", False, f"Chat history error: {str(e)}")
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        print("\n🌐 Testing CORS Configuration...")
        
        try:
            # Test preflight request
            headers = {
                'Origin': 'https://fitness-revival.preview.emergentagent.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = self.session.options(f"{API_BASE_URL}/health", headers=headers, timeout=10)
            
            if response.status_code in [200, 204]:
                cors_headers = response.headers
                if 'Access-Control-Allow-Origin' in cors_headers:
                    self.log_test("CORS Configuration", True, 
                                f"CORS properly configured, allows origin: {cors_headers.get('Access-Control-Allow-Origin')}")
                else:
                    self.log_test("CORS Configuration", False, 
                                "CORS headers missing in response")
            else:
                self.log_test("CORS Configuration", False, 
                            f"CORS preflight failed: {response.status_code}")
        except Exception as e:
            self.log_test("CORS Configuration", False, f"CORS test error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting LevelUP Backend Testing Suite")
        print("=" * 50)
        
        # Test server health first
        if not self.test_server_health():
            print("\n❌ Server health check failed. Stopping tests.")
            return False
        
        # Run all other tests
        self.test_user_registration()
        self.test_user_login()
        self.test_onboarding()
        self.test_ai_chat()
        self.test_scanning_endpoints()
        self.test_user_data_endpoints()
        self.test_cors_configuration()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some backend tests failed. Check logs above.")
        sys.exit(1)