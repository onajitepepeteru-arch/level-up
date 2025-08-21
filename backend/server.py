from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Depends, Form
# NOTE: All backend routes are prefixed with /api via APIRouter to comply with ingress

from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib
import jwt
import bcrypt
import base64
from PIL import Image
import io
import asyncio
import json

# Custom JSON encoder for MongoDB ObjectId
class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, '__dict__'):
            return {key: str(value) if str(type(value)) == "<class 'bson.objectid.ObjectId'>" else value 
                   for key, value in obj.__dict__.items()}
        return super().default(obj)

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result[key] = str(value)
            elif hasattr(value, '__dict__'):
                result[key] = serialize_doc(value.__dict__)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) for item in value]
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    
    return doc

# Content moderation imports
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Leveling-Up API", description="Fitness App Backend", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    goals: Optional[List[str]] = []
    body_type: Optional[str] = None
    activity_level: Optional[str] = None
    health_conditions: Optional[List[str]] = []
    level: int = 1
    xp: int = 0
    avatar_url: Optional[str] = None
    subscription_plan: str = "Free"
    subscription_active: bool = False
    subscription_end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_verified: bool = False
    onboarding_completed: bool = False
    total_scans: int = 0
    streak_days: int = 0
    last_activity: Optional[datetime] = None

