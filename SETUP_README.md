# LevelUp Fitness App - Complete Setup Guide

## Overview
LevelUp is a comprehensive AI-powered fitness, beauty, and nutrition app with gamification features, real-time community chat, AI-powered scanners, and subscription payments.

## Tech Stack
- **Frontend**: React + Tailwind CSS + shadcn/ui components
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: Supabase Auth (Email/Password, Google OAuth, Apple OAuth)
- **Payments**: Stripe (Test Mode)
- **AI**: OpenAI GPT-4 Vision API
- **Email**: Nodemailer (SMTP)

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (already configured)
- Stripe account (test mode)
- OpenAI API key (optional, uses mock data if not provided)

### Installation

1. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
yarn install
```

2. **Configure Environment Variables**

**Backend (.env)**
```env
SUPABASE_URL=https://bwzedcntzydajqwdevvu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Test Keys (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# OpenAI API Key (Optional - uses mock data if not provided)
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE

# Email Config (Use Gmail App Password or SendGrid)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@levelup.app

# Server Config
PORT=8000
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_SUPABASE_URL=https://bwzedcntzydajqwdevvu.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_BACKEND_URL=http://localhost:8000
```

3. **Run the Application**

In two separate terminals:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
yarn start
```

The app will be available at http://localhost:3000

---

## Features Implemented

### 1. Authentication ✅
- **Email/Password**: Full signup, login, email verification
- **Google OAuth**: Sign in with Google account
- **Apple OAuth**: Sign in with Apple ID
- **Password Reset**: Email-based password recovery flow
- **Session Management**: Secure JWT tokens with Supabase Auth

### 2. AI Scanners ✅
- **Food Scanner**: Upload food images, get nutritional analysis, calorie estimates, and recommendations
- **Body Scanner**: Analyze posture, body composition, get fitness insights
- **Face Scanner**: Skin health analysis, beauty recommendations
- **XP Rewards**: Earn XP for each scan (Food: 5XP, Body: 8XP, Face: 6XP)

### 3. Leveling & Gamification ✅
- **XP System**: Earn XP from scans and activities
- **Level Progression**: Level up every 100 XP (Level = XP / 100 + 1)
- **Streak Tracking**: Daily activity streaks with automatic calculation
- **Leaderboard**: Global ranking by XP

### 4. Community Features ✅
- **Real-time Chat**: Live messaging in community rooms
- **Create Rooms**: Public/private chat rooms
- **Join/Leave Rooms**: Dynamic membership management
- **Room Members**: View all members with their levels
- **Message History**: Persistent chat history

### 5. Payments (Stripe Test Mode) ✅
- **Subscription Plans**: Create checkout sessions for premium plans
- **Webhook Integration**: Automatic subscription status updates
- **Customer Management**: Stripe customer creation and linking
- **Cancel Subscription**: Self-service cancellation
- **Status Tracking**: Real-time subscription status

### 6. Notifications & Email ✅
- **In-App Notifications**: Push notifications for important events
- **Email Service**: Nodemailer integration for transactional emails
- **Mark as Read**: Notification management
- **Notification Types**: Multiple notification categories

### 7. User Profile & Stats ✅
- **Profile Management**: Update name, username, avatar, goals
- **Stats Dashboard**: View XP, level, streaks, scan counts
- **Scan History**: Complete history of all scans
- **Activity Tracking**: Daily and lifetime statistics

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple` - Apple OAuth
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/logout` - Sign out

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/leaderboard` - Get top users
- `GET /api/users/:userId` - Get public user profile

### Scanners
- `POST /api/scanners/food` - Upload food image for analysis
- `POST /api/scanners/body` - Upload body image for analysis
- `POST /api/scanners/face` - Upload face image for analysis
- `GET /api/scanners/history` - Get scan history
- `GET /api/scanners/stats` - Get scan statistics

### Community
- `GET /api/community/rooms` - List all public rooms
- `POST /api/community/rooms` - Create new room
- `GET /api/community/rooms/:roomId` - Get room details
- `POST /api/community/rooms/:roomId/join` - Join room
- `POST /api/community/rooms/:roomId/leave` - Leave room
- `GET /api/community/rooms/:roomId/messages` - Get messages
- `POST /api/community/rooms/:roomId/messages` - Send message
- `GET /api/community/rooms/:roomId/members` - Get room members
- `GET /api/community/my-rooms` - Get user's rooms

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe checkout
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/subscription-status` - Get subscription status
- `POST /api/payments/cancel-subscription` - Cancel subscription

### Notifications
- `GET /api/notifications` - List notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `POST /api/notifications/send-email` - Send email

---

## Testing Guide

### Test Accounts

**Email/Password Test**
```
Email: test@levelup.com
Password: Test123456
```

