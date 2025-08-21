// Mock data for LevelUP fitness app

export const mockUser = {
  name: "Alex Rivera",
  level: 2,
  xp: 150,
  totalXP: 250,
  nextLevelXP: 300,
  streak: 7,
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
};

export const mockSkinAnalysis = {
  skinType: "Combination",
  description: "Oily T-zone, dry cheek area",
  concerns: "Minor acne breakouts, slight dryness on cheeks",
  aiSuggestion: "Based on your combination skin, I recommend a gentle cleanser twice daily, followed by a lightweight moisturizer. Use salicylic acid on your T-zone and a hydrating serum on your cheeks.",
  recommendedProduct: "Gentle Foaming Cleanser + Niacinamide Serum"
};

export const mockBodyAnalysis = {
  posture: "Good",
  postureDetails: "Slight forward head posture, otherwise well-aligned",
  composition: "Healthy muscle-to-fat ratio for your fitness level",
  workoutSuggestion: "Focus on strengthening your posterior chain and core stability. Add some cardiovascular exercise 3-4 times per week.",
  focusArea: "Upper back strengthening and core stability exercises"
};

export const mockNutritionAnalysis = {
  calories: 450,
  protein: 25,
  carbs: 35,
  fat: 18,
  healthScore: "Excellent",
  healthDetails: "Well-balanced macro distribution with quality ingredients",
  suggestion: "This is a nutritionally balanced meal! The protein content will support your fitness goals, and the complex carbs provide sustained energy.",
  recommendation: "Consider adding some leafy greens for extra micronutrients"
};

export const mockDailyMissions = [
  {
    id: 1,
    title: "Morning Body Scan",
    description: "Take your daily body composition photo",
    xp: 8,
    completed: false,
    icon: "💪"
  },
  {
    id: 2,
    title: "Log Your Breakfast",
    description: "Scan your morning meal for nutrition tracking",
    xp: 5,
    completed: true,
    icon: "🍳"
  },
  {
    id: 3,
    title: "Skincare Check-in",
    description: "Upload your face selfie for skin analysis",
    xp: 6,
    completed: false,
    icon: "✨"
  }
];

export const mockScanHistory = [
  {
    id: 1,
    type: "body",
    date: "2024-01-15",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
  },
  {
    id: 2,
    type: "face",
    date: "2024-01-14",
    image: "https://images.unsplash.com/photo-1494790108755-2616c27c2a12?w=300&h=200&fit=crop&crop=face"
  },
  {
    id: 3,
    type: "food",
    date: "2024-01-14",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop"
  },
  {
    id: 4,
    type: "body",
    date: "2024-01-13",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
  },
  {
    id: 5,
    type: "food",
    date: "2024-01-13",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop"
  },
  {
    id: 6,
    type: "face",
    date: "2024-01-12",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=200&fit=crop&crop=face"
  }
];

export const mockChatMessages = [
  {
    id: 1,
    sender: "ai",
    message: "Hey Alex! 🔥 I'm your personal AI fitness coach. I've analyzed your Level 2 profile and I'm here to help you reach your goals! What would you like to work on today?",
    timestamp: "10:30 AM"
  }
];

export const mockProgress = {
  weeklyXP: [45, 32, 67, 54, 89, 76, 45],
  weeklyScans: [2, 1, 3, 2, 4, 3, 2],
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
};