class UserRegistration(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class OnboardingData(BaseModel):
    user_id: str
    age: int
    gender: str
    goals: List[str]
    body_type: str = Field(alias='bodyType')
    activity_level: str = Field(alias='activityLevel')
    health_conditions: List[str] = []

    class Config:
        populate_by_name = True

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scan_type: str  # 'body', 'face', 'food'
    file_path: Optional[str] = None
    analysis_result: dict = {}
    xp_earned: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_approved: bool = True  # For content moderation

class AIChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, warning, success, error

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str
    read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow().timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

async def content_moderation_check(image_data: bytes) -> bool:
    """Basic content moderation using computer vision"""
    try:
        if not OPENCV_AVAILABLE:
            logger.warning("OpenCV not available, skipping content moderation")
            return True
            
        # Convert bytes to image
        image = Image.open(io.BytesIO(image_data))
        image_np = np.array(image)
        
        # Convert to RGB if needed
        if len(image_np.shape) == 3 and image_np.shape[2] == 3:
            image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        else:
            image_cv = image_np
        
        # Basic skin tone detection (simple approach)
        # This is a basic implementation - in production, use proper AI services
        hsv = cv2.cvtColor(image_cv, cv2.COLOR_BGR2HSV)
        
        # Define skin color range in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin detection
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_pixels = cv2.countNonZero(skin_mask)
        total_pixels = image_cv.shape[0] * image_cv.shape[1]
        
        # If more than 30% is detected as skin, flag for review
        skin_ratio = skin_pixels / total_pixels
        
        if skin_ratio > 0.3:
            logger.warning(f"High skin ratio detected: {skin_ratio:.2f}")
            return False  # Needs manual review
        
        return True  # Approved
        
    except Exception as e:
        logger.error(f"Content moderation error: {str(e)}")
        return True  # Default to approved if error occurs

# API Endpoints

# Authentication Endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserRegistration):
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user with hashed password
        user_dict = {
            "id": str(uuid.uuid4()),
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": hash_password(user_data.password),
            "level": 1,
            "xp": 0,
            "subscription_plan": "Free",
            "subscription_active": False,
            "onboarding_completed": False,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "total_scans": 0,
            "streak_days": 0
        }
        
        # Insert user into database
        result = await db.users.insert_one(user_dict)
        
        # Create JWT token
        token = create_jwt_token(user_dict["id"])
        
        # Remove password hash and _id from response
        user_response = serialize_doc(user_dict)
        del user_response['password_hash']
        if '_id' in user_response:
            del user_response['_id']
        
        return {
            "message": "User registered successfully",
            "user": user_response,
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login")
async def login_user(user_data: UserLogin):
    try:
        # Find user by email
        user_doc = await db.users.find_one({"email": user_data.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user_data.password, user_doc['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        await db.users.update_one(
            {"email": user_data.email},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create JWT token
        token = create_jwt_token(user_doc['id'])
        
        # Serialize and remove password hash and _id from response
        user_response = serialize_doc(user_doc)
        del user_response['password_hash']
        if '_id' in user_response:
            del user_response['_id']
        
        return {
            "message": "Login successful",
            "user": user_response,
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

# Onboarding Endpoint
@api_router.post("/onboarding")
async def complete_onboarding(onboarding_data: OnboardingData):
    try:
        user_id = onboarding_data.user_id
        
        # Update user with onboarding data
        update_data = {
            "age": onboarding_data.age,
            "gender": onboarding_data.gender,
            "goals": onboarding_data.goals,
            "body_type": onboarding_data.body_type,
            "activity_level": onboarding_data.activity_level,
            "health_conditions": onboarding_data.health_conditions,
            "onboarding_completed": True,
            "xp": 50,  # Initial XP for completing onboarding
        }
        
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create notification
        notification = Notification(
            user_id=user_id,
            title="Welcome to Leveling-Up!",
            message="Congratulations! You've completed your profile setup and earned 50 XP!",
            type="success"
        )
        await db.notifications.insert_one(notification.dict())
        
        return {
            "message": "Onboarding completed successfully",
            "xp_earned": 50
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Onboarding failed")

# AI Chat Endpoint
@api_router.post("/chat")
async def chat_with_ai(chat_request: AIChatRequest):
    try:
        # Get user data for context
        user = await db.users.find_one({"id": chat_request.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent scans for context
        recent_scans = await db.scans.find(
            {"user_id": chat_request.user_id}
        ).sort("timestamp", -1).limit(5).to_list(5)
        
        # Build context message
        system_message = f"""You are a professional AI fitness coach for Leveling-Up. 
User Profile:
- Name: {user.get('name', 'User')}
- Level: {user.get('level', 1)}
- XP: {user.get('xp', 0)}
- Goals: {', '.join(user.get('goals', []))}
- Activity Level: {user.get('activity_level', 'Not specified')}
- Recent activity: {len(recent_scans)} scans completed

Provide personalized, actionable advice. Be encouraging and motivational. 
Keep responses under 200 words and focus on their goals and current level."""

        try:
            # Initialize AI chat with error handling
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=chat_request.session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Send message to AI
            user_message = UserMessage(text=chat_request.message)
            ai_response = await chat.send_message(user_message)
            
        except Exception as ai_error:
            logger.error(f"AI integration error: {str(ai_error)}")
            # Fallback response when AI is unavailable
            ai_response = f"Hello! I'm your Leveling-Up fitness coach. I'm currently experiencing some technical issues, but I'm here to help! Based on your goals ({', '.join(user.get('goals', ['general fitness']))}), I'd recommend starting with consistent daily activity. What specific area would you like to focus on today?"

        # Save chat to database
        chat_message = ChatMessage(
            user_id=chat_request.user_id,
            session_id=chat_request.session_id,
            message=chat_request.message,
            response=ai_response
        )
        await db.chat_messages.insert_one(chat_message.dict())
        
        return {"response": ai_response}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI chat temporarily unavailable")

# Scanning endpoints with content moderation
@api_router.post("/scan/body")
async def analyze_body_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Read and validate file
        file_data = await file.read()
        if len(file_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Content moderation check
        is_approved = await content_moderation_check(file_data)
        
        if not is_approved:
            # Save scan but mark as pending review
            scan_result = ScanResult(
                user_id=user_id,
                scan_type="body",
                analysis_result={"status": "pending_review", "message": "Image under review for compliance"},
                xp_earned=0,
                is_approved=False
            )
            await db.scans.insert_one(scan_result.dict())
            
            return {
                "message": "Image submitted for review",
                "status": "pending_review",
                "xp_earned": 0
            }
        
        # For now, return placeholder analysis (will be replaced with actual API)
        mock_analysis = {
            "status": "completed",
            "message": "Body scan completed! Upload a photo to get detailed analysis.",
            "recommendations": [
                "Continue building your routine",
                "Focus on consistent activity",
                "Track your progress regularly"
            ]
        }
        
        scan_result = ScanResult(
            user_id=user_id,
            scan_type="body",
            analysis_result=mock_analysis,
            xp_earned=8
        )
        
        # Save scan result
        await db.scans.insert_one(scan_result.dict())
        
        # Update user XP and stats
        await db.users.update_one(
            {"id": user_id},
            {
                "$inc": {"xp": 8, "total_scans": 1},
                "$set": {"last_activity": datetime.utcnow()}
            }
        )
        
        return {
            "message": "Body scan completed successfully",
            "analysis": mock_analysis,
            "xp_earned": 8
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Body scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Body scan failed")

@api_router.post("/scan/face")
async def analyze_face_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Read and validate file
        file_data = await file.read()
        if len(file_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Content moderation check
        is_approved = await content_moderation_check(file_data)
        
        if not is_approved:
            scan_result = ScanResult(
                user_id=user_id,
                scan_type="face",
                analysis_result={"status": "pending_review", "message": "Image under review for compliance"},
                xp_earned=0,
                is_approved=False
            )
            await db.scans.insert_one(scan_result.dict())
            
            return {
                "message": "Image submitted for review",
                "status": "pending_review",
                "xp_earned": 0
            }
        
        # Placeholder analysis
        mock_analysis = {
            "status": "completed",
            "message": "Face scan completed! Upload a clear selfie to get detailed skin analysis.",
            "recommendations": [
                "Maintain good skincare routine",
                "Stay hydrated",
                "Get adequate sleep"
            ]
        }
        
        scan_result = ScanResult(
            user_id=user_id,
            scan_type="face",
            analysis_result=mock_analysis,
            xp_earned=6
        )
        
        await db.scans.insert_one(scan_result.dict())
        
        await db.users.update_one(
            {"id": user_id},
            {
                "$inc": {"xp": 6, "total_scans": 1},
                "$set": {"last_activity": datetime.utcnow()}
            }
        )
        
        return {
            "message": "Face scan completed successfully",
            "analysis": mock_analysis,
            "xp_earned": 6
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Face scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Face scan failed")

@api_router.post("/scan/food")
async def analyze_food_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Read and validate file
        file_data = await file.read()
        if len(file_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Basic content validation for food images
        is_approved = True  # Food images generally don't need strict content moderation
        
        # Placeholder analysis - will be replaced with actual nutrition API
        mock_analysis = {
            "status": "completed",
            "message": "Food scan completed! Upload a photo of your meal to get detailed nutrition information.",
            "nutrition": {
                "calories": 0,
                "protein": "0g",
                "carbs": "0g", 
                "fat": "0g"
            },
            "recommendations": [
                "Start tracking your meals",
                "Focus on balanced nutrition",
                "Include variety in your diet"
            ]
        }
        
        scan_result = ScanResult(
            user_id=user_id,
            scan_type="food",
            analysis_result=mock_analysis,
            xp_earned=5
        )
        
        await db.scans.insert_one(scan_result.dict())
        
        await db.users.update_one(
            {"id": user_id},
            {
                "$inc": {"xp": 5, "total_scans": 1},
                "$set": {"last_activity": datetime.utcnow()}
            }
        )
        
        return {
            "message": "Food scan completed successfully",
            "analysis": mock_analysis,
            "xp_earned": 5
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Food scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Food scan failed")

# Google and Apple authentication endpoints
@api_router.post("/auth/google")
async def google_auth(request: dict):
    try:
        # For now, create a placeholder endpoint
        # In production, verify the Google credential token
        credential = request.get('credential')
        
        if not credential:
            raise HTTPException(status_code=400, detail="Google credential required")
        
        # Mock user data (replace with actual Google token verification)
        user_data = {
            "name": "Google User",
            "email": "google.user@example.com",
            "google_id": "google_123456"
        }
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            # Update last login
            await db.users.update_one(
                {"id": existing_user['id']},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            user = existing_user
        else:
            # Create new user
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                level=1,
                xp=0,
                subscription_plan="Free",
                onboarding_completed=False
            )
            await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token(user['id'] if existing_user else user.id)
        
        # Remove password hash from response
        user_dict = dict(user) if existing_user else user.dict()
        if 'password_hash' in user_dict:
            del user_dict['password_hash']
        
        return {
            "message": "Google login successful",
            "user": user_dict,
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Google authentication failed")

@api_router.post("/auth/apple")
async def apple_auth(request: dict):
    try:
        # For now, create a placeholder endpoint
        # In production, verify the Apple identity token
        id_token = request.get('id_token')
        code = request.get('code')
        
        if not id_token:
            raise HTTPException(status_code=400, detail="Apple identity token required")
        
        # Mock user data (replace with actual Apple token verification)
        user_data = {
            "name": "Apple User",
            "email": "apple.user@example.com",
            "apple_id": "apple_123456"
        }
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        
        if existing_user:
            # Update last login
            await db.users.update_one(
                {"id": existing_user['id']},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            user = existing_user
        else:
            # Create new user
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                level=1,
                xp=0,
                subscription_plan="Free",
                onboarding_completed=False
            )
            await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token(user['id'] if existing_user else user.id)
        
        # Remove password hash from response
        user_dict = dict(user) if existing_user else user.dict()
        if 'password_hash' in user_dict:
            del user_dict['password_hash']
        
        return {
            "message": "Apple login successful",
            "user": user_dict,
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Apple auth error: {str(e)}")
        raise HTTPException(status_code=500, detail="Apple authentication failed")

# Avatar upload endpoint
@api_router.post("/upload/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    try:
        # Validate file
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        if file.size > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="File size must be less than 5MB")
        
        # Read file data
        file_data = await file.read()
        
        # Content moderation check
        is_approved = await content_moderation_check(file_data)
        
        if not is_approved:
            raise HTTPException(status_code=400, detail="Image contains inappropriate content")
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("/app/uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        filename = f"{user_id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Update user's avatar URL
        avatar_url = f"/uploads/avatars/{filename}"
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"avatar_url": avatar_url}}
        )
        
        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Avatar upload failed")

# Update user profile endpoint
@api_router.patch("/user/{user_id}")
async def update_user_profile(user_id: str, update_data: dict):
    try:
        # Remove sensitive fields that shouldn't be updated via this endpoint
        forbidden_fields = ['id', 'password_hash', 'created_at', 'subscription_plan', 'subscription_active']
        for field in forbidden_fields:
            update_data.pop(field, None)
        
        # Update user
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return updated user data
        updated_user = await db.users.find_one({"id": user_id})
        if 'password_hash' in updated_user:
            del updated_user['password_hash']
        
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=500, detail="Profile update failed")
@api_router.get("/user/{user_id}")
async def get_user_data(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Serialize and remove sensitive data
    user_response = serialize_doc(user)
    if 'password_hash' in user_response:
        del user_response['password_hash']
    if '_id' in user_response:
        del user_response['_id']
    
    return user_response

@api_router.get("/user/{user_id}/scans")
async def get_user_scans(user_id: str, scan_type: Optional[str] = None):
    query = {"user_id": user_id, "is_approved": True}  # Only return approved scans
    if scan_type:
        query["scan_type"] = scan_type
    
    scans = await db.scans.find(query).sort("timestamp", -1).to_list(50)
    # Convert ObjectId to string for JSON serialization
    for scan in scans:
        scan['_id'] = str(scan['_id'])
    return scans

@api_router.get("/user/{user_id}/chat-history")
async def get_chat_history(user_id: str, session_id: str):
    messages = await db.chat_messages.find(
        {"user_id": user_id, "session_id": session_id}
    ).sort("timestamp", 1).to_list(100)
    # Convert ObjectId to string for JSON serialization
    for message in messages:
        message['_id'] = str(message['_id'])
    return messages

# Notifications
@api_router.get("/user/{user_id}/notifications")
async def get_notifications(user_id: str):
    notifications = await db.notifications.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).to_list(50)
    
    for notification in notifications:
        if '_id' in notification:
            notification['_id'] = str(notification['_id'])
    
    return notifications

@api_router.post("/notifications")
async def send_notification(notification_data: NotificationRequest):
    notification = Notification(**notification_data.dict())
    await db.notifications.insert_one(notification.dict())
    return {"message": "Notification sent successfully"}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    result = await db.notifications.update_one(
        {"id": notification_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

# Social features: posts, comments, likes, shares, chat rooms, leaderboard
class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    type: str = "general"
    likes: int = 0
    likes_by: List[str] = []
    comments: List[dict] = []
    share_count: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SocialComment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CreatePostRequest(BaseModel):
    user_id: str
    content: str
    type: str = "general"

class LikePostRequest(BaseModel):
    user_id: str
    post_id: str

class CommentPostRequest(BaseModel):
    user_id: str
    post_id: str
    content: str

class SharePostRequest(BaseModel):
    user_id: str
    post_id: str

class ChatRoomModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    category: str = "general"
    type: str = "public"
    members: List[str] = []
    lastMessage: str = ""
    lastActivity: datetime = Field(default_factory=datetime.utcnow)

@api_router.get("/social/feed")
async def get_social_feed(user_id: Optional[str] = None):
    posts = await db.posts.find({}).sort("timestamp", -1).to_list(100)
    result = []
    for p in posts:
        if '_id' in p:
            p['_id'] = str(p['_id'])
        # build user object
        u = await db.users.find_one({"id": p.get("user_id")})
        user_obj = {
            "name": u.get("name", "User") if u else "User",
            "avatar": u.get("avatar_url") if u else None,
            "level": u.get("level", 1) if u else 1
        }
        result.append({
            "id": p.get("id"),
            "user": user_obj,
            "content": p.get("content", ""),
            "timestamp": p.get("timestamp"),
            "likes": p.get("likes", 0),
            "comments": len(p.get("comments", [])),
            "isLiked": user_id in p.get("likes_by", []) if user_id else False,
            "type": p.get("type", "general"),
            "xp_earned": p.get("xp_earned")
        })
    return {"posts": result}

@api_router.post("/social/post")
async def create_post(req: CreatePostRequest):
    user = await db.users.find_one({"id": req.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    post = SocialPost(user_id=req.user_id, content=req.content, type=req.type)
    await db.posts.insert_one(post.dict())
    # response object compatible with frontend
    return {
        "id": post.id,
        "user": {
            "name": user.get("name", "User"),
            "avatar": user.get("avatar_url"),
            "level": user.get("level", 1)
        },
        "content": post.content,
        "timestamp": post.timestamp,
        "likes": 0,
        "comments": 0,
        "isLiked": False,
        "type": post.type
    }

@api_router.post("/social/like")
async def like_post(req: LikePostRequest):
    post = await db.posts.find_one({"id": req.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    likes_by = post.get("likes_by", [])
    liked = req.user_id in likes_by
    if liked:
        likes_by.remove(req.user_id)
        new_likes = max(0, post.get("likes", 0) - 1)
    else:
        likes_by.append(req.user_id)
        new_likes = post.get("likes", 0) + 1
    await db.posts.update_one({"id": req.post_id}, {"$set": {"likes_by": likes_by, "likes": new_likes}})
    return {"liked": not liked, "likes": new_likes}

@api_router.post("/social/comment")
async def comment_post(req: CommentPostRequest):
    user = await db.users.find_one({"id": req.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    post = await db.posts.find_one({"id": req.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    c = SocialComment(user_id=req.user_id, content=req.content)
    comments = post.get("comments", [])
    comments.append(c.dict())
    await db.posts.update_one({"id": req.post_id}, {"$set": {"comments": comments}})
    return {"comment": {"id": c.id, "user": {"name": user.get("name", "User")}, "content": c.content, "timestamp": c.timestamp}}

@api_router.post("/social/share")
async def share_post(req: SharePostRequest):
    post = await db.posts.find_one({"id": req.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    new_count = post.get("share_count", 0) + 1
    await db.posts.update_one({"id": req.post_id}, {"$set": {"share_count": new_count}})
    return {"share_count": new_count}

async def seed_chat_rooms():
    count = await db.chat_rooms.count_documents({})
    if count == 0:
        rooms = [
            ChatRoomModel(name="Fitness Beginners", description="Support group for fitness newcomers", category="fitness").dict(),
            ChatRoomModel(name="Nutrition Masters", description="Share recipes and nutrition tips", category="nutrition").dict(),
            ChatRoomModel(name="Body Transformation", description="Track your body scan progress together", category="fitness").dict(),
            ChatRoomModel(name="Skincare Squad", description="Glowing skin tips and face scan discussions", category="skincare").dict(),
        ]
        await db.chat_rooms.insert_many(rooms)

@api_router.get("/social/chat-rooms")
async def get_chat_rooms(user_id: Optional[str] = None):
    # Return only rooms the user has joined; do not seed or show fake rooms
    query = {}
    if user_id:
      query = {"members": {"$in": [user_id]}}
    rooms = await db.chat_rooms.find(query).sort("lastActivity", -1).to_list(50)
    result = []
    for r in rooms:
        if '_id' in r:
            r['_id'] = str(r['_id'])
        result.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "description": r.get("description", ""),
            "category": r.get("category", "general"),
            "type": r.get("type", "public"),
            "members": len(r.get("members", [])),
            "lastMessage": r.get("lastMessage", ""),
            "lastActivity": r.get("lastActivity"),
            "isJoined": user_id in r.get("members", []) if user_id else False
        })
    return {"rooms": result}

@api_router.post("/social/chat-room/create")
async def create_chat_room(room: dict):
    name = room.get('name')
    if not name:
        raise HTTPException(status_code=400, detail="Room name is required")
    creator_id = room.get('creator_id')
    new_room = ChatRoomModel(
        name=name,
        description=room.get('description', ''),
        category=room.get('category', 'general'),
        type=room.get('type', 'public'),
        members=[creator_id] if creator_id else []
    )
    await db.chat_rooms.insert_one(new_room.dict())
    return {
        "id": new_room.id,
        "name": new_room.name,
        "description": new_room.description,
        "category": new_room.category,
        "type": new_room.type,
        "members": len(new_room.members),
        "lastMessage": new_room.lastMessage,
        "lastActivity": new_room.lastActivity,
        "isJoined": True
    }

@api_router.post("/social/join-room")
async def join_room(data: dict):
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    room = await db.chat_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    members = set(room.get("members", []))
    members.add(user_id)
    await db.chat_rooms.update_one({"id": room_id}, {"$set": {"members": list(members), "lastActivity": datetime.utcnow()}})
    return {"message": "Joined"}

# Users directory search
class UserPublic(BaseModel):
    id: str
    name: str
    username: str
    avatar_url: Optional[str] = None

@api_router.get("/users/search")
async def search_users(q: str):
    # Basic case-insensitive search on name or username
    regex = {"$regex": q, "$options": "i"}
    users = await db.users.find({"$or": [{"name": regex}, {"username": regex}]}, {"password_hash": 0}).limit(20).to_list(20)
    result = []
    for u in users:
        if '_id' in u:
            u['_id'] = str(u['_id'])
        result.append({
            "id": u.get("id"),
            "name": u.get("name", "User"),
            "username": u.get("username", "user"),
            "avatar": u.get("avatar_url")
        })
    return {"users": result}

# Chat room members/messages minimal endpoints
@api_router.get("/chat-room/{room_id}/members")
async def chat_room_members(room_id: str):
    room = await db.chat_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    member_ids = room.get('members', [])
    users = await db.users.find({"id": {"$in": member_ids}}).to_list(len(member_ids) or 1)
    members = [{"id": u.get('id'), "name": u.get('name', 'User'), "avatar": u.get('avatar_url'), "role": 'member', "online": True} for u in users]
    return {"members": members}

@api_router.get("/chat-room/{room_id}/messages")
async def chat_room_messages(room_id: str, user_id: Optional[str] = None):
    msgs = await db.chat_room_messages.find({"room_id": room_id}).sort("timestamp", 1).to_list(200)
    for m in msgs:
        if '_id' in m:
            m['_id'] = str(m['_id'])
    return {"messages": msgs}

@api_router.post("/chat-room/message")
async def post_chat_room_message(data: dict):
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    message = data.get('message')
    if not (user_id and room_id and message):
        raise HTTPException(status_code=400, detail="Missing fields")
    user = await db.users.find_one({"id": user_id})
    msg = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "user": {"id": user_id, "name": user.get('name', 'User') if user else 'User', "avatar": user.get('avatar_url') if user else None},
        "message": message,
        "timestamp": datetime.utcnow(),
        "type": data.get('type', 'text')
    }
    await db.chat_room_messages.insert_one(msg)
    await db.chat_rooms.update_one({"id": room_id}, {"$set": {"lastMessage": message, "lastActivity": datetime.utcnow()}})
    return msg

@api_router.get("/social/leaderboard")
async def social_leaderboard():
    users = await db.users.find({}, {"password_hash": 0}).sort("xp", -1).to_list(100)
    leaderboard = []
    rank = 1
    for u in users[:10]:
        if '_id' in u:
            u['_id'] = str(u['_id'])
        leaderboard.append({
            "rank": rank,
            "name": u.get("name", "User"),
            "level": u.get("level", 1),
            "xp": u.get("xp", 0),
            "streak": u.get("streak_days", 0),
            "avatar": u.get("avatar_url")
        })
        rank += 1
    return {"leaderboard": leaderboard}

# Admin endpoints
@api_router.get("/admin/users")
async def get_all_users(admin_email: str, admin_password: str):
    # Simple admin authentication
    if admin_email != ADMIN_EMAIL or admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    users = await db.users.find({}, {"password_hash": 0}).to_list(1000)
    for user in users:
        user['_id'] = str(user['_id'])
    
    return {
        "total_users": len(users),
        "users": users
    }

@api_router.get("/admin/pending-scans")
async def get_pending_scans(admin_email: str, admin_password: str):
    if admin_email != ADMIN_EMAIL or admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    pending_scans = await db.scans.find({"is_approved": False}).to_list(100)
    for scan in pending_scans:
        scan['_id'] = str(scan['_id'])
    
    return {"pending_scans": pending_scans}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Leveling-Up API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    try:
        # Test database connection
        await db.users.count_documents({})
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)