from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Depends
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
        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            level=1,
            xp=0,
            subscription_plan="Free"
        )
        
        # Insert user into database
        await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token(user.id)
        
        # Remove password hash from response
        user_dict = user.dict()
        del user_dict['password_hash']
        
        return {
            "message": "User registered successfully",
            "user": user_dict,
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
        user = await db.users.find_one({"email": user_data.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(user_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update last login
        await db.users.update_one(
            {"id": user['id']},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Create JWT token
        token = create_jwt_token(user['id'])
        
        # Remove password hash from response
        del user['password_hash']
        
        return {
            "message": "Login successful",
            "user": user,
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
    
    # Remove sensitive data
    if 'password_hash' in user:
        del user['password_hash']
    
    return user

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