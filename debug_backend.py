#!/usr/bin/env python3
"""
Debug Backend Issues
"""

import requests
import json
import os
import sys
import uuid
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Get backend URL
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            backend_url = line.split('=', 1)[1].strip()
            break

API_BASE_URL = f"{backend_url}/api"
print(f"Testing: {API_BASE_URL}")

async def debug_database():
    """Debug database issues"""
    print("\n🔍 Debugging Database...")
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Check all users
        users = await db.users.find({}).to_list(10)
        print(f"Found {len(users)} users in database:")
        for user in users:
            print(f"  - {user.get('name', 'Unknown')} ({user.get('email', 'No email')}) ID: {user.get('id', 'No ID')}")
        
        client.close()
    except Exception as e:
        print(f"Database error: {e}")

def debug_ai_chat():
    """Debug AI chat issues"""
    print("\n🤖 Debugging AI Chat...")
    
    # First create a user
    test_user_data = {
        "name": "Debug User",
        "email": f"debug.{uuid.uuid4()}@test.com",
        "password": "testpass"
    }
    
    try:
        # Register user
        response = requests.post(f"{API_BASE_URL}/auth/register", json=test_user_data, timeout=10)
        if response.status_code == 200:
            user_data = response.json()
            user_id = user_data['id']
            print(f"✅ Created test user: {user_id}")
            
            # Try AI chat
            chat_data = {
                "user_id": user_id,
                "session_id": str(uuid.uuid4()),
                "message": "Hello"
            }
            
            chat_response = requests.post(f"{API_BASE_URL}/chat", json=chat_data, timeout=30)
            print(f"Chat response status: {chat_response.status_code}")
            print(f"Chat response: {chat_response.text}")
            
        else:
            print(f"❌ Failed to create user: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"AI Chat debug error: {e}")

def debug_login():
    """Debug login issues"""
    print("\n🔐 Debugging Login...")
    
    # Create a user first
    test_email = f"login.test.{uuid.uuid4()}@test.com"
    test_user_data = {
        "name": "Login Test User",
        "email": test_email,
        "password": "testpass123"
    }
    
    try:
        # Register
        reg_response = requests.post(f"{API_BASE_URL}/auth/register", json=test_user_data, timeout=10)
        print(f"Registration: {reg_response.status_code} - {reg_response.text}")
        
        if reg_response.status_code == 200:
            # Try login with different methods
            
            # Method 1: Query parameters
            login_response1 = requests.post(
                f"{API_BASE_URL}/auth/login",
                params={"email": test_email, "password": "testpass123"},
                timeout=10
            )
            print(f"Login method 1 (params): {login_response1.status_code} - {login_response1.text}")
            
            # Method 2: Form data
            login_response2 = requests.post(
                f"{API_BASE_URL}/auth/login",
                data={"email": test_email, "password": "testpass123"},
                timeout=10
            )
            print(f"Login method 2 (form): {login_response2.status_code} - {login_response2.text}")
            
            # Method 3: JSON
            login_response3 = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": test_email, "password": "testpass123"},
                timeout=10
            )
            print(f"Login method 3 (json): {login_response3.status_code} - {login_response3.text}")
            
    except Exception as e:
        print(f"Login debug error: {e}")

if __name__ == "__main__":
    asyncio.run(debug_database())
    debug_ai_chat()
    debug_login()