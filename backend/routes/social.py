from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from supabase_client import supabase_admin

router = APIRouter(prefix="/api/social", tags=["social"])

class CreatePostRequest(BaseModel):
    user_id: str
    content: str
    type: str = "general"
    media: List[dict] = []

class LikePostRequest(BaseModel):
    user_id: str
    post_id: str

class CommentPostRequest(BaseModel):
    user_id: str
    post_id: str
    content: str

@router.get("/feed")
async def get_social_feed(user_id: Optional[str] = None):
    try:
        response = supabase_admin.table("posts").select("*").order("timestamp", desc=True).limit(50).execute()

        posts = []
        for post in response.data:
            user_response = supabase_admin.table("users").select("name, avatar_url, level").eq("id", post["user_id"]).execute()

            user_data = user_response.data[0] if user_response.data else {"name": "User", "avatar_url": None, "level": 1}

            likes_by = post.get("likes_by", [])
            is_liked = user_id in likes_by if user_id and isinstance(likes_by, list) else False

            posts.append({
                "id": post["id"],
                "user": user_data,
                "content": post["content"],
                "timestamp": post["timestamp"],
                "likes": post.get("likes", 0),
                "comments": len(post.get("comments", [])),
                "isLiked": is_liked,
                "type": post.get("type", "general"),
                "xp_earned": post.get("xp_earned"),
                "media": post.get("media", [])
            })

        return {"posts": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feed: {str(e)}")

@router.post("/post")
async def create_post(req: CreatePostRequest):
    try:
        user_response = supabase_admin.table("users").select("name, avatar_url, level").eq("id", req.user_id).execute()

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        post_data = {
            "user_id": req.user_id,
            "content": req.content,
            "type": req.type,
            "media": req.media
        }

        response = supabase_admin.table("posts").insert(post_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create post")

        post = response.data[0]
        user = user_response.data[0]

        return {
            "id": post["id"],
            "user": user,
            "content": post["content"],
            "timestamp": post["timestamp"],
            "likes": 0,
            "comments": 0,
            "isLiked": False,
            "type": post["type"],
            "media": post.get("media", [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@router.post("/like")
async def like_post(req: LikePostRequest):
    try:
        response = supabase_admin.table("posts").select("likes, likes_by").eq("id", req.post_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Post not found")

        post = response.data[0]
        likes_by = post.get("likes_by", [])

        if req.user_id in likes_by:
            likes_by.remove(req.user_id)
            new_likes = max(0, post.get("likes", 0) - 1)
            liked = False
        else:
            likes_by.append(req.user_id)
            new_likes = post.get("likes", 0) + 1
            liked = True

        supabase_admin.table("posts").update({
            "likes": new_likes,
            "likes_by": likes_by
        }).eq("id", req.post_id).execute()

        return {"liked": liked, "likes": new_likes}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to like post: {str(e)}")

@router.post("/comment")
async def comment_post(req: CommentPostRequest):
    try:
        user_response = supabase_admin.table("users").select("name").eq("id", req.user_id).execute()

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        post_response = supabase_admin.table("posts").select("comments").eq("id", req.post_id).execute()

        if not post_response.data:
            raise HTTPException(status_code=404, detail="Post not found")

        comments = post_response.data[0].get("comments", [])

        new_comment = {
            "id": str(len(comments) + 1),
            "user_id": req.user_id,
            "content": req.content,
            "timestamp": datetime.utcnow().isoformat()
        }

        comments.append(new_comment)

        supabase_admin.table("posts").update({"comments": comments}).eq("id", req.post_id).execute()

        user = user_response.data[0]

        return {
            "comment": {
                "id": new_comment["id"],
                "user": {"name": user["name"]},
                "content": new_comment["content"],
                "timestamp": new_comment["timestamp"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to comment: {str(e)}")

@router.get("/chat-rooms")
async def get_chat_rooms(user_id: Optional[str] = None):
    try:
        response = supabase_admin.table("chat_rooms").select("*").order("last_activity", desc=True).limit(50).execute()

        rooms = []
        for room in response.data:
            members = room.get("members", [])
            is_joined = user_id in members if user_id else False

            rooms.append({
                "id": room["id"],
                "name": room["name"],
                "description": room.get("description", ""),
                "category": room.get("category", "general"),
                "type": room.get("type", "public"),
                "members": len(members),
                "lastMessage": room.get("last_message", ""),
                "lastActivity": room.get("last_activity"),
                "isJoined": is_joined
            })

        return {"rooms": rooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat rooms: {str(e)}")

@router.post("/chat-room/create")
async def create_chat_room(room: dict):
    try:
        room_data = {
            "name": room.get("name"),
            "description": room.get("description", ""),
            "category": room.get("category", "general"),
            "type": room.get("type", "public"),
            "max_members": room.get("maxMembers", 50),
            "creator_id": room.get("creator_id"),
            "members": [room.get("creator_id")] if room.get("creator_id") else []
        }

        response = supabase_admin.table("chat_rooms").insert(room_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create chat room")

        new_room = response.data[0]

        return {
            "id": new_room["id"],
            "name": new_room["name"],
            "description": new_room.get("description", ""),
            "category": new_room.get("category", "general"),
            "type": new_room.get("type", "public"),
            "members": len(new_room.get("members", [])),
            "lastMessage": "",
            "lastActivity": new_room.get("last_activity"),
            "isJoined": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat room: {str(e)}")

@router.post("/join-room")
async def join_room(data: dict):
    try:
        user_id = data.get("user_id")
        room_id = data.get("room_id")

        response = supabase_admin.table("chat_rooms").select("members").eq("id", room_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Room not found")

        members = response.data[0].get("members", [])

        if user_id not in members:
            members.append(user_id)

        supabase_admin.table("chat_rooms").update({
            "members": members,
            "last_activity": datetime.utcnow().isoformat()
        }).eq("id", room_id).execute()

        return {"message": "Joined successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join room: {str(e)}")

@router.get("/chat-room/{room_id}/messages")
async def get_chat_messages(room_id: str):
    try:
        response = supabase_admin.table("chat_messages").select("*").eq("room_id", room_id).order("timestamp").limit(200).execute()

        messages = []
        for msg in response.data:
            user_response = supabase_admin.table("users").select("name, avatar_url").eq("id", msg["user_id"]).execute()

            user_data = user_response.data[0] if user_response.data else {"name": "User", "avatar_url": None}

            messages.append({
                "id": msg["id"],
                "room_id": msg["room_id"],
                "user": {
                    "id": msg["user_id"],
                    "name": user_data["name"],
                    "avatar": user_data.get("avatar_url")
                },
                "message": msg["message"],
                "timestamp": msg["timestamp"],
                "type": msg.get("type", "text"),
                "meta": msg.get("meta")
            })

        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")

@router.post("/chat-room/message")
async def post_chat_message(data: dict):
    try:
        user_id = data.get("user_id")
        room_id = data.get("room_id")
        message = data.get("message")

        if not all([user_id, room_id, message]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        user_response = supabase_admin.table("users").select("name, avatar_url").eq("id", user_id).execute()

        if not user_response.data:
            raise HTTPException(status_code=404, detail="User not found")

        message_data = {
            "room_id": room_id,
            "user_id": user_id,
            "message": message,
            "type": data.get("type", "text"),
            "meta": data.get("meta")
        }

        response = supabase_admin.table("chat_messages").insert(message_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to send message")

        supabase_admin.table("chat_rooms").update({
            "last_message": message,
            "last_activity": datetime.utcnow().isoformat()
        }).eq("id", room_id).execute()

        msg = response.data[0]
        user = user_response.data[0]

        return {
            "id": msg["id"],
            "room_id": msg["room_id"],
            "user": {
                "id": user_id,
                "name": user["name"],
                "avatar": user.get("avatar_url")
            },
            "message": msg["message"],
            "timestamp": msg["timestamp"],
            "type": msg.get("type", "text"),
            "meta": msg.get("meta")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
