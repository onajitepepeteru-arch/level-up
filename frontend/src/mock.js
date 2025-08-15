// Mock data for LevelUp fitness app
export const mockUser = {
  id: "user123",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
};

export const mockProgress = {
  daily: 0,
  weekly: 0
};

export const mockMissions = [
  {
    id: "m1",
    type: "Food Scan",
    description: "Complete your daily scan for +5 XP",
    xp: 5,
    completed: false,
    icon: "🍎"
  },
  {
    id: "m2", 
    type: "Body Scan",
    description: "Track your posture & stats for +8 XP",
    xp: 8,
    completed: true,
    icon: "💪"
  },
  {
    id: "m3",
    type: "Face Scan", 
    description: "Log daily skincare for +6 XP",
    xp: 6,
    completed: false,
    icon: "✨"
  },
  {
    id: "m4",
    type: "Sleep Goal",
    description: "8:00-10:00h sleep for +15 XP",
    xp: 15,
    completed: true,
    icon: "😴"
  }
];

export const mockBodyComposition = {
  muscle: "38% (54% last)",
  posture: "Slight forward head tilt detected",
  bodyType: "Mesomorph"
};

export const mockSkinAnalysis = {
  skinType: "Combination",
  concerns: "Minor acne, slight acne tone",
  aiSuggestion: "Gentle cleansing, niacinamide, SPF 50+",
  recommendedProduct: "Youth-Glow Serum"
};

export const mockScanHistory = [
  {
    id: "scan1",
    type: "body",
    date: "2024-01-15",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
  },
  {
    id: "scan2", 
    type: "face",
    date: "2024-01-14",
    image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=300&h=200&fit=crop"
  }
];

export const mockFoodLog = [
  {
    id: "food1",
    name: "Chicken Salad",
    calories: 320,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop"
  },
  {
    id: "food2",
    name: "Brown Rice Bowl", 
    calories: 420,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=100&h=100&fit=crop"
  },
  {
    id: "food3",
    name: "Oat Milk Latte",
    calories: 150,
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop"
  }
];

export const mockNutrition = {
  weekly: {
    calories: "14,450/14,000 kcal",
    protein: "450/500 g", 
    carbs: "1,800/2,000 g"
  }
};

export const mockSocialFeed = [
  {
    id: "post1",
    user: {
      name: "Alex Lux",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face",
      level: 8
    },
    content: "Leveled up to Level 8! Completion: 52-day fitness streak!",
    timestamp: "2h ago",
    type: "achievement"
  },
  {
    id: "post2",
    user: {
      name: "Maya H",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b1ad?w=50&h=50&fit=crop&crop=face", 
      level: 6
    },
    content: "joined Glowing Skin Army. Excited to share my skincare wins!",
    timestamp: "4h ago",
    type: "group_join"
  }
];

export const mockChats = [
  {
    id: "chat1",
    user: {
      name: "Face 1 w/ ProCoach",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
    },
    lastMessage: "Keep pushing, you're almost at your fitness goal!",
    timestamp: "2m ago",
    unread: true
  }
];

export const mockGroups = [
  {
    id: "group1",
    name: "Glowing Skin Army",
    description: "Join the 8-person skincare squad!", 
    members: 8,
    type: "skincare"
  },
  {
    id: "group2",
    name: "Team Fit",
    description: "Fitness fanatics celebrating gains today!",
    members: 12,
    type: "fitness"
  }
];