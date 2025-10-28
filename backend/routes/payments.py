from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from supabase_client import supabase_admin
from config import STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

router = APIRouter(prefix="/api/payments", tags=["payments"])

class CreateCheckoutRequest(BaseModel):
    user_id: str
    plan_tier: str
    success_url: str
    cancel_url: str

class SubscriptionStatusRequest(BaseModel):
    user_id: str

@router.get("/config")
async def get_stripe_config():
    return {
        "publicKey": STRIPE_PUBLIC_KEY,
        "plans": [
            {
                "id": "basic",
                "name": "Basic",
                "price": 9.99,
                "interval": "month",
                "features": [
                    "Unlimited scans",
                    "Basic AI analysis",
                    "7-day history"
                ]
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 19.99,
                "interval": "month",
                "features": [
                    "Everything in Basic",
                    "Advanced AI analysis",
                    "30-day history",
                    "Priority support"
                ]
            },
            {
                "id": "premium",
                "name": "Premium",
                "price": 29.99,
                "interval": "month",
                "features": [
                    "Everything in Pro",
                    "Unlimited history",
                    "Custom meal plans",
                    "1-on-1 coaching"
                ]
            }
        ]
    }

@router.post("/create-checkout-session")
async def create_checkout_session(req: CreateCheckoutRequest):
    try:
        user_response = supabase_admin.table("users").select("email").eq("id", req.user_id).execute()

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "sessionId": "simulated_session_id",
            "url": f"{req.success_url}?session_id=simulated_session_id",
            "message": "Stripe integration placeholder - Replace with actual Stripe API"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    try:
        payload = await request.body()

        return {"message": "Webhook received - Stripe integration placeholder"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook error: {str(e)}")

@router.get("/subscription/{user_id}")
async def get_subscription_status(user_id: str):
    try:
        response = supabase_admin.table("subscriptions").select("*").eq("user_id", user_id).execute()

        if not response.data:
            return {
                "hasSubscription": False,
                "plan_tier": "free",
                "status": "none"
            }

        subscription = response.data[0]

        return {
            "hasSubscription": subscription.get("status") == "active",
            "plan_tier": subscription.get("plan_tier", "free"),
            "status": subscription.get("status"),
            "current_period_end": subscription.get("current_period_end"),
            "cancel_at_period_end": subscription.get("cancel_at_period_end", False)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get subscription: {str(e)}")

@router.post("/activate-subscription")
async def activate_subscription(user_id: str, plan_tier: str):
    try:
        current_period_start = datetime.utcnow()
        current_period_end = current_period_start + timedelta(days=30)

        subscription_data = {
            "user_id": user_id,
            "plan_tier": plan_tier,
            "status": "active",
            "current_period_start": current_period_start.isoformat(),
            "current_period_end": current_period_end.isoformat()
        }

        response = supabase_admin.table("subscriptions").upsert(subscription_data).execute()

        supabase_admin.table("users").update({
            "subscription_tier": plan_tier,
            "subscription_active": True
        }).eq("id", user_id).execute()

        return {
            "message": "Subscription activated successfully",
            "subscription": response.data[0] if response.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate subscription: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(user_id: str):
    try:
        response = supabase_admin.table("subscriptions").update({
            "cancel_at_period_end": True,
            "status": "cancelled"
        }).eq("user_id", user_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Subscription not found")

        return {"message": "Subscription cancelled successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cancel subscription: {str(e)}")
