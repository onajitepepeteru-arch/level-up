import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Calendar, Trophy, Target, TrendingUp, Settings, MessageCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const Dashboard = ({ onNavigate }) => {
  const [userData, setUserData] = useState(null);
  const [dailyStats, setDailyStats] = useState({
    completedScans: 0,
    totalXP: 0,
    streakDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadDailyStats();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/user/${userId}/scans`);
      
      if (response.ok) {
        const scans = await response.json();
        const today = new Date().toDateString();
        const todayScans = scans.filter(scan => 
          new Date(scan.timestamp).toDateString() === today
        );
        
        setDailyStats({
          completedScans: todayScans.length,
          totalXP: userData?.xp || 0,
          streakDays: calculateStreak(scans)
        });
      }
    } catch (error) {
      console.error('Error loading daily stats:', error);
    }
  };

  const calculateStreak = (scans) => {
    if (!scans || scans.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toDateString();
      const hasActivityOnDate = scans.some(scan => 
        new Date(scan.timestamp).toDateString() === dateStr
      );
      
      if (hasActivityOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getXPProgress = () => {
    const currentXP = userData?.xp || 0;
    const currentLevel = userData?.level || 1;
    const xpForNextLevel = currentLevel * 100;
    return (currentXP / xpForNextLevel) * 100;
  };

  const getDailyMissions = () => [
    {
      id: 'food_scan',
      title: 'Food Scan',
      description: 'Complete your first scan for +5 XP',
      xp: 5,
      icon: '🍎',
      completed: dailyStats.completedScans > 0
    },
    {
      id: 'body_scan',
      title: 'Body Scan',
      description: 'Track your posture & stats for +8 XP',
      xp: 8,
      icon: '💪',
      completed: false // Will be updated based on actual scans
    },
    {
      id: 'face_scan',
      title: 'Face Scan',
      description: 'Analyze your skin health for +6 XP',
      xp: 6,
      icon: '✨',
      completed: false // Will be updated based on actual scans
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData?.name || 'User'}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('notifications')}
            >
              <Calendar size={20} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('settings')}
            >
              <Settings size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Level & XP Card */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Level {userData?.level || 1}</h3>
                <p className="text-white/80">{userData?.xp || 0}/{(userData?.level || 1) * 100} XP to Level {(userData?.level || 1) + 1}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {dailyStats.streakDays} day streak
            </Badge>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${getXPProgress()}%` }}
            />
          </div>
          
          <div className="text-sm text-white/80">
            {getXPProgress() < 100 ? `${Math.round(getXPProgress())}% Progress` : "Ready to Level Up!"}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{dailyStats.completedScans}</div>
            <div className="text-xs text-gray-600">Scans Today</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userData?.xp || 0}</div>
            <div className="text-xs text-gray-600">Total XP</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{dailyStats.streakDays}</div>
            <div className="text-xs text-gray-600">Day Streak</div>
          </Card>
        </div>

        {/* Your Avatar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Avatar</h3>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600 space-y-1">
                <div>Level: {userData?.level || 1} • XP: {userData?.xp || 0}</div>
                <div>Goals: {userData?.goals?.join(', ') || 'Not set'}</div>
                <div>Activity Level: {userData?.activity_level || 'Not set'}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Missions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target size={20} />
              Daily Missions
            </h3>
          </div>
          
          <div className="space-y-3">
            {getDailyMissions().map((mission) => (
              <div key={mission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{mission.icon}</span>
                  <div>
                    <div className="font-medium">{mission.title}</div>
                    <div className="text-sm text-gray-600">{mission.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={mission.completed ? "default" : "secondary"}>
                    {mission.completed ? "Complete" : `+${mission.xp} XP`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => onNavigate('ai-chat')}
            className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <div className="text-center">
              <MessageCircle size={24} className="mx-auto mb-1" />
              <div className="text-sm">AI Coach</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => onNavigate('activity')}
            variant="outline"
            className="h-16"
          >
            <div className="text-center">
              <TrendingUp size={24} className="mx-auto mb-1" />
              <div className="text-sm">View Activity</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;