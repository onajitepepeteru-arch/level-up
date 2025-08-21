from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile
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
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize AI Chat
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Define Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
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
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class OnboardingData(BaseModel):
    user_id: str
    age: int
    gender: str
    goals: List[str]
    body_type: str
    activity_level: str
    health_conditions: List[str]

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    scan_type: str  # "body", "face", "food"
    image_url: Optional[str] = None
    analysis_result: dict
    xp_earned: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str
    message: str
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str

# Authentication endpoints
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    )
    await db.users.insert_one(user.dict())
    return user

@api_router.post("/auth/login")
async def login_user(email: str, password: str):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Login successful", "user": User(**user)}

@api_router.post("/onboarding")
async def complete_onboarding(data: OnboardingData):
    # Update user with onboarding data
    update_data = {
        "age": data.age,
        "gender": data.gender,
        "goals": data.goals,
        "body_type": data.body_type,
        "activity_level": data.activity_level,
        "health_conditions": data.health_conditions,
        "xp": 50  # Bonus XP for completing onboarding
    }
    
    result = await db.users.update_one(
        {"id": data.user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Onboarding completed", "xp_earned": 50}

# AI Chat endpoints
@api_router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest):
    try:
        # Get user data for context
        user = await db.users.find_one({"id": chat_request.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent scans for context
        recent_scans = await db.scans.find(
            {"user_id": chat_request.user_id}
        ).sort("timestamp", -1).limit(5).to_list(5)
        
        # Create AI system message with user context
        system_message = f"""You are a professional fitness and wellness coach for the LevelUP app. 
        
User Profile:
- Name: {user.get('name', 'User')}
- Level: {user.get('level', 1)}
- XP: {user.get('xp', 0)}
- Goals: {', '.join(user.get('goals', []))}
- Body Type: {user.get('body_type', 'Unknown')}
- Activity Level: {user.get('activity_level', 'Unknown')}

Recent Activity:
- Total scans completed: {len(recent_scans)}
- Last scan: {recent_scans[0]['scan_type'] if recent_scans else 'None'}

Provide personalized, actionable advice. Be encouraging and motivational. 
Reference their level, goals, and scan history when relevant. Keep responses under 200 words."""

        # Initialize AI chat with error handling
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=chat_request.session_id,
                system_message=system_message
            ).with_model("openai", "gpt-4o-mini")
            
            # Send message to AI
            user_message = UserMessage(text=chat_request.message)
            ai_response = await chat.send_message(user_message)
            
        except Exception as ai_error:
            logging.error(f"AI integration error: {str(ai_error)}")
            # Fallback response when AI is unavailable
            ai_response = f"Hi! I'm your LevelUP fitness coach. I'm currently experiencing some technical issues, but I'll be back soon! In the meantime, here's some general advice: {chat_request.message}"
        
        # Save chat to database
        chat_message = ChatMessage(
            user_id=chat_request.user_id,
            session_id=chat_request.session_id,
            message=chat_request.message,
            response=ai_response
        )
        await db.chat_messages.insert_one(chat_message.dict())
        
        return {"response": ai_response}
    
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI chat temporarily unavailable")

# Scanning endpoints
@api_router.post("/scan/body")
async def analyze_body_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Mock analysis for now - will be replaced with actual API
        mock_analysis = {
            "body_type": "Mesomorph",
            "muscle_mass": "38%",
            "posture_score": 75,
            "recommendations": [
                "Focus on compound movements",
                "Increase protein intake to 1.2g/kg",
                "Maintain current workout frequency"
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
        
        # Update user XP
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"xp": 8}}
        )
        
        return {"analysis": mock_analysis, "xp_earned": 8}
    
    except Exception as e:
        logging.error(f"Body scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Body scan analysis failed")

@api_router.post("/scan/face")
async def analyze_face_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Mock analysis for now - will be replaced with GlamAR API
        mock_analysis = {
            "skin_type": "Combination",
            "acne_score": 15,
            "hydration_level": 65,
            "wrinkles": "Minimal",
            "recommendations": [
                "Use niacinamide serum for acne",
                "Apply SPF 50+ daily",
                "Increase water intake"
            ]
        }
        
        scan_result = ScanResult(
            user_id=user_id,
            scan_type="face",
            analysis_result=mock_analysis,
            xp_earned=6
        )
        
        await db.scans.insert_one(scan_result.dict())
        
        # Update user XP
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"xp": 6}}
        )
        
        return {"analysis": mock_analysis, "xp_earned": 6}
    
    except Exception as e:
        logging.error(f"Face scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Face scan analysis failed")

@api_router.post("/scan/food")
async def analyze_food_scan(user_id: str, file: UploadFile = File(...)):
    try:
        # Mock analysis for now - will be replaced with LogMeal API
        mock_analysis = {
            "food_name": "Grilled Chicken Salad",
            "calories": 320,
            "protein": 35,
            "carbs": 12,
            "fat": 15,
            "fiber": 8,
            "nutrients": ["Vitamin A", "Vitamin C", "Iron"]
        }
        
        scan_result = ScanResult(
            user_id=user_id,
            scan_type="food",
            analysis_result=mock_analysis,
            xp_earned=5
        )
        
        await db.scans.insert_one(scan_result.dict())
        
        # Update user XP
        await db.users.update_one(
            {"id": user_id},
            {"$inc": {"xp": 5}}
        )
        
        return {"analysis": mock_analysis, "xp_earned": 5}
    
    except Exception as e:
        logging.error(f"Food scan error: {str(e)}")
        raise HTTPException(status_code=500, detail="Food scan analysis failed")

# User data endpoints
@api_router.get("/user/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.get("/user/{user_id}/scans")
async def get_user_scans(user_id: str, scan_type: Optional[str] = None):
    query = {"user_id": user_id}
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

# Health check
@api_router.get("/")
async def root():
    return {"message": "LevelUP API is running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()