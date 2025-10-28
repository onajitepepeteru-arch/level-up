from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase_admin

router = APIRouter(prefix="/api/user", tags=["users"])

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    goals: Optional[list] = None
    activity_level: Optional[str] = None
    onboarding_completed: Optional[bool] = None

@router.get("/{user_id}")
async def get_user_data(user_id: str):
    try:
        response = supabase_admin.table("users").select("*").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = response.data[0]
        user.pop("password_hash", None)

        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")

@router.patch("/{user_id}")
async def update_user_data(user_id: str, payload: UpdateUserRequest):
    try:
        update_data = payload.dict(exclude_unset=True)

        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")

        response = supabase_admin.table("users").update(update_data).eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = response.data[0]
        user.pop("password_hash", None)

        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@router.post("/{user_id}/add-xp")
async def add_xp(user_id: str, xp_amount: int):
    try:
        response = supabase_admin.table("users").select("xp, level").eq("id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="User not found")

        user = response.data[0]
        current_xp = user.get("xp", 0)
        current_level = user.get("level", 1)

        new_xp = current_xp + xp_amount
        xp_for_next_level = current_level * 100

        level_ups = 0
        while new_xp >= xp_for_next_level:
            current_level += 1
            new_xp -= xp_for_next_level
            xp_for_next_level = current_level * 100
            level_ups += 1

        update_response = supabase_admin.table("users").update({
            "xp": new_xp,
            "level": current_level
        }).eq("id", user_id).execute()

        return {
            "xp": new_xp,
            "level": current_level,
            "leveled_up": level_ups > 0,
            "level_ups": level_ups
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add XP: {str(e)}")

@router.get("/search")
async def search_users(q: str):
    try:
        response = supabase_admin.table("users").select("id, name, username, avatar_url, level").or_(f"name.ilike.%{q}%,username.ilike.%{q}%").limit(20).execute()

        return {"users": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
