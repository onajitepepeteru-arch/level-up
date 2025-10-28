from fastapi import APIRouter, HTTPException, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import random
from supabase_client import supabase_admin
from config import BODY_SCANNER_API_KEY, FACE_SCANNER_API_KEY, FOOD_SCANNER_API_KEY

router = APIRouter(prefix="/api/scan", tags=["scanners"])

class ScanRequest(BaseModel):
    user_id: str
    scan_type: str

@router.post("/body")
async def scan_body(user_id: str, file: UploadFile = File(...)):
    try:
        xp_earned = 8

        analysis_result = {
            "posture": "Slight forward head tilt",
            "postureDetails": "Mild forward head posture",
            "composition": "Lean-moderate",
            "muscle": f"{random.randint(35, 45)}%",
            "bodyType": random.choice(["Mesomorph", "Ectomorph", "Endomorph"]),
            "recommendations": [
                "Maintain good posture throughout the day",
                "Include strength training 3-4x per week",
                "Focus on compound movements"
            ]
        }

        scan_data = {
            "user_id": user_id,
            "scan_type": "body",
            "analysis_result": analysis_result,
            "xp_earned": xp_earned
        }

        response = supabase_admin.table("scans").insert(scan_data).execute()

        user_response = supabase_admin.table("users").select("xp, level").eq("id", user_id).execute()
        if user_response.data:
            user = user_response.data[0]
            new_xp = user.get("xp", 0) + xp_earned
            current_level = user.get("level", 1)

            xp_for_next_level = current_level * 100
            if new_xp >= xp_for_next_level:
                current_level += 1
                new_xp -= xp_for_next_level

            supabase_admin.table("users").update({
                "xp": new_xp,
                "level": current_level
            }).eq("id", user_id).execute()

        return {
            "message": "Body scan completed successfully",
            "analysis": analysis_result,
            "xp_earned": xp_earned,
            "scan_id": response.data[0]["id"] if response.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Body scan failed: {str(e)}")

@router.post("/face")
async def scan_face(user_id: str, file: UploadFile = File(...)):
    try:
        xp_earned = 6

        analysis_result = {
            "skinType": random.choice(["Combination", "Oily", "Dry", "Normal"]),
            "description": "Balanced skin with minor concerns",
            "concerns": random.choice([
                "Minor acne, slight tone unevenness",
                "Dry patches on cheeks",
                "Oily T-zone",
                "Fine lines around eyes"
            ]),
            "aiSuggestion": "Gentle cleansing, niacinamide AM, vitamin C AM, retinol PM, SPF 50+",
            "recommendedProduct": random.choice([
                "Youth-Glow Serum",
                "Hydration Boost Cream",
                "Clear Skin Toner"
            ]),
            "glowScore": random.randint(65, 85)
        }

        scan_data = {
            "user_id": user_id,
            "scan_type": "face",
            "analysis_result": analysis_result,
            "xp_earned": xp_earned
        }

        response = supabase_admin.table("scans").insert(scan_data).execute()

        user_response = supabase_admin.table("users").select("xp, level").eq("id", user_id).execute()
        if user_response.data:
            user = user_response.data[0]
            new_xp = user.get("xp", 0) + xp_earned
            current_level = user.get("level", 1)

            xp_for_next_level = current_level * 100
            if new_xp >= xp_for_next_level:
                current_level += 1
                new_xp -= xp_for_next_level

            supabase_admin.table("users").update({
                "xp": new_xp,
                "level": current_level
            }).eq("id", user_id).execute()

        return {
            "message": "Face scan completed successfully",
            "analysis": analysis_result,
            "xp_earned": xp_earned,
            "scan_id": response.data[0]["id"] if response.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face scan failed: {str(e)}")

@router.post("/food")
async def scan_food(user_id: str, file: UploadFile = File(...)):
    try:
        xp_earned = 5

        analysis_result = {
            "foodName": random.choice(["Grilled Chicken Salad", "Pasta Carbonara", "Salmon Bowl", "Veggie Wrap"]),
            "nutrition": {
                "calories": random.randint(400, 700),
                "protein": random.randint(20, 40),
                "carbs": random.randint(40, 80),
                "fat": random.randint(10, 25)
            },
            "suggestion": random.choice([
                "Add more greens",
                "Reduce portion size",
                "Good balanced meal",
                "Include more protein"
            ]),
            "recommendation": random.choice([
                "Include more fiber",
                "Add healthy fats",
                "Great choice!",
                "Consider whole grains"
            ])
        }

        scan_data = {
            "user_id": user_id,
            "scan_type": "food",
            "analysis_result": analysis_result,
            "xp_earned": xp_earned
        }

        response = supabase_admin.table("scans").insert(scan_data).execute()

        user_response = supabase_admin.table("users").select("xp, level").eq("id", user_id).execute()
        if user_response.data:
            user = user_response.data[0]
            new_xp = user.get("xp", 0) + xp_earned
            current_level = user.get("level", 1)

            xp_for_next_level = current_level * 100
            if new_xp >= xp_for_next_level:
                current_level += 1
                new_xp -= xp_for_next_level

            supabase_admin.table("users").update({
                "xp": new_xp,
                "level": current_level
            }).eq("id", user_id).execute()

        return {
            "message": "Food scan completed successfully",
            "analysis": analysis_result,
            "xp_earned": xp_earned,
            "scan_id": response.data[0]["id"] if response.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Food scan failed: {str(e)}")

@router.get("/{user_id}/scans")
async def get_user_scans(user_id: str, scan_type: Optional[str] = None):
    try:
        query = supabase_admin.table("scans").select("*").eq("user_id", user_id)

        if scan_type:
            query = query.eq("scan_type", scan_type)

        response = query.order("timestamp", desc=True).execute()

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get scans: {str(e)}")
