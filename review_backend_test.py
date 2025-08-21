#!/usr/bin/env python3
"""
Backend Testing Suite for Review Request
Tests specific features: Users Search, Chat Rooms, Social Media
"""

import requests
import json
import os
import sys
from datetime import datetime
import uuid
import time

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

class ReviewBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.user_a_id = None
        self.user_b_id = None
        self.user_a_email = f"usera.{int(time.time())}@example.com"
        self.user_b_email = f"userb.{int(time.time())}@example.com"
        self.shared_username = f"testuser{int(time.time())}"
        self.room_id = None
        
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
    
    def test_users_search(self):
        """Test Users Search functionality"""
        print("\n🔍 Testing Users Search...")
        
        # 1) POST /api/auth/register user A and B (same username allowed)
        print("👤 Registering User A...")
        user_a_data = {
            "name": "Alice Johnson",
            "email": self.user_a_email,
            "password": "password123"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=user_a_data,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.user_a_id = user_data.get('user', {}).get('id')
                self.log_test("User A Registration", True, 
                            f"User A registered with ID: {self.user_a_id}")
                
                # Update user A with username
                update_data = {"username": self.shared_username}
                self.session.patch(
                    f"{API_BASE_URL}/user/{self.user_a_id}",
                    json=update_data,
                    timeout=10
                )
            else:
                self.log_test("User A Registration", False, 
                            f"Registration failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("User A Registration", False, f"Error: {str(e)}")
            return False
        
        print("👤 Registering User B...")
        user_b_data = {
            "name": "Bob Smith", 
            "email": self.user_b_email,
            "password": "password456"
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/auth/register",
                json=user_b_data,
                timeout=10
            )
            
            if response.status_code == 200:
                user_data = response.json()
                self.user_b_id = user_data.get('user', {}).get('id')
                self.log_test("User B Registration", True, 
                            f"User B registered with ID: {self.user_b_id}")
                
                # Update user B with same username (testing same username allowed)
                update_data = {"username": self.shared_username}
                self.session.patch(
                    f"{API_BASE_URL}/user/{self.user_b_id}",
                    json=update_data,
                    timeout=10
                )
            else:
                self.log_test("User B Registration", False, 
                            f"Registration failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("User B Registration", False, f"Error: {str(e)}")
            return False
        
        # 2) GET /api/users/search?q=<username> and q=<name-part>; ensure both A and B appear in results
        print("🔍 Testing username search...")
        try:
            response = self.session.get(
                f"{API_BASE_URL}/users/search",
                params={"q": self.shared_username},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    search_data = response.json()
                    json.dumps(search_data)  # Test JSON serialization
                    
                    users = search_data.get('users', [])
                    found_users = [u.get('name') for u in users]
                    
                    if len(users) >= 2:
                        # Check if both users appear
                        alice_found = any('Alice' in name for name in found_users)
                        bob_found = any('Bob' in name for name in found_users)
                        
                        if alice_found and bob_found:
                            self.log_test("Username Search", True, 
                                        f"Both users found in search results: {found_users}")
                        else:
                            self.log_test("Username Search", False, 
                                        f"Not all users found. Results: {found_users}")
                    else:
                        self.log_test("Username Search", False, 
                                    f"Expected 2+ users, got {len(users)}: {found_users}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Username Search", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("Username Search", False, 
                            f"Search failed: {response.status_code}")
        except Exception as e:
            self.log_test("Username Search", False, f"Error: {str(e)}")
        
        # Test name-part search
        print("🔍 Testing name-part search...")
        try:
            response = self.session.get(
                f"{API_BASE_URL}/users/search",
                params={"q": "Alice"},  # Search for part of name
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    search_data = response.json()
                    json.dumps(search_data)  # Test JSON serialization
                    
                    users = search_data.get('users', [])
                    alice_found = any('Alice' in u.get('name', '') for u in users)
                    
                    if alice_found:
                        self.log_test("Name-part Search", True, 
                                    f"Alice found in name-part search")
                    else:
                        self.log_test("Name-part Search", False, 
                                    f"Alice not found in search results")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Name-part Search", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("Name-part Search", False, 
                            f"Search failed: {response.status_code}")
        except Exception as e:
            self.log_test("Name-part Search", False, f"Error: {str(e)}")
        
        return True
    
    def test_chat_rooms(self):
        """Test Chat Rooms functionality"""
        print("\n💬 Testing Chat Rooms...")
        
        if not self.user_a_id or not self.user_b_id:
            self.log_test("Chat Rooms Setup", False, "User IDs not available")
            return False
        
        # 1) Ensure /api/social/chat-rooms returns empty array for new user with no rooms
        print("📋 Testing empty chat rooms for new user...")
        try:
            response = self.session.get(
                f"{API_BASE_URL}/social/chat-rooms",
                params={"user_id": self.user_a_id},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    rooms_data = response.json()
                    json.dumps(rooms_data)  # Test JSON serialization
                    
                    rooms = rooms_data.get('rooms', [])
                    if len(rooms) == 0:
                        self.log_test("Empty Chat Rooms", True, 
                                    "New user has no chat rooms as expected")
                    else:
                        self.log_test("Empty Chat Rooms", False, 
                                    f"Expected 0 rooms, got {len(rooms)}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Empty Chat Rooms", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("Empty Chat Rooms", False, 
                            f"Request failed: {response.status_code}")
        except Exception as e:
            self.log_test("Empty Chat Rooms", False, f"Error: {str(e)}")
        
        # 2) POST /api/social/chat-room/create by A; ensure it returns room with isJoined true and members count 1
        print("🏗️ Creating chat room by User A...")
        room_data = {
            "name": "Fitness Motivation Group",
            "description": "A group for sharing fitness motivation and tips",
            "category": "fitness",
            "type": "public",
            "creator_id": self.user_a_id
        }
        
        try:
            response = self.session.post(
                f"{API_BASE_URL}/social/chat-room/create",
                json=room_data,
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    room_result = response.json()
                    json.dumps(room_result)  # Test JSON serialization
                    
                    self.room_id = room_result.get('id')
                    is_joined = room_result.get('isJoined')
                    members_count = room_result.get('members', 0)
                    
                    if is_joined and members_count == 1:
                        self.log_test("Chat Room Creation", True, 
                                    f"Room created with ID: {self.room_id}, isJoined: {is_joined}, members: {members_count}")
                    else:
                        self.log_test("Chat Room Creation", False, 
                                    f"Room creation issue - isJoined: {is_joined}, members: {members_count}")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("Chat Room Creation", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("Chat Room Creation", False, 
                            f"Creation failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Chat Room Creation", False, f"Error: {str(e)}")
            return False
        
        # 3) GET /api/social/chat-rooms?user_id=A -> contains created room
        print("📋 Verifying User A can see created room...")
        try:
            response = self.session.get(
                f"{API_BASE_URL}/social/chat-rooms",
                params={"user_id": self.user_a_id},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    rooms_data = response.json()
                    json.dumps(rooms_data)  # Test JSON serialization
                    
                    rooms = rooms_data.get('rooms', [])
                    created_room = None
                    for room in rooms:
                        if room.get('id') == self.room_id:
                            created_room = room
                            break
                    
                    if created_room:
                        self.log_test("User A Room Visibility", True, 
                                    f"User A can see created room: {created_room.get('name')}")
                    else:
                        self.log_test("User A Room Visibility", False, 
                                    f"Created room not found in User A's rooms")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("User A Room Visibility", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("User A Room Visibility", False, 
                            f"Request failed: {response.status_code}")
        except Exception as e:
            self.log_test("User A Room Visibility", False, f"Error: {str(e)}")
        
        # 4) POST /api/social/join-room with B joining A's room -> returns Joined
        print("🤝 User B joining User A's room...")
        if self.room_id:
            try:
                join_data = {
                    "user_id": self.user_b_id,
                    "room_id": self.room_id
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/social/join-room",
                    json=join_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        join_result = response.json()
                        json.dumps(join_result)  # Test JSON serialization
                        
                        if join_result.get('message') == 'Joined':
                            self.log_test("User B Join Room", True, 
                                        "User B successfully joined the room")
                        else:
                            self.log_test("User B Join Room", False, 
                                        f"Unexpected response: {join_result}")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("User B Join Room", False, 
                                    f"JSON serialization error: {str(e)}")
                else:
                    self.log_test("User B Join Room", False, 
                                f"Join failed: {response.status_code}")
            except Exception as e:
                self.log_test("User B Join Room", False, f"Error: {str(e)}")
        
        # 5) GET /api/social/chat-rooms?user_id=B -> contains joined room
        print("📋 Verifying User B can see joined room...")
        try:
            response = self.session.get(
                f"{API_BASE_URL}/social/chat-rooms",
                params={"user_id": self.user_b_id},
                timeout=10
            )
            
            if response.status_code == 200:
                try:
                    rooms_data = response.json()
                    json.dumps(rooms_data)  # Test JSON serialization
                    
                    rooms = rooms_data.get('rooms', [])
                    joined_room = None
                    for room in rooms:
                        if room.get('id') == self.room_id:
                            joined_room = room
                            break
                    
                    if joined_room:
                        is_joined = joined_room.get('isJoined', False)
                        if is_joined:
                            self.log_test("User B Room Visibility", True, 
                                        f"User B can see joined room with isJoined=true")
                        else:
                            self.log_test("User B Room Visibility", False, 
                                        f"Room found but isJoined=false")
                    else:
                        self.log_test("User B Room Visibility", False, 
                                    f"Joined room not found in User B's rooms")
                except (json.JSONDecodeError, TypeError) as e:
                    self.log_test("User B Room Visibility", False, 
                                f"JSON serialization error: {str(e)}")
            else:
                self.log_test("User B Room Visibility", False, 
                            f"Request failed: {response.status_code}")
        except Exception as e:
            self.log_test("User B Room Visibility", False, f"Error: {str(e)}")
        
        # 6) POST /api/chat-room/message by A, then GET messages -> message present
        print("💬 Testing chat room messaging...")
        if self.room_id:
            # Send message by User A
            try:
                message_data = {
                    "user_id": self.user_a_id,
                    "room_id": self.room_id,
                    "message": "Welcome to our fitness motivation group! Let's achieve our goals together! 💪",
                    "type": "text"
                }
                
                response = self.session.post(
                    f"{API_BASE_URL}/chat-room/message",
                    json=message_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    try:
                        message_result = response.json()
                        json.dumps(message_result)  # Test JSON serialization
                        
                        message_id = message_result.get('id')
                        if message_id:
                            self.log_test("Send Chat Message", True, 
                                        f"Message sent with ID: {message_id}")
                            
                            # Now get messages to verify it's there
                            response = self.session.get(
                                f"{API_BASE_URL}/chat-room/{self.room_id}/messages",
                                params={"user_id": self.user_a_id},
                                timeout=10
                            )
                            
                            if response.status_code == 200:
                                try:
                                    messages_data = response.json()
                                    json.dumps(messages_data)  # Test JSON serialization
                                    
                                    messages = messages_data.get('messages', [])
                                    sent_message = None
                                    for msg in messages:
                                        if msg.get('id') == message_id:
                                            sent_message = msg
                                            break
                                    
                                    if sent_message:
                                        self.log_test("Get Chat Messages", True, 
                                                    f"Sent message found in chat history")
                                    else:
                                        self.log_test("Get Chat Messages", False, 
                                                    f"Sent message not found in {len(messages)} messages")
                                except (json.JSONDecodeError, TypeError) as e:
                                    self.log_test("Get Chat Messages", False, 
                                                f"JSON serialization error: {str(e)}")
                            else:
                                self.log_test("Get Chat Messages", False, 
                                            f"Get messages failed: {response.status_code}")
                        else:
                            self.log_test("Send Chat Message", False, 
                                        "Message sent but no ID returned")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test("Send Chat Message", False, 
                                    f"JSON serialization error: {str(e)}")
                else:
                    self.log_test("Send Chat Message", False, 
                                f"Send message failed: {response.status_code}")
            except Exception as e:
                self.log_test("Send Chat Message", False, f"Error: {str(e)}")
        
        return True
    
    def test_social_media(self):
        """Test Social Media functionality"""
        print("\n📱 Testing Social Media...")
        
        # Verify POST /api/social/post with image/video is not implemented
        print("🚫 Testing image/video post (should not be implemented)...")
        
        if not self.user_a_id:
            self.log_test("Social Media Setup", False, "User A ID not available")
            return False
        
        # Test with image data
        try:
            # Create dummy image data
            dummy_image = b"dummy image data for testing"
            
            # Try to post with image - this should either fail or ignore the image
            post_data = {
                "user_id": self.user_a_id,
                "content": "Check out my workout progress!",
                "type": "image"
            }
            
            files = {'image': ('workout.jpg', dummy_image, 'image/jpeg')}
            
            response = self.session.post(
                f"{API_BASE_URL}/social/post",
                data=post_data,  # Using data instead of json when sending files
                files=files,
                timeout=10
            )
            
            # The endpoint should either:
            # 1. Return 400/405 (not implemented)
            # 2. Return 200 but ignore the image (text-only post)
            
            if response.status_code == 400 or response.status_code == 405:
                self.log_test("Image/Video Post Not Implemented", True, 
                            f"Image post correctly rejected with status {response.status_code}")
            elif response.status_code == 200:
                # Check if it created a text-only post (ignoring image)
                try:
                    result = response.json()
                    if 'id' in result:
                        self.log_test("Image/Video Post Not Implemented", True, 
                                    "Image ignored, text-only post created (acceptable behavior)")
                    else:
                        self.log_test("Image/Video Post Not Implemented", False, 
                                    "Unexpected response format")
                except:
                    self.log_test("Image/Video Post Not Implemented", False, 
                                "Response not JSON serializable")
            else:
                self.log_test("Image/Video Post Not Implemented", False, 
                            f"Unexpected status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Image/Video Post Not Implemented", False, f"Error: {str(e)}")
        
        # Test with video data
        try:
            # Create dummy video data
            dummy_video = b"dummy video data for testing"
            
            post_data = {
                "user_id": self.user_a_id,
                "content": "My workout routine video!",
                "type": "video"
            }
            
            files = {'video': ('workout.mp4', dummy_video, 'video/mp4')}
            
            response = self.session.post(
                f"{API_BASE_URL}/social/post",
                data=post_data,
                files=files,
                timeout=10
            )
            
            if response.status_code == 400 or response.status_code == 405:
                self.log_test("Video Post Not Implemented", True, 
                            f"Video post correctly rejected with status {response.status_code}")
            elif response.status_code == 200:
                try:
                    result = response.json()
                    if 'id' in result:
                        self.log_test("Video Post Not Implemented", True, 
                                    "Video ignored, text-only post created (acceptable behavior)")
                    else:
                        self.log_test("Video Post Not Implemented", False, 
                                    "Unexpected response format")
                except:
                    self.log_test("Video Post Not Implemented", False, 
                                "Response not JSON serializable")
            else:
                self.log_test("Video Post Not Implemented", False, 
                            f"Unexpected status code: {response.status_code}")
                
        except Exception as e:
            self.log_test("Video Post Not Implemented", False, f"Error: {str(e)}")
        
        return True
    
    def test_json_serialization(self):
        """Test that all responses are JSON serializable and no ObjectId in payload"""
        print("\n🔍 Testing JSON Serialization...")
        
        # Test a few key endpoints for ObjectId leaks
        endpoints_to_test = [
            f"/user/{self.user_a_id}",
            f"/user/{self.user_a_id}/notifications",
            "/social/feed",
            "/social/leaderboard"
        ]
        
        for endpoint in endpoints_to_test:
            try:
                response = self.session.get(f"{API_BASE_URL}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        json.dumps(data)  # Test JSON serialization
                        
                        # Check for ObjectId strings in response
                        response_text = response.text
                        if 'ObjectId' in response_text:
                            self.log_test(f"JSON Serialization {endpoint}", False, 
                                        "ObjectId found in response")
                        else:
                            self.log_test(f"JSON Serialization {endpoint}", True, 
                                        "No ObjectId found, properly serialized")
                    except (json.JSONDecodeError, TypeError) as e:
                        self.log_test(f"JSON Serialization {endpoint}", False, 
                                    f"Serialization error: {str(e)}")
                else:
                    self.log_test(f"JSON Serialization {endpoint}", False, 
                                f"Request failed: {response.status_code}")
            except Exception as e:
                self.log_test(f"JSON Serialization {endpoint}", False, f"Error: {str(e)}")
    
    def run_review_tests(self):
        """Run all tests for the review request"""
        print("🎯 Starting Review Backend Testing Suite")
        print("Focus: Users Search, Chat Rooms, Social Media")
        print("=" * 80)
        
        # Test 1: Users Search
        self.test_users_search()
        
        # Test 2: Chat Rooms
        self.test_chat_rooms()
        
        # Test 3: Social Media
        self.test_social_media()
        
        # Test 4: JSON Serialization
        self.test_json_serialization()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 REVIEW TESTS SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        if total_tests > 0:
            print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = ReviewBackendTester()
    success = tester.run_review_tests()
    
    if success:
        print("\n🎉 All review backend tests passed!")
        sys.exit(0)
    else:
        print("\n⚠️  Some review backend tests failed. Check logs above.")
        sys.exit(1)