# NOTE: All backend routes are prefixed with /api via APIRouter to comply with ingress
import os
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field
from bson.binary import Binary
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_default_database() if client else None

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------- Utility -----------------------------

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out

# ----------------------------- Auth (simplified placeholders) -----------------------------

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

@api_router.post("/auth/register")
async def register_user(payload: RegisterRequest):
    # Basic register: create user with uuid and optional username derived from name
    user_id = str(uuid.uuid4())
    username = payload.name.strip().split(" ")[0].lower() if payload.name else payload.email.split("@")[0]
    user = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email,
        "username": username,  # not enforced unique by design per requirement
        "created_at": datetime.utcnow(),
        "level": 1,
        "xp": 0,
        "streak_days": 0,
    }
    await db.users.insert_one(user)
    return {"user": {"id": user_id, "name": payload.name, "email": payload.email, "username": username}, "token": str(uuid.uuid4())}

@api_router.get("/user/{user_id}")
async def get_user_data(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_resp = serialize_doc(user)
    user_resp.pop("_id", None)
    user_resp.pop("password_hash", None)
    return user_resp

# ----------------------------- Notifications -----------------------------

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class NotificationRequest(BaseModel):
    user_id: str
    title: str
    message: str

@api_router.get("/user/{user_id}/notifications")
async def get_notifications(user_id: str):
    notifications = await db.notifications.find({"user_id": user_id}).sort("timestamp", -1).to_list(50)
    return [serialize_doc(n) for n in notifications]

@api_router.post("/notifications")
async def send_notification(notification_data: NotificationRequest):
    notification = Notification(**notification_data.dict())
    await db.notifications.insert_one(notification.dict())
    return {"message": "Notification sent successfully"}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    result = await db.notifications.update_one({"id": notification_id}, {"$set": {"read": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

# ----------------------------- Social: Posts/Comments/Likes/Share -----------------------------

class SocialPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content: str
    type: str = "general"
    likes: int = 0
    likes_by: List[str] = []
    comments: List[dict] = []
    share_count: int = 0
    media: List[dict] = []  # [{id, content_type}]
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
    media: List[dict] = []

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

@api_router.post("/media/upload")
async def upload_media(file: UploadFile = File(...)):
    # Limit size to 5MB
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")
    media_id = str(uuid.uuid4())
    doc = {
        "id": media_id,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "data": Binary(data),
        "uploaded_at": datetime.utcnow(),
    }
    await db.media.insert_one(doc)
    return {"id": media_id, "content_type": doc["content_type"], "filename": file.filename}

@api_router.get("/media/{media_id}")
async def get_media(media_id: str):
    m = await db.media.find_one({"id": media_id})
    if not m:
        raise HTTPException(status_code=404, detail="Media not found")
    content = bytes(m.get("data"))
    return Response(content=content, media_type=m.get("content_type", "application/octet-stream"))

@api_router.get("/social/feed")
async def get_social_feed(user_id: Optional[str] = None):
    posts = await db.posts.find({}).sort("timestamp", -1).to_list(100)
    result = []
    for p in posts:
        u = await db.users.find_one({"id": p.get("user_id")})
        user_obj = {
            "name": (u or {}).get("name", "User"),
            "avatar": (u or {}).get("avatar_url"),
            "level": (u or {}).get("level", 1)
        }
        item = {
            "id": p.get("id"),
            "user": user_obj,
            "content": p.get("content", ""),
            "timestamp": (p.get("timestamp") or datetime.utcnow()).isoformat(),
            "likes": p.get("likes", 0),
            "comments": len(p.get("comments", [])),
            "isLiked": (user_id in p.get("likes_by", [])) if user_id else False,
            "type": p.get("type", "general"),
            "xp_earned": p.get("xp_earned"),
            "media": p.get("media", [])
        }
        result.append(item)
    return {"posts": result}

@api_router.post("/social/post")
async def create_post(req: CreatePostRequest):
    user = await db.users.find_one({"id": req.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    post = SocialPost(user_id=req.user_id, content=req.content, type=req.type, media=req.media or [])
    await db.posts.insert_one(post.dict())
    return {
        "id": post.id,
        "user": {"name": user.get("name", "User"), "avatar": user.get("avatar_url"), "level": user.get("level", 1)},
        "content": post.content,
        "timestamp": post.timestamp.isoformat(),
        "likes": 0,
        "comments": 0,
        "isLiked": False,
        "type": post.type,
        "media": post.media
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
    return {"comment": {"id": c.id, "user": {"name": user.get("name", "User")}, "content": c.content, "timestamp": c.timestamp.isoformat()}}

@api_router.post("/social/share")
async def share_post(req: SharePostRequest):
    post = await db.posts.find_one({"id": req.post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    new_count = post.get("share_count", 0) + 1
    await db.posts.update_one({"id": req.post_id}, {"$set": {"share_count": new_count}})
    return {"share_count": new_count}

# ----------------------------- Social: Chat Rooms -----------------------------

class ChatRoomModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    category: str = "general"
    type: str = "public"  # public/private
    members: List[str] = []
    lastMessage: str = ""
    lastActivity: datetime = Field(default_factory=datetime.utcnow)

@api_router.get("/social/chat-rooms")
async def get_chat_rooms(user_id: Optional[str] = None):
    # only user's rooms
    query = {"members": {"$in": [user_id]}} if user_id else {"members": {"$in": ["__none__"]}}
    rooms = await db.chat_rooms.find(query).sort("lastActivity", -1).to_list(50)
    result = []
    for r in rooms:
        result.append({
            "id": r.get("id"),
            "name": r.get("name"),
            "description": r.get("description", ""),
            "category": r.get("category", "general"),
            "type": r.get("type", "public"),
            "members": len(r.get("members", [])),
            "lastMessage": r.get("lastMessage", ""),
            "lastActivity": (r.get("lastActivity") or datetime.utcnow()).isoformat(),
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
        "lastActivity": new_room.lastActivity.isoformat(),
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

@api_router.post("/chat-room/invite")
async def invite_to_room(data: dict):
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    room = await db.chat_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    members = set(room.get("members", []))
    members.add(user_id)
    await db.chat_rooms.update_one({"id": room_id}, {"$set": {"members": list(members), "lastActivity": datetime.utcnow()}})
    return {"message": "Invited"}

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
    out = []
    for m in msgs:
        m.pop("_id", None)
        if isinstance(m.get("timestamp"), datetime):
            m["timestamp"] = m["timestamp"].isoformat()
        out.append(m)
    return {"messages": out}

@api_router.post("/chat-room/message")
async def post_chat_room_message(data: dict):
    user_id = data.get('user_id')
    room_id = data.get('room_id')
    message = data.get('message')
    if not (user_id and room_id and message):
        raise HTTPException(status_code=400, detail="Missing fields")
    user = await db.users.find_one({"id": user_id})
    ts = datetime.utcnow()
    msg = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "user": {"id": user_id, "name": (user or {}).get('name', 'User'), "avatar": (user or {}).get('avatar_url')},
        "message": message,
        "timestamp": ts.isoformat(),
        "type": data.get('type', 'text')
    }
    await db.chat_room_messages.insert_one({**msg, "timestamp": ts})
    await db.chat_rooms.update_one({"id": room_id}, {"$set": {"lastMessage": message, "lastActivity": datetime.utcnow()}})
    return msg

# ----------------------------- Users Directory Search -----------------------------

class UserPublic(BaseModel):
    id: str
    name: str
    username: str
    avatar_url: Optional[str] = None

@api_router.get("/users/search")
async def search_users(q: str):
    regex = {"$regex": q, "$options": "i"}
    users = await db.users.find({"$or": [{"name": regex}, {"username": regex}]}, {"password_hash": 0}).limit(20).to_list(20)
    result = []
    for u in users:
        u.pop("_id", None)
        result.append({
            "id": u.get("id"),
            "name": u.get("name", "User"),
            "username": u.get("username", "user"),
            "avatar": u.get("avatar_url")
        })
    return {"users": result}

# ----------------------------- User Scans (placeholders) -----------------------------

@api_router.get("/user/{user_id}/scans")
async def get_user_scans(user_id: str, scan_type: Optional[str] = None):
    query = {"user_id": user_id}
    if scan_type:
        query["scan_type"] = scan_type
    scans = await db.scans.find(query).sort("timestamp", -1).to_list(200)
    return [serialize_doc(s) for s in scans]

app.include_router(api_router)