### Test Stripe Payment

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

Use any future expiry date, any CVC, and any ZIP code.

### Testing OAuth

**Google Sign-In**:
1. Click "Continue with Google"
2. You'll be redirected to Google's OAuth consent screen
3. After authorization, you'll be redirected back with a session

**Apple Sign-In**:
1. Click "Continue with Apple"
2. You'll be redirected to Apple's sign-in page
3. After authorization, you'll be redirected back with a session

Note: OAuth providers must be configured in Supabase Dashboard → Authentication → Providers

### Testing AI Scanners

1. Navigate to any scanner (Food/Body/Face)
2. Upload an image
3. If OpenAI API key is configured, you'll get real AI analysis
4. If not configured, you'll get mock data with realistic structure
5. XP will be automatically awarded and your level updated

### Testing Community Chat

1. Navigate to Social Hub
2. Create a new room or join an existing one
3. Send messages in real-time
4. Messages are instantly visible to all room members
5. Use Supabase real-time subscriptions for live updates

---

## Stripe Setup Instructions

1. **Get API Keys**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy "Publishable key" (starts with `pk_test_`)
   - Copy "Secret key" (starts with `sk_test_`)
   - Add Secret key to backend `.env` as `STRIPE_SECRET_KEY`

2. **Create Products & Prices**
   ```bash
   # In Stripe Dashboard → Products
   - Create product: "LevelUp Premium - Monthly"
   - Set price: $9.99/month
   - Copy Price ID (starts with `price_`)
   ```

3. **Configure Webhooks**
   ```bash
   # For local testing, use Stripe CLI:
   stripe listen --forward-to localhost:8000/api/payments/webhook

   # For production:
   - Dashboard → Developers → Webhooks
   - Add endpoint: https://your-domain.com/api/payments/webhook
   - Select events: checkout.session.completed, customer.subscription.*
   ```

4. **Test Payment Flow**
   - Navigate to Settings → Subscription
   - Click "Upgrade to Premium"
   - Use test card `4242 4242 4242 4242`
   - Check webhook logs for successful payment

---

## OAuth Provider Setup

### Google OAuth
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://bwzedcntzydajqwdevvu.supabase.co/auth/v1/callback`
   - `http://localhost:3000`
6. Copy Client ID and Client Secret
7. Add to Supabase Dashboard → Authentication → Providers → Google

### Apple OAuth
1. Go to https://developer.apple.com/
2. Create App ID and Services ID
3. Enable Sign in with Apple
4. Configure return URLs:
   - `https://bwzedcntzydajqwdevvu.supabase.co/auth/v1/callback`
5. Generate private key
6. Add credentials to Supabase Dashboard → Authentication → Providers → Apple

---

## Database Schema

All tables are created automatically via Supabase migration:

- **users**: User profiles, XP, levels, subscriptions
- **scanner_results**: All scan history with AI analysis
- **community_rooms**: Chat rooms
- **community_members**: Room membership
- **community_messages**: Chat messages
- **notifications**: In-app notifications
- **subscriptions**: Stripe subscription tracking

Row Level Security (RLS) is enabled on all tables with appropriate policies.

---

## Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
yarn build

# Deploy build folder to hosting service
```

### Backend Deployment (Railway/Render/Heroku)
```bash
cd backend

# Set environment variables in hosting dashboard
# Deploy using Git or Docker
```

### Environment Variables for Production
- Update `REACT_APP_BACKEND_URL` to production backend URL
- Update `FRONTEND_URL` in backend for OAuth redirects
- Configure production Stripe webhook endpoint
- Use production Supabase credentials

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env` files exist in both frontend and backend folders with correct Supabase credentials

### Issue: Stripe payments fail
**Solution**:
- Check `STRIPE_SECRET_KEY` in backend `.env`
- Verify webhook is receiving events (use Stripe CLI)
- Ensure webhook secret matches

### Issue: OAuth redirects to wrong URL
**Solution**:
- Update redirect URLs in Supabase Dashboard → Authentication → URL Configuration
- Ensure OAuth providers have correct redirect URIs

### Issue: AI scanners return mock data
**Solution**: Add valid OpenAI API key to backend `.env` as `OPENAI_API_KEY`

### Issue: Real-time chat not working
**Solution**:
- Check Supabase connection
- Verify RLS policies allow message reads
- Ensure user is a member of the room

---

## Support

For issues or questions:
- Check Supabase logs: https://app.supabase.com/project/YOUR_PROJECT/logs
- Check backend logs: `npm start` output
- Verify environment variables are correctly set
- Test API endpoints with curl or Postman

---

## License
MIT License - Feel free to use this project for learning and commercial purposes.

---

## Credits
Built with React, Node.js, Supabase, Stripe, and OpenAI
