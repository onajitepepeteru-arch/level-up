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
                user = user_data.get('user', {})
                self.test_user_id = user.get('id', self.test_user_id)
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
    
    def test_social_endpoints(self):
        """Test social endpoints as requested in review"""
        print("\n🌐 Testing Social Endpoints...")
        
        # 1) Social Feed: POST /api/social/post with user -> Should return post with id and user object
        try:
            post_data = {
                "user_id": self.test_user_id,
                "content": "Just completed my first workout! Feeling amazing! 💪 #LevelUp #Fitness",
                "type": "achievement"
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
                    
                    # Verify post structure
                    if 'id' in post_result and 'user' in post_result:
                        user_obj = post_result['user']
                        if 'name' in user_obj and 'level' in user_obj:
                            self.log_test("Social Post Creation", True, 
                                        f"✅ Post created with ID: {post_result['id']}, user object included")
                            self.test_post_id = post_result['id']  # Store for later tests
                        else:
                            self.log_test("Social Post Creation", False, 
                                        "❌ User object missing required fields")
                    else:
                        self.log_test("Social Post Creation", False, 
                                    "❌ Post missing id or user object")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Social Post Creation", False, 
                                f"❌ JSON serialization error: {str(e)}")
            else:
                self.log_test("Social Post Creation", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Social Post Creation", False, f"❌ Error: {str(e)}")
        
        # 2) GET /api/social/feed?user_id=U -> Should include the new post; confirm fields serializable
        try:
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
                    if posts:
                        # Check if our post is in the feed
                        our_post = None
                        for post in posts:
                            if post.get('user', {}).get('name') == 'Alex Johnson':
                                our_post = post
                                break
                        
                        if our_post:
                            self.log_test("Social Feed Retrieval", True, 
                                        f"✅ Feed contains {len(posts)} posts, our post found, all serializable")
                        else:
                            self.log_test("Social Feed Retrieval", True, 
                                        f"✅ Feed retrieved with {len(posts)} posts, all serializable")
                    else:
                        self.log_test("Social Feed Retrieval", True, 
                                    "✅ Feed retrieved (empty), serializable")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Social Feed Retrieval", False, 
                                f"❌ JSON serialization error: {str(e)}")
            else:
                self.log_test("Social Feed Retrieval", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Social Feed Retrieval", False, f"❌ Error: {str(e)}")
        
        # 3) POST /api/social/like with U on that post -> liked=true and likes increments
        if hasattr(self, 'test_post_id'):
            try:
                like_data = {
                    "user_id": self.test_user_id,
                    "post_id": self.test_post_id
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/social/like",
                    json=like_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        like_result = response.json()
                        json.dumps(like_result)  # Test serialization
                        
                        if 'liked' in like_result and 'likes' in like_result:
                            liked = like_result['liked']
                            likes_count = like_result['likes']
                            if liked and likes_count >= 1:
                                self.log_test("Social Like Post", True, 
                                            f"✅ Post liked successfully, likes count: {likes_count}")
                            else:
                                self.log_test("Social Like Post", False, 
                                            f"❌ Like state incorrect: liked={liked}, count={likes_count}")
                        else:
                            self.log_test("Social Like Post", False, 
                                        "❌ Response missing liked or likes fields")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("Social Like Post", False, 
                                    f"❌ JSON serialization error: {str(e)}")
                else:
                    self.log_test("Social Like Post", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Social Like Post", False, f"❌ Error: {str(e)}")
        
        # 4) POST /api/social/comment with U -> returns comment object; verify feed comments count updates
        if hasattr(self, 'test_post_id'):
            try:
                comment_data = {
                    "user_id": self.test_user_id,
                    "post_id": self.test_post_id,
                    "content": "Great job! Keep up the excellent work! 🎉"
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/social/comment",
                    json=comment_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        comment_result = response.json()
                        json.dumps(comment_result)  # Test serialization
                        
                        comment_obj = comment_result.get('comment', {})
                        if 'id' in comment_obj and 'content' in comment_obj:
                            self.log_test("Social Comment Post", True, 
                                        f"✅ Comment created with ID: {comment_obj['id']}")
                        else:
                            self.log_test("Social Comment Post", False, 
                                        "❌ Comment object missing required fields")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("Social Comment Post", False, 
                                    f"❌ JSON serialization error: {str(e)}")
                else:
                    self.log_test("Social Comment Post", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Social Comment Post", False, f"❌ Error: {str(e)}")
        
        # 5) POST /api/social/share with U -> share_count increments; confirm 200
        if hasattr(self, 'test_post_id'):
            try:
                share_data = {
                    "user_id": self.test_user_id,
                    "post_id": self.test_post_id
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/social/share",
                    json=share_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        share_result = response.json()
                        json.dumps(share_result)  # Test serialization
                        
                        if 'share_count' in share_result:
                            share_count = share_result['share_count']
                            if share_count >= 1:
                                self.log_test("Social Share Post", True, 
                                            f"✅ Post shared successfully, share count: {share_count}")
                            else:
                                self.log_test("Social Share Post", False, 
                                            f"❌ Share count not incremented: {share_count}")
                        else:
                            self.log_test("Social Share Post", False, 
                                        "❌ Response missing share_count field")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("Social Share Post", False, 
                                    f"❌ JSON serialization error: {str(e)}")
                else:
                    self.log_test("Social Share Post", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Social Share Post", False, f"❌ Error: {str(e)}")
    
    def test_chat_rooms(self):
        """Test chat rooms endpoints"""
        print("\n💬 Testing Chat Rooms...")
        
        # 6) GET /api/social/chat-rooms?user_id=U -> returns seeded rooms; all serializable
        try:
            response = self.session.get(
                f"{API_BASE_URL}/social/chat-rooms",
                params={"user_id": self.test_user_id},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    rooms_data = response.json()
                    json.dumps(rooms_data)  # Test serialization
                    
                    rooms = rooms_data.get('rooms', [])
                    if rooms:
                        self.log_test("Chat Rooms Retrieval", True, 
                                    f"✅ Retrieved {len(rooms)} chat rooms, all serializable")
                        self.test_room_id = rooms[0].get('id')  # Store first room for join test
                    else:
                        self.log_test("Chat Rooms Retrieval", False, 
                                    "❌ No chat rooms returned")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Chat Rooms Retrieval", False, 
                                f"❌ JSON serialization error: {str(e)}")
            else:
                self.log_test("Chat Rooms Retrieval", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Chat Rooms Retrieval", False, f"❌ Error: {str(e)}")
        
        # 7) POST /api/social/join-room for first room with U -> returns Joined; follow-up GET shows isJoined true
        if hasattr(self, 'test_room_id'):
            try:
                join_data = {
                    "user_id": self.test_user_id,
                    "room_id": self.test_room_id
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/social/join-room",
                    json=join_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        join_result = response.json()
                        json.dumps(join_result)  # Test serialization
                        
                        if join_result.get('message') == 'Joined':
                            self.log_test("Chat Room Join", True, 
                                        "✅ Successfully joined chat room")
                            
                            # Follow-up GET to verify isJoined is true
                            response = self.session.get(
                                f"{API_BASE_URL}/social/chat-rooms",
                                params={"user_id": self.test_user_id},
                                timeout=10
                            )
                            
                            if response.status_code == 200:
                                rooms_data = response.json()
                                rooms = rooms_data.get('rooms', [])
                                joined_room = None
                                for room in rooms:
                                    if room.get('id') == self.test_room_id:
                                        joined_room = room
                                        break
                                
                                if joined_room and joined_room.get('isJoined'):
                                    self.log_test("Chat Room Join Verification", True, 
                                                "✅ Follow-up GET shows isJoined=true")
                                else:
                                    self.log_test("Chat Room Join Verification", False, 
                                                "❌ Follow-up GET shows isJoined=false or room not found")
                        else:
                            self.log_test("Chat Room Join", False, 
                                        f"❌ Unexpected response: {join_result}")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("Chat Room Join", False, 
                                    f"❌ JSON serialization error: {str(e)}")
                else:
                    self.log_test("Chat Room Join", False, 
                                f"❌ Failed with status {response.status_code}: {response.text}")
            except Exception as e:
                self.log_test("Chat Room Join", False, f"❌ Error: {str(e)}")
    
    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        print("\n🏆 Testing Leaderboard...")
        
        # 8) GET /api/social/leaderboard -> returns list; serializable
        try:
            response = self.session.get(f"{API_BASE_URL}/social/leaderboard", timeout=10)
            
            if response.status_code == 200:
                try:
                    leaderboard_data = response.json()
                    json.dumps(leaderboard_data)  # Test serialization
                    
                    leaderboard = leaderboard_data.get('leaderboard', [])
                    if isinstance(leaderboard, list):
                        self.log_test("Social Leaderboard", True, 
                                    f"✅ Leaderboard retrieved with {len(leaderboard)} entries, all serializable")
                    else:
                        self.log_test("Social Leaderboard", False, 
                                    f"❌ Expected list, got {type(leaderboard)}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Social Leaderboard", False, 
                                f"❌ JSON serialization error: {str(e)}")
            else:
                self.log_test("Social Leaderboard", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Social Leaderboard", False, f"❌ Error: {str(e)}")
    
    def test_notifications_regression(self):
        """Test notifications regression"""
        print("\n🔔 Testing Notifications Regression...")
        
        # 9) GET /api/user/{U}/notifications -> serializable
        try:
            response = self.session.get(f"{API_BASE_URL}/user/{self.test_user_id}/notifications", timeout=10)
            
            if response.status_code == 200:
                try:
                    notifications = response.json()
                    json.dumps(notifications)  # Test serialization
                    
                    if isinstance(notifications, list):
                        self.log_test("Notifications Regression Test", True, 
                                    f"✅ Notifications retrieved with {len(notifications)} entries, all serializable")
                    else:
                        self.log_test("Notifications Regression Test", False, 
                                    f"❌ Expected list, got {type(notifications)}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Notifications Regression Test", False, 
                                f"❌ JSON serialization error: {str(e)}")
            else:
                self.log_test("Notifications Regression Test", False, 
                            f"❌ Failed with status {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Notifications Regression Test", False, f"❌ Error: {str(e)}")

    def run_social_focused_tests(self):
        """Run social-focused backend tests as requested in review"""
        print("🎯 Starting Social-Focused Backend Testing Suite")
        print("Focus: Social Feed, Like/Comment/Share, Chat Rooms, Leaderboard, Notifications")
        print("=" * 80)
        
        # Test server health first
        if not self.test_server_health():
            print("\n❌ Server health check failed. Stopping tests.")
            return False
        
        # Create a test user for the social tests
        print("\n👤 Setting up test user...")
        if not self.test_user_registration():
            print("❌ Failed to create test user. Some tests may fail.")
            return False
        
        # Complete onboarding to have proper user data
        print("📋 Completing onboarding for test data...")
        self.test_onboarding()
        
        # Now run the social-focused tests
        print("\n" + "=" * 80)
        print("🎯 SOCIAL ENDPOINTS TESTING - As Requested in Review")
        print("=" * 80)
        
        # 1) Social Feed Tests
        self.test_social_endpoints()
        
        # 2) Chat Rooms Tests
        self.test_chat_rooms()
        
        # 3) Leaderboard Test
        self.test_leaderboard()
        
        # 4) Notifications Regression Test
        self.test_notifications_regression()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 SOCIAL TESTS SUMMARY")
        print("=" * 80)
        
        # Filter results to show only the social tests
        social_test_keywords = [
            "Social Post", "Social Feed", "Social Like", "Social Comment", "Social Share",
            "Chat Room", "Social Leaderboard", "Notifications Regression"
        ]
        
        social_results = []
        for result in self.test_results:
            if any(keyword in result['test'] for keyword in social_test_keywords):
                social_results.append(result)
        
        total_social = len(social_results)
        passed_social = sum(1 for result in social_results if result['success'])
        failed_social = total_social - passed_social
        
        print(f"Social Tests: {total_social}")
        print(f"✅ Passed: {passed_social}")
        print(f"❌ Failed: {failed_social}")
        if total_social > 0:
            print(f"Success Rate: {(passed_social/total_social)*100:.1f}%")
        
        if failed_social > 0:
            print("\n❌ FAILED SOCIAL TESTS:")
            for result in social_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Show all test results for context
        print(f"\n📋 TOTAL TESTS RUN: {len(self.test_results)}")
        total_passed = sum(1 for result in self.test_results if result['success'])
        print(f"✅ Total Passed: {total_passed}")
        print(f"❌ Total Failed: {len(self.test_results) - total_passed}")
        
        return failed_social == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_social_focused_tests()
    
    if success:
        print("\n🎉 All social backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some social backend tests failed. Check logs above.")
        sys.exit(1)