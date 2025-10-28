from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import supabase_admin
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register_user(payload: RegisterRequest):
    try:
        response = supabase_admin.table("users").select("email").eq("email", payload.email).execute()
        if response.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        username = payload.name.strip().split(" ")[0].lower() if payload.name else payload.email.split("@")[0]

        response = supabase_admin.table("users").select("username").eq("username", username).execute()
        if response.data:
            username = f"{username}{len(response.data) + 1}"

        password_hash = hash_password(payload.password)

        user_data = {
            "email": payload.email,
            "password_hash": password_hash,
            "name": payload.name,
            "username": username,
            "level": 1,
            "xp": 0,
            "streak_days": 0,
            "onboarding_completed": False,
            "subscription_tier": "free",
            "subscription_active": False
        }

        response = supabase_admin.table("users").insert(user_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user")

        user = response.data[0]
        token = create_access_token(user["id"])

        return {
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "username": user["username"]
            },
            "token": token,
            "message": "Registration successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login_user(payload: LoginRequest):
    try:
        response = supabase_admin.table("users").select("*").eq("email", payload.email).execute()

        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = response.data[0]

        if not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_access_token(user["id"])

        return {
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "username": user["username"],
                "level": user.get("level", 1),
                "xp": user.get("xp", 0),
                "onboarding_completed": user.get("onboarding_completed", False)
            },
            "token": token,
            "message": "Login successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
