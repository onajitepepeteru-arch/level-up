# 🚀 Quick Start Guide

## Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm run install-all
```

### Step 2: Configure API Keys
Add your keys to these files:

**backend/.env**
```env
# Stripe Test Keys (Get from: https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# OpenAI (Optional - uses mock data if not provided)
OPENAI_API_KEY=sk-YOUR_KEY_HERE

# Email (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Step 3: Run the App
```bash
npm run dev
```

Open http://localhost:3000 and enjoy!

---

## 🎯 Test Features

### 1. Create Account
- Use any email/password
- Or click "Continue with Google"
- Or click "Continue with Apple"

### 2. Try AI Scanners
- Navigate to Food/Body/Face scanner
- Upload any image
- Get instant AI analysis + XP

### 3. Join Community
- Go to Social Hub
- Create or join a room
- Send real-time messages

### 4. Subscribe (Test Mode)
- Settings → Subscription
- Use card: `4242 4242 4242 4242`
- Any expiry/CVC/ZIP

---

## 📖 Full Documentation

See **SETUP_README.md** for:
- Complete API documentation
- OAuth setup instructions
- Deployment guide
- Troubleshooting

See **DEPLOYMENT_COMPLETE.md** for:
- Feature implementation details
- Project structure
- Security features
- What's working

---

## ✅ Everything Works!

- ✅ Email/Password authentication
- ✅ Google & Apple Sign-In
- ✅ Password reset
- ✅ AI scanners (body, face, food)
- ✅ Real-time community chat
- ✅ XP & leveling system
- ✅ Stripe payments (test mode)
- ✅ Email notifications
- ✅ Leaderboard
- ✅ Scan history
- ✅ Profile management

**Your UI, animations, and design are preserved exactly as-is!**

---

## 🆘 Quick Troubleshooting

**Issue**: "Missing Supabase environment variables"
**Fix**: Supabase is already configured, check `.env` files exist

**Issue**: OAuth not working
**Fix**: Configure providers in Supabase Dashboard → Authentication → Providers

**Issue**: Scanners return mock data
**Fix**: This is normal! Add OpenAI API key for real AI analysis

**Issue**: Payments fail
**Fix**: Add your Stripe test secret key to `backend/.env`

---

## 📦 Download Package

**File**: `levelup-app-complete.tar.gz`

Extract and run anywhere:
```bash
tar -xzf levelup-app-complete.tar.gz
cd levelup-app-package
npm run install-all
npm run dev
```

---

**Happy coding! 🎉**
