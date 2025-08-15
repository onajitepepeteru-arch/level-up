# LevelUP Fitness App

A comprehensive fitness tracking application with AI-powered coaching, body/face/food scanning, and social features.

## 🚀 Features

- **AI Fitness Coach**: Powered by Emergent LLM for personalized guidance
- **Body Scanner**: Posture analysis and body composition tracking
- **Face Scanner**: Skin health analysis and skincare recommendations  
- **Food Scanner**: Nutritional analysis and meal tracking
- **Social Hub**: Community features with groups and feed
- **Gamification**: Level up system with XP and achievements
- **Onboarding Flow**: Personalized setup questions
- **Settings & Profile**: Subscription plans and user management

## 🏗️ Tech Stack

### Frontend
- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **Axios** for API calls
- **React Router** for navigation

### Backend  
- **FastAPI** with async/await
- **MongoDB** with Motor async driver
- **Emergent LLM Integration** for AI features
- **Pydantic** for data validation
- **CORS** middleware for frontend integration

## 📁 Project Structure

```
levelup-fitness-app/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── OnboardingFlow.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AIChat.jsx
│   │   │   └── ...
│   │   ├── hooks/          # Custom hooks
│   │   ├── mock.js         # Mock data
│   │   └── App.js          # Main app component
│   ├── public/
│   └── package.json
├── backend/                 # FastAPI application  
│   ├── server.py           # Main FastAPI server
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
└── README.md              # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB (local or cloud)

### Frontend Setup
```bash
cd frontend
yarn install
yarn start
```

### Backend Setup  
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Environment Variables
Backend `.env` file:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="levelup_fitness"  
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-642Ce6991268c0f90C
```

Frontend `.env` file:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 🎯 Key Features Implemented

### ✅ Complete Features
- User authentication with onboarding flow
- AI-powered chatbot using Emergent LLM
- All scanner types (mock analysis ready for API integration)
- Level system starting from Level 1, 0 XP
- Real-time progress tracking
- Settings and profile management
- Social hub with feed and groups
- Mobile-responsive design

### 🔄 Ready for API Integration
- Body scanning (FitExpress API ready)
- Face scanning (GlamAR API ready) 
- Food scanning (LogMeal API ready)
- Payment processing (Stripe ready)

## 🚀 Usage

1. **Start both services**: Frontend (port 3000) and Backend (port 8001)
2. **Sign up**: Complete the onboarding flow
3. **Explore features**: Try scanning, AI chat, social features
4. **Level up**: Earn XP through interactions and scans

## 🔑 AI Integration

The app uses **Emergent LLM** which provides access to:
- OpenAI GPT models
- Anthropic Claude
- Google Gemini

No additional API keys needed - uses universal Emergent key.

## 📱 Mobile Experience

Designed mobile-first with:
- Phone-like viewport (390x844)
- Touch-friendly interfaces
- Bottom navigation
- Smooth animations

## 🎮 Gamification System

- **Levels**: Start at Level 1, progress through XP
- **XP Sources**: Scans (+5-8 XP), Onboarding (+10 XP), Daily missions
- **Progress Tracking**: Visual progress bars and statistics

## 📞 Support

For questions about:
- **Platform features**: Use the support agent
- **Development**: Check code comments and structure
- **API integration**: Ready endpoints with mock responses

## 🚀 Next Steps

1. **Add API Keys**: Replace mock responses with real API integrations
2. **Deploy**: Use platform deployment features  
3. **Scale**: Add more features as user base grows

---

**Built with ❤️ using Emergent AI Platform**