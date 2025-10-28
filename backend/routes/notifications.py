from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import supabase_admin

router = APIRouter(prefix="/api", tags=["notifications"])

class CreateNotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str
    type: Optional[str] = "system"

class CreateReminderRequest(BaseModel):
    user_id: str
    title: str
    description: Optional[str] = ""
    reminder_type: str
    time: str
    days: list = []

@router.get("/user/{user_id}/notifications")
async def get_notifications(user_id: str):
    try:
        response = supabase_admin.table("notifications").select("*").eq("user_id", user_id).order("timestamp", desc=True).limit(50).execute()

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")

@router.post("/notifications")
async def create_notification(req: CreateNotificationRequest):
    try:
        notification_data = {
            "user_id": req.user_id,
            "title": req.title,
            "message": req.message,
            "type": req.type
        }

        response = supabase_admin.table("notifications").insert(notification_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create notification")

        return {"message": "Notification created successfully", "notification": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create notification: {str(e)}")

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    try:
        response = supabase_admin.table("notifications").update({"read": True}).eq("id", notification_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")

        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

@router.get("/user/{user_id}/reminders")
async def get_reminders(user_id: str):
    try:
        response = supabase_admin.table("reminders").select("*").eq("user_id", user_id).execute()

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reminders: {str(e)}")

@router.post("/reminders")
async def create_reminder(req: CreateReminderRequest):
    try:
        reminder_data = {
            "user_id": req.user_id,
            "title": req.title,
            "description": req.description,
            "reminder_type": req.reminder_type,
            "time": req.time,
            "days": req.days
        }

        response = supabase_admin.table("reminders").insert(reminder_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create reminder")

        return {"message": "Reminder created successfully", "reminder": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create reminder: {str(e)}")

@router.patch("/reminders/{reminder_id}")
async def update_reminder(reminder_id: str, data: dict):
    try:
        response = supabase_admin.table("reminders").update(data).eq("id", reminder_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Reminder not found")

        return {"message": "Reminder updated successfully", "reminder": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update reminder: {str(e)}")

@router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    try:
        response = supabase_admin.table("reminders").delete().eq("id", reminder_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Reminder not found")

        return {"message": "Reminder deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete reminder: {str(e)}")
