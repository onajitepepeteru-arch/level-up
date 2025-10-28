# LevelUp App - Complete Setup Guide

## Overview

LevelUp is a complete AI-powered fitness, beauty, and nutrition tracking app with gamification, social features, and subscription management.

## Features Implemented

### 1. Authentication & User Management
- Secure email/password registration and login
- JWT-based authentication
- Password hashing with bcrypt
- User profile management
- Onboarding flow

### 2. AI Scanners (with placeholder APIs)
- **Body Scanner**: Analyzes body photos for posture, composition, and body type
- **Face Scanner**: Analyzes skin for type, concerns, and recommendations
- **Food Scanner**: Analyzes meals for nutritional content

All scanners are currently using simulated AI responses. To integrate real AI APIs:
- Replace `[BODY_SCANNER_API_KEY]` in `.env` with your actual API key
- Update the scanner endpoints in `backend/routes/scanners.py`

### 3. Gamification System
- XP earning for completing scans and activities
- Level progression (100 XP per level)
- Streak tracking
- Daily missions
- Avatar system with level display

### 4. Social Features
- Post creation and sharing
- Like and comment on posts
- Community chat rooms (public/private)
- Real-time messaging
- User search and profiles
- Report and moderation (backend ready)

### 5. Subscription & Payments
- Stripe integration (placeholder implementation)
- Multiple tiers: Free, Basic, Pro, Premium
- Subscription management
- Payment webhook handling

To activate Stripe:
- Add your Stripe keys to `.env`:
  - `STRIPE_PUBLIC_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Update `backend/routes/payments.py` with actual Stripe API calls

### 6. Notifications & Reminders
- In-app notifications
- Push notification system (backend ready)
- Custom reminders for:
  - Workouts
  - Skincare routines
  - Meal tracking
- Reminder scheduling by day and time

### 7. Settings & Profile
- Profile editing
- Dark/light mode toggle (UI ready)
- Account deletion
- Privacy settings
- Logout functionality

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+
- Supabase account (already configured)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the new backend server:
```bash
python server_new.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Start the development server:
```bash
yarn start
# or
npm start
```

The frontend will run on `http://localhost:3000`

## Database

The app uses Supabase with the following tables:
- `users` - User accounts and profiles
- `scans` - Body, face, and food scan history
- `posts` - Social media posts
- `chat_rooms` - Community chat rooms
- `chat_messages` - Chat messages
- `notifications` - User notifications
- `reminders` - User reminders
- `subscriptions` - Payment subscriptions

All tables have Row Level Security (RLS) enabled for data protection.

## Environment Variables

All configuration is in the `.env` file at the project root:

### Required (Already Configured)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_BACKEND_URL` - Backend API URL

### Optional (Replace Placeholders)
- `BODY_SCANNER_API_KEY=[BODY_SCANNER_API_KEY]`
- `FACE_SCANNER_API_KEY=[FACE_SCANNER_API_KEY]`
- `FOOD_SCANNER_API_KEY=[FOOD_SCANNER_API_KEY]`
- `STRIPE_PUBLIC_KEY=[STRIPE_PUBLIC_KEY]`
- `STRIPE_SECRET_KEY=[STRIPE_SECRET_KEY]`
- `STRIPE_WEBHOOK_SECRET=[STRIPE_WEBHOOK_SECRET]`

### Contact Emails
- `SUPPORT_EMAIL=support@email.com`
- `NOREPLY_EMAIL=noreply@email.com`

## API Integration Guide

### Replacing AI Scanner Placeholders

To integrate real AI scanning APIs:

1. Obtain API keys from your AI service provider
2. Update the `.env` file with your keys
3. Modify the scanner routes in `backend/routes/scanners.py`:
   - Replace the simulated analysis with actual API calls
   - Parse the API response and format it for the frontend
   - Maintain the same response structure for compatibility

### Stripe Payment Integration

To enable real payment processing:

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Update `.env` with your Stripe keys
4. In `backend/routes/payments.py`:
   - Import the Stripe SDK: `import stripe`
   - Replace placeholder checkout session with: `stripe.checkout.Session.create()`
   - Implement webhook signature verification
   - Handle subscription lifecycle events

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Endpoints
- `GET /api/user/{user_id}` - Get user data
- `PATCH /api/user/{user_id}` - Update user
- `POST /api/user/{user_id}/add-xp` - Add XP to user

### Scanner Endpoints
- `POST /api/scan/body` - Scan body photo
- `POST /api/scan/face` - Scan face photo
- `POST /api/scan/food` - Scan food photo
- `GET /api/scan/{user_id}/scans` - Get scan history

### Social Endpoints
- `GET /api/social/feed` - Get social feed
- `POST /api/social/post` - Create post
- `POST /api/social/like` - Like/unlike post
- `POST /api/social/comment` - Comment on post
- `GET /api/social/chat-rooms` - Get chat rooms
- `POST /api/social/chat-room/create` - Create chat room
- `POST /api/social/join-room` - Join chat room
- `GET /api/social/chat-room/{room_id}/messages` - Get messages
- `POST /api/social/chat-room/message` - Send message

### Notification Endpoints
- `GET /api/user/{user_id}/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PATCH /api/notifications/{id}/read` - Mark as read
- `GET /api/user/{user_id}/reminders` - Get reminders
- `POST /api/reminders` - Create reminder

### Payment Endpoints
- `GET /api/payments/config` - Get Stripe config
- `POST /api/payments/create-checkout-session` - Create checkout
- `GET /api/payments/subscription/{user_id}` - Get subscription
- `POST /api/payments/activate-subscription` - Activate subscription
- `POST /api/payments/cancel-subscription` - Cancel subscription

## Testing

### Test User Flow
1. Register a new account
2. Complete onboarding
3. Try all three scanners
4. Check XP and level progression
5. Create a post in Social Hub
6. Join a chat room
7. Set reminders in Settings

### Test Scanner Flow
Each scanner:
1. Upload or capture an image
2. Click "Analyze"
3. View AI results
4. Receive XP
5. Check scan history

## Production Deployment

### Important Notes
- Change `JWT_SECRET` in `.env` to a strong random value
- Use environment-specific URLs for `REACT_APP_BACKEND_URL`
- Enable HTTPS for both frontend and backend
- Configure CORS to allow only your domain
- Set up Stripe webhooks with your production URL
- Configure email service for notifications
- Set up proper logging and monitoring

## Support

For issues or questions:
- Contact: support@email.com
- Check the API documentation at `/docs` when server is running

## License

© 2025 LevelUp. All rights reserved.
