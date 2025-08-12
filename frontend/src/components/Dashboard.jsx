import React from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Trophy, Zap, Target, Calendar, Settings, MessageCircle } from "lucide-react";
import { mockUser, mockProgress, mockMissions } from "../mock";
import { useToast } from "../hooks/use-toast";

const Dashboard = ({ onNavigate }) => {
  const xpPercentage = (mockUser.xp / mockUser.xpToNextLevel) * 100;
  const { toast } = useToast();

  const handleQuickAccess = (action) => {
    if (action === 'ai-chat') {
      onNavigate('ai-chat');
    } else {
      toast({
        title: action === 'schedule' ? "Schedule" : "Achievements",
        description: `${action === 'schedule' ? 'Calendar view' : 'Achievements page'} will be implemented!`
      });
    }
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Level Progress Card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Level {mockUser.level}</h2>
            <p className="text-sm text-gray-600">{mockUser.xp.toLocaleString()}/{mockUser.xpToNextLevel.toLocaleString()} XP to Level {mockUser.level + 1}</p>
          </div>
        </div>
        <Progress value={xpPercentage} className="h-3 mb-2" />
        <p className="text-sm text-gray-500">{Math.round(xpPercentage)}% Progress</p>
      </Card>

      {/* Avatar Section */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <img 
            src={mockUser.avatar} 
            alt="Avatar" 
            className="w-16 h-16 rounded-full object-cover border-4 border-blue-200"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">Your Avatar</h3>
            <p className="text-sm text-gray-600">Strength: 7, Dex: 8, Energy: 6, Willpower: 9</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg">
            Customize
          </Button>
        </div>
      </Card>

      {/* Daily Missions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Daily Missions
          </h3>
          <Button variant="ghost" size="sm">Customize</Button>
        </div>
        
        <div className="space-y-3">
          {mockMissions.map((mission) => (
            <div key={mission.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                <span className="text-lg">{mission.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{mission.type}</p>
                <p className="text-sm text-gray-600">{mission.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={mission.completed ? "default" : "secondary"} className="rounded-full">
                  +{mission.xp} XP
                </Badge>
                {mission.completed && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Access */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" />
          Quick Access
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-16 rounded-xl flex flex-col items-center gap-1 hover:bg-blue-50 transition-colors">
            <Calendar className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">Schedule</span>
          </Button>
          <Button variant="outline" className="h-16 rounded-xl flex flex-col items-center gap-1 hover:bg-green-50 transition-colors">
            <Trophy className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium">Achievements</span>
          </Button>
        </div>
      </Card>

      {/* Progress Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">{mockProgress.daily}%</p>
            <p className="text-sm text-gray-600">Daily Progress</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-600">{mockProgress.weekly}%</p>
            <p className="text-sm text-gray-600">Weekly Consistency</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;