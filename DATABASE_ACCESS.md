# 🗄️ Database Access Information

## MongoDB Atlas Cloud Database

### Connection Details
- **Host**: cluster0.mongodb.net
- **Database**: levelingup_production
- **Username**: levelingup
- **Password**: L3v3l1ngUp2025

### Full Connection String
```
mongodb+srv://levelingup:L3v3l1ngUp2025@cluster0.mongodb.net/levelingup_production?retryWrites=true&w=majority
```

## 🖥️ Viewing Your Database

### Option 1: MongoDB Atlas Web Interface
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign in with the following credentials:
   - **Email**: admin@levelingup.com
   - **Password**: Admin@LevelingUp2025
3. Navigate to your cluster → Browse Collections
4. View your data in real-time

### Option 2: MongoDB Compass (Desktop App)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using the connection string above
3. Browse collections graphically

### Option 3: Command Line (MongoDB Shell)
```bash
mongosh "mongodb+srv://cluster0.mongodb.net/levelingup_production" --username levelingup
```

## 📊 Database Structure

### Collections
- **users**: User accounts, profiles, XP, levels
- **scans**: Body/face/food scan results
- **chat_messages**: AI chat conversations
- **notifications**: App notifications

### Admin Access
Use the admin endpoints with:
- **Email**: admin@levelingup.com
- **Password**: Admin@LevelingUp2025

### API Endpoints for User Management
```bash
# Get all users
GET /api/admin/users?admin_email=admin@levelingup.com&admin_password=Admin@LevelingUp2025

# Get pending scans (content moderation)
GET /api/admin/pending-scans?admin_email=admin@levelingup.com&admin_password=Admin@LevelingUp2025
```

## 🔐 Security Notes
- Change default passwords in production
- The database is currently open for development - restrict access in production
- Content moderation is enabled for uploaded images
- User passwords are hashed with bcrypt

## 📈 Monitoring Users
- Real-time user count via admin API
- Track user activity, XP progression, scan history
- Monitor content moderation queue
- View AI chat usage analytics