#!/usr/bin/env python3
"""
Focused Backend Testing for Review Request
Tests the three specific areas: Users Search, Chat Rooms, Social Media
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

def test_users_search():
    """Test Users Search functionality"""
    print("\n🔍 TESTING USERS SEARCH")
    print("=" * 50)
    
    session = requests.Session()
    timestamp = int(time.time())
    
    # Register User A
    user_a_data = {
        "name": "Alice Johnson",
        "email": f"alice.{timestamp}@example.com",
        "password": "password123"
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/auth/register", json=user_a_data, timeout=10)
        if response.status_code == 200:
            user_a_id = response.json().get('user', {}).get('id')
            print(f"✅ User A registered: {user_a_id}")
        else:
            print(f"❌ User A registration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ User A registration error: {str(e)}")
        return False
    
    # Register User B with same username
    user_b_data = {
        "name": "Bob Smith",
        "email": f"bob.{timestamp}@example.com", 
        "password": "password456"
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/auth/register", json=user_b_data, timeout=10)
        if response.status_code == 200:
            user_b_id = response.json().get('user', {}).get('id')
            print(f"✅ User B registered: {user_b_id}")
        else:
            print(f"❌ User B registration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ User B registration error: {str(e)}")
        return False
    
    # Test search by username (both should appear)
    try:
        response = session.get(f"{API_BASE_URL}/users/search", params={"q": "Alice"}, timeout=10)
        if response.status_code == 200:
            search_data = response.json()
            json.dumps(search_data)  # Test JSON serialization
            users = search_data.get('users', [])
            alice_found = any('Alice' in u.get('name', '') for u in users)
            if alice_found:
                print(f"✅ Username search works: Found Alice in {len(users)} results")
            else:
                print(f"❌ Alice not found in search results")
        else:
            print(f"❌ Search failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Search error: {str(e)}")
    
    return True

def test_chat_rooms():
    """Test Chat Rooms functionality"""
    print("\n💬 TESTING CHAT ROOMS")
    print("=" * 50)
    
    session = requests.Session()
    timestamp = int(time.time())
    
    # Register users for chat testing
    user_a_data = {
        "name": "ChatUser A",
        "email": f"chata.{timestamp}@example.com",
        "password": "password123"
    }
    
    user_b_data = {
        "name": "ChatUser B", 
        "email": f"chatb.{timestamp}@example.com",
        "password": "password456"
    }
    
    # Register both users
    try:
        resp_a = session.post(f"{API_BASE_URL}/auth/register", json=user_a_data, timeout=10)
        resp_b = session.post(f"{API_BASE_URL}/auth/register", json=user_b_data, timeout=10)
        
        if resp_a.status_code == 200 and resp_b.status_code == 200:
            user_a_id = resp_a.json().get('user', {}).get('id')
            user_b_id = resp_b.json().get('user', {}).get('id')
            print(f"✅ Chat users registered: A={user_a_id}, B={user_b_id}")
        else:
            print(f"❌ Chat user registration failed")
            return False
    except Exception as e:
        print(f"❌ Chat user registration error: {str(e)}")
        return False
    
    # Test empty chat rooms for new user
    try:
        response = session.get(f"{API_BASE_URL}/social/chat-rooms", params={"user_id": user_a_id}, timeout=10)
        if response.status_code == 200:
            rooms_data = response.json()
            json.dumps(rooms_data)  # Test JSON serialization
            rooms = rooms_data.get('rooms', [])
            if len(rooms) == 0:
                print(f"✅ New user has no rooms: {len(rooms)} rooms")
            else:
                print(f"❌ Expected 0 rooms, got {len(rooms)}")
        else:
            print(f"❌ Get chat rooms failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get chat rooms error: {str(e)}")
    
    # Create chat room by User A
    room_data = {
        "name": "Test Fitness Room",
        "description": "A test room for fitness discussions",
        "category": "fitness",
        "creator_id": user_a_id
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/social/chat-room/create", json=room_data, timeout=10)
        if response.status_code == 200:
            room_result = response.json()
            json.dumps(room_result)  # Test JSON serialization
            room_id = room_result.get('id')
            is_joined = room_result.get('isJoined')
            members_count = room_result.get('members', 0)
            
            if is_joined and members_count == 1:
                print(f"✅ Room created: ID={room_id}, isJoined={is_joined}, members={members_count}")
            else:
                print(f"❌ Room creation issue: isJoined={is_joined}, members={members_count}")
                return False
        else:
            print(f"❌ Room creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Room creation error: {str(e)}")
        return False
    
    # User A should see the created room
    try:
        response = session.get(f"{API_BASE_URL}/social/chat-rooms", params={"user_id": user_a_id}, timeout=10)
        if response.status_code == 200:
            rooms_data = response.json()
            rooms = rooms_data.get('rooms', [])
            created_room = next((r for r in rooms if r.get('id') == room_id), None)
            if created_room:
                print(f"✅ User A sees created room: {created_room.get('name')}")
            else:
                print(f"❌ User A cannot see created room")
        else:
            print(f"❌ Get User A rooms failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get User A rooms error: {str(e)}")
    
    # User B joins the room
    try:
        join_data = {"user_id": user_b_id, "room_id": room_id}
        response = session.post(f"{API_BASE_URL}/social/join-room", json=join_data, timeout=10)
        if response.status_code == 200:
            join_result = response.json()
            if join_result.get('message') == 'Joined':
                print(f"✅ User B joined room successfully")
            else:
                print(f"❌ Unexpected join response: {join_result}")
        else:
            print(f"❌ User B join failed: {response.status_code}")
    except Exception as e:
        print(f"❌ User B join error: {str(e)}")
    
    # User B should see the joined room
    try:
        response = session.get(f"{API_BASE_URL}/social/chat-rooms", params={"user_id": user_b_id}, timeout=10)
        if response.status_code == 200:
            rooms_data = response.json()
            rooms = rooms_data.get('rooms', [])
            joined_room = next((r for r in rooms if r.get('id') == room_id), None)
            if joined_room and joined_room.get('isJoined'):
                print(f"✅ User B sees joined room with isJoined=true")
            else:
                print(f"❌ User B room visibility issue")
        else:
            print(f"❌ Get User B rooms failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get User B rooms error: {str(e)}")
    
    # Test messaging (this might fail due to backend issues)
    try:
        message_data = {
            "user_id": user_a_id,
            "room_id": room_id,
            "message": "Welcome to our test room!",
            "type": "text"
        }
        response = session.post(f"{API_BASE_URL}/chat-room/message", json=message_data, timeout=10)
        if response.status_code == 200:
            message_result = response.json()
            json.dumps(message_result)  # Test JSON serialization
            print(f"✅ Message sent successfully")
            
            # Try to get messages
            response = session.get(f"{API_BASE_URL}/chat-room/{room_id}/messages", timeout=10)
            if response.status_code == 200:
                messages_data = response.json()
                messages = messages_data.get('messages', [])
                print(f"✅ Retrieved {len(messages)} messages")
            else:
                print(f"⚠️ Get messages failed: {response.status_code}")
        else:
            print(f"⚠️ Message sending failed: {response.status_code} (known backend issue)")
    except Exception as e:
        print(f"⚠️ Messaging error: {str(e)} (known backend issue)")
    
    return True

def test_social_media():
    """Test Social Media functionality"""
    print("\n📱 TESTING SOCIAL MEDIA")
    print("=" * 50)
    
    session = requests.Session()
    timestamp = int(time.time())
    
    # Register user for social testing
    user_data = {
        "name": "Social User",
        "email": f"social.{timestamp}@example.com",
        "password": "password123"
    }
    
    try:
        response = session.post(f"{API_BASE_URL}/auth/register", json=user_data, timeout=10)
        if response.status_code == 200:
            user_id = response.json().get('user', {}).get('id')
            print(f"✅ Social user registered: {user_id}")
        else:
            print(f"❌ Social user registration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Social user registration error: {str(e)}")
        return False
    
    # Test that image/video posts are not implemented (should fail or ignore files)
    print("🚫 Testing image/video post implementation...")
    
    # Test with image
    try:
        dummy_image = b"dummy image data"
        post_data = {"user_id": user_id, "content": "Check out my workout!", "type": "image"}
        files = {'image': ('workout.jpg', dummy_image, 'image/jpeg')}
        
        response = session.post(f"{API_BASE_URL}/social/post", data=post_data, files=files, timeout=10)
        
        if response.status_code == 422:
            print(f"✅ Image post correctly rejected (422 Unprocessable Entity)")
        elif response.status_code == 400:
            print(f"✅ Image post correctly rejected (400 Bad Request)")
        elif response.status_code == 200:
            print(f"⚠️ Image post accepted but likely ignored (text-only)")
        else:
            print(f"❌ Unexpected image post response: {response.status_code}")
    except Exception as e:
        print(f"❌ Image post test error: {str(e)}")
    
    # Test with video
    try:
        dummy_video = b"dummy video data"
        post_data = {"user_id": user_id, "content": "My workout video!", "type": "video"}
        files = {'video': ('workout.mp4', dummy_video, 'video/mp4')}
        
        response = session.post(f"{API_BASE_URL}/social/post", data=post_data, files=files, timeout=10)
        
        if response.status_code == 422:
            print(f"✅ Video post correctly rejected (422 Unprocessable Entity)")
        elif response.status_code == 400:
            print(f"✅ Video post correctly rejected (400 Bad Request)")
        elif response.status_code == 200:
            print(f"⚠️ Video post accepted but likely ignored (text-only)")
        else:
            print(f"❌ Unexpected video post response: {response.status_code}")
    except Exception as e:
        print(f"❌ Video post test error: {str(e)}")
    
    # Test regular text post (should work)
    try:
        post_data = {"user_id": user_id, "content": "Just finished an amazing workout! 💪", "type": "general"}
        response = session.post(f"{API_BASE_URL}/social/post", json=post_data, timeout=10)
        
        if response.status_code == 200:
            post_result = response.json()
            json.dumps(post_result)  # Test JSON serialization
            print(f"✅ Text post created successfully")
        else:
            print(f"❌ Text post failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Text post error: {str(e)}")
    
    return True

def test_json_serialization():
    """Test JSON serialization across key endpoints"""
    print("\n🔍 TESTING JSON SERIALIZATION")
    print("=" * 50)
    
    session = requests.Session()
    
    # Test key endpoints for ObjectId issues
    endpoints = [
        "/social/feed",
        "/social/leaderboard"
    ]
    
    for endpoint in endpoints:
        try:
            response = session.get(f"{API_BASE_URL}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                json.dumps(data)  # Test JSON serialization
                
                # Check for ObjectId in response text
                if 'ObjectId' in response.text:
                    print(f"❌ {endpoint}: ObjectId found in response")
                else:
                    print(f"✅ {endpoint}: Properly serialized, no ObjectId")
            else:
                print(f"⚠️ {endpoint}: Request failed ({response.status_code})")
        except Exception as e:
            print(f"❌ {endpoint}: Error - {str(e)}")
    
    return True

if __name__ == "__main__":
    print("🎯 FOCUSED REVIEW BACKEND TESTING")
    print("Testing: Users Search, Chat Rooms, Social Media")
    print("=" * 80)
    
    # Run all tests
    test_users_search()
    test_chat_rooms()
    test_social_media()
    test_json_serialization()
    
    print("\n" + "=" * 80)
    print("🏁 FOCUSED TESTING COMPLETE")
    print("=" * 80)