# LevelUp - Complete Fitness & Wellness App

> A fully functional AI-powered fitness, beauty, and nutrition tracking app with gamification, social features, and subscription management.

## Quick Start

### Option 1: Run Everything at Once
```bash
./start.sh
```

### Option 2: Run Separately

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python server_new.py
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## What's Included

### Fully Functional Features

#### Authentication & Security
- Secure email/password registration and login
- JWT-based authentication with bcrypt password hashing
- User session management
- Profile management and settings

#### AI Scanners (Ready for Your API Keys)
- **Body Scanner**: Analyzes body photos for posture, composition, and body type
- **Face Scanner**: Analyzes skin for type, concerns, and personalized recommendations
- **Food Scanner**: Analyzes meals for nutritional content and calorie tracking
- Simulated AI responses ready to be replaced with your actual APIs

#### Gamification System
- XP earning for completing scans and activities
- Level progression (100 XP per level)
- Streak tracking for daily consistency
- Daily missions with XP rewards
- Avatar system displaying current level

#### Social Features
- Create and share posts with the community
- Like, comment, and interact with posts
- Community chat rooms (public and private)
- Real-time messaging
- User search and profiles
- Moderation system (backend ready)

#### Subscription & Payments
- Stripe integration (placeholder ready for your keys)
- Multiple subscription tiers: Free, Basic, Pro, Premium
- Subscription management and cancellation
- Payment webhook handling

#### Notifications & Reminders
- In-app notifications
- Custom reminders for:
  - Workouts
  - Skincare routines
  - Meal tracking
- Reminder scheduling by day and time

#### Settings & Profile
- Profile editing (name, avatar, goals, activity level)
- Account management
- Logout functionality
- Privacy and security settings

## Tech Stack

### Frontend
- React 18 with modern hooks
- TailwindCSS for styling
- shadcn/ui component library
- React Router for navigation

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL) for database
- JWT authentication
- bcrypt for password hashing

### Database
- Supabase with Row Level Security (RLS)
- Tables: users, scans, posts, chat_rooms, chat_messages, notifications, reminders, subscriptions

## Configuration

All settings are in the `.env` file:

### Already Configured
- Supabase URL and keys
- Backend API URL
- JWT secret
- Email addresses

### Add Your API Keys to Activate
```env
BODY_SCANNER_API_KEY=[Your API Key]
FACE_SCANNER_API_KEY=[Your API Key]
FOOD_SCANNER_API_KEY=[Your API Key]

STRIPE_PUBLIC_KEY=[Your Stripe Public Key]
STRIPE_SECRET_KEY=[Your Stripe Secret Key]
STRIPE_WEBHOOK_SECRET=[Your Webhook Secret]
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/{user_id}` - Get user data
- `PATCH /api/user/{user_id}` - Update user
- `POST /api/user/{user_id}/add-xp` - Add XP to user

### Scanners
- `POST /api/scan/body` - Scan body photo
- `POST /api/scan/face` - Scan face photo
- `POST /api/scan/food` - Scan food photo
- `GET /api/scan/{user_id}/scans` - Get scan history

### Social
- `GET /api/social/feed` - Get social feed
- `POST /api/social/post` - Create post
- `POST /api/social/like` - Like/unlike post
- `POST /api/social/comment` - Comment on post
- `GET /api/social/chat-rooms` - Get chat rooms
- `POST /api/social/chat-room/create` - Create chat room
- `POST /api/social/join-room` - Join chat room
- `GET /api/social/chat-room/{room_id}/messages` - Get messages
- `POST /api/social/chat-room/message` - Send message

### Notifications & Reminders
- `GET /api/user/{user_id}/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `GET /api/user/{user_id}/reminders` - Get reminders
- `POST /api/reminders` - Create reminder

### Payments
- `GET /api/payments/config` - Get Stripe config
- `POST /api/payments/create-checkout-session` - Create checkout
- `GET /api/payments/subscription/{user_id}` - Get subscription status
- `POST /api/payments/activate-subscription` - Activate subscription

## Database Schema

The app uses Supabase with the following tables:

- **users**: User accounts with profiles, XP, levels, and subscription data
- **scans**: Body, face, and food scan history with analysis results
- **posts**: Social media posts with likes and comments
- **chat_rooms**: Community chat rooms (public/private)
- **chat_messages**: Real-time chat messages
- **notifications**: User notifications
- **reminders**: Custom reminders for activities
- **subscriptions**: Payment and subscription management

All tables have Row Level Security (RLS) enabled for data protection.

## Integrating Real AI APIs

The scanners currently use simulated AI responses. To integrate real APIs:

1. Add your API keys to `.env`
2. Update the scanner endpoints in `backend/routes/scanners.py`
3. Replace the simulated analysis with actual API calls
4. Parse and format the API response for the frontend

Example structure maintained for compatibility:
```python
{
    "message": "Scan completed",
    "analysis": {
        # Your API response data
    },
    "xp_earned": 5,
    "scan_id": "uuid"
}
```

## Integrating Stripe Payments

To enable real payment processing:

1. Create a Stripe account at https://stripe.com
2. Add your Stripe keys to `.env`
3. Update `backend/routes/payments.py`:
   - Import Stripe SDK
   - Replace placeholder checkout with `stripe.checkout.Session.create()`
   - Implement webhook signature verification
   - Handle subscription lifecycle events

## Testing the App

### Basic Flow
1. Register a new account
2. Complete the onboarding flow
3. Try all three scanners (body, face, food)
4. Check XP and level progression
5. Create a post in Social Hub
6. Join or create a chat room
7. Set reminders in Settings

### Scanner Testing
For each scanner:
1. Upload or capture an image
2. Click "Analyze"
3. View the AI analysis results
4. Receive XP reward
5. Check scan history

## Production Deployment

### Important Security Steps
1. Change `JWT_SECRET` to a strong random value
2. Use environment-specific URLs for `REACT_APP_BACKEND_URL`
3. Enable HTTPS for both frontend and backend
4. Configure CORS to allow only your production domain
5. Set up Stripe webhooks with your production URL
6. Configure proper logging and monitoring

## Documentation

- `COMPLETE_SETUP.md` - Detailed setup and configuration guide
- `API_DOCUMENTATION.md` - Complete API reference
- `DATABASE_ACCESS.md` - Database schema and access guide

## Support

For issues or questions:
- Email: support@email.com
- API Docs: http://localhost:8000/docs (when server is running)

## License

© 2025 LevelUp. All rights reserved.
