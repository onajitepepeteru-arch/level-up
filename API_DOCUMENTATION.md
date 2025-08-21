# 📡 LEVELING-UP API DOCUMENTATION

## 🚀 **BASE URL**
```
Production: https://yourapi.domain.com/api
Development: http://localhost:8001/api
```

## 🔐 **AUTHENTICATION**

### **Register User**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-string",
    "name": "John Doe",
    "email": "john@example.com",
    "level": 1,
    "xp": 0,
    "subscription_plan": "Free"
  },
  "token": "jwt-token-string"
}
```

### **Login User**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### **Google Authentication**
```http
POST /auth/google
Content-Type: application/json

{
  "credential": "google-jwt-credential"
}
```

### **Apple Authentication**
```http
POST /auth/apple
Content-Type: application/json

{
  "id_token": "apple-identity-token",
  "code": "apple-authorization-code"
}
```

## 👤 **USER MANAGEMENT**

### **Get User Profile**
```http
GET /user/{user_id}
Authorization: Bearer {jwt-token}
```

### **Update User Profile**
```http
PATCH /user/{user_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "age": 25,
  "goals": ["Build Muscle", "Lose Weight"]
}
```

### **Upload Avatar**
```http
POST /upload/avatar?user_id={user_id}
Content-Type: multipart/form-data

Form Data:
- file: [image file]
```

## 🎯 **ONBOARDING**

### **Complete Onboarding**
```http
POST /onboarding
Content-Type: application/json

{
  "user_id": "uuid-string",
  "age": 25,
  "gender": "Male",
  "goals": ["Build Muscle", "Lose Weight"],
  "body_type": "Mesomorph",
  "activity_level": "Moderate",
  "health_conditions": []
}
```

## 📸 **SCANNING ENDPOINTS**

### **Body Scan**
```http
POST /scan/body?user_id={user_id}
Content-Type: multipart/form-data

Form Data:
- file: [image file]
```

**Response:**
```json
{
  "message": "Body scan completed successfully",
  "analysis": {
    "status": "completed",
    "recommendations": ["Continue building routine", "Focus on consistency"]
  },
  "xp_earned": 8
}
```

### **Face Scan**
```http
POST /scan/face?user_id={user_id}
Content-Type: multipart/form-data

Form Data:
- file: [image file]
```

### **Food Scan**
```http
POST /scan/food?user_id={user_id}
Content-Type: multipart/form-data

Form Data:
- file: [image file]
```

## 🤖 **AI CHAT**

### **Send Chat Message**
```http
POST /chat
Content-Type: application/json

{
  "user_id": "uuid-string",
  "session_id": "session-uuid",
  "message": "I need help with my workout plan"
}
```

**Response:**
```json
{
  "response": "Based on your Level 1 profile and goals, I recommend starting with..."
}
```

### **Get Chat History**
```http
GET /user/{user_id}/chat-history?session_id={session_id}
```

## 📊 **USER DATA**

### **Get User Scans**
```http
GET /user/{user_id}/scans?scan_type=body
```

**Response:**
```json
[
  {
    "id": "scan-uuid",
    "scan_type": "body",
    "timestamp": "2025-01-01T12:00:00Z",
    "xp_earned": 8,
    "analysis_result": {...}
  }
]
```

### **Get User Notifications**
```http
GET /user/{user_id}/notifications
```

### **Mark Notification as Read**
```http
PATCH /notifications/{notification_id}/read
```

## 👥 **SOCIAL FEATURES**

### **Get Social Feed**
```http
GET /social/feed?user_id={user_id}
```

### **Create Post**
```http
POST /social/post
Content-Type: application/json

{
  "user_id": "uuid-string",
  "content": "Just completed my morning workout! 💪",
  "type": "achievement"
}
```

### **Like Post**
```http
POST /social/like
Content-Type: application/json

{
  "user_id": "uuid-string",
  "post_id": "post-uuid"
}
```

### **Get Chat Rooms**
```http
GET /social/chat-rooms?user_id={user_id}
```

### **Join Chat Room**
```http
POST /social/join-room
Content-Type: application/json

{
  "user_id": "uuid-string",
  "room_id": "room-uuid"
}
```

### **Get Leaderboard**
```http
GET /social/leaderboard
```

## 🔔 **NOTIFICATIONS**

### **Send Notification**
```http
POST /notifications
Content-Type: application/json

{
  "user_id": "uuid-string",
  "title": "Congratulations!",
  "message": "You've reached Level 2!",
  "type": "success"
}
```

## 👑 **ADMIN ENDPOINTS**

### **Get All Users**
```http
GET /admin/users?admin_email=admin@levelingup.com&admin_password=Admin@LevelingUp2025
```

**Response:**
```json
{
  "total_users": 150,
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "level": 3,
      "xp": 250,
      "total_scans": 12,
      "subscription_plan": "Free",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### **Get Pending Content**
```http
GET /admin/pending-scans?admin_email=admin@levelingup.com&admin_password=Admin@LevelingUp2025
```

## 🏥 **HEALTH CHECK**

### **Server Status**
```http
GET /
```

**Response:**
```json
{
  "message": "Leveling-Up API is running",
  "version": "1.0.0"
}
```

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-01T12:00:00Z",
  "version": "1.0.0"
}
```

## 📋 **STATUS CODES**

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

## 🔧 **ERROR RESPONSES**

```json
{
  "detail": "Error description",
  "type": "validation_error",
  "loc": ["field_name"]
}
```

## 📊 **RATE LIMITING**

- **General API**: 100 requests/minute per user
- **Upload endpoints**: 20 requests/minute per user  
- **Admin endpoints**: 1000 requests/minute

## 🔐 **AUTHENTICATION HEADERS**

```http
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

## 📱 **WEBHOOKS** (Coming Soon)

### **Stripe Payments**
```http
POST /webhooks/stripe
```

### **Third-party Integrations**
```http
POST /webhooks/logmeal
POST /webhooks/glamar  
POST /webhooks/fitexpress
```

---

## 🎯 **INTEGRATION EXAMPLES**

### **JavaScript/React**
```javascript
const response = await fetch(`${BACKEND_URL}/api/user/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### **Python**
```python
import requests

response = requests.get(
  f"{BACKEND_URL}/api/user/{user_id}",
  headers={"Authorization": f"Bearer {token}"}
)
```

### **cURL**
```bash
curl -X GET \
  "${BACKEND_URL}/api/user/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Ready for production use!** 🚀