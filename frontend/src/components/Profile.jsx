import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  User, 
  Camera, 
  Trophy, 
  Target, 
  Calendar,
  Edit3,
  Save,
  Crown
} from "lucide-react";
import { mockUser, mockProgress } from "../mock";
import { useToast } from "../hooks/use-toast";

const Profile = ({ onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: mockUser.name,
    email: mockUser.email,
    age: "28",
    height: "5'9\"",
    weight: "165 lbs",
    goals: "Gain muscle, Improve skin health"
  });
  const { toast } = useToast();

  const achievements = [
    { id: 1, name: "First Scan", icon: "🏆", unlocked: true },
    { id: 2, name: "Week Streak", icon: "🔥", unlocked: true },
    { id: 3, name: "Level 5", icon: "⭐", unlocked: true },
    { id: 4, name: "Social Butterfly", icon: "🦋", unlocked: false },
    { id: 5, name: "Nutrition Master", icon: "🥗", unlocked: false },
    { id: 6, name: "Skin Guru", icon: "✨", unlocked: false }
  ];

  const stats = [
    { label: "Total Scans", value: "47", color: "blue" },
    { label: "Streak Days", value: "23", color: "green" },
    { label: "Level Ups", value: "5", color: "yellow" },
    { label: "Friends", value: "12", color: "purple" }
  ];

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully!"
    });
    setIsEditing(false);
  };

  const handleUploadPhoto = () => {
    toast({
      title: "Photo Upload",
      description: "Photo upload feature will be implemented with backend!"
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          ← Back
        </Button>
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <Button 
          variant="ghost" 
          onClick={() => setIsEditing(!isEditing)}
          className="p-2"
        >
          {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <img 
              src={mockUser.avatar} 
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
            />
            <button 
              onClick={handleUploadPhoto}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-900">{profileData.name}</h2>
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge className="bg-yellow-100 text-yellow-700">Level {mockUser.level}</Badge>
            <Badge variant="secondary">{mockUser.xp.toLocaleString()} XP</Badge>
          </div>
          
          <Progress value={(mockUser.xp / mockUser.xpToNextLevel) * 100} className="h-2 mb-2" />
          <p className="text-sm text-gray-600">
            {mockUser.xpToNextLevel - mockUser.xp} XP to Level {mockUser.level + 1}
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl p-1">
          <TabsTrigger value="info" className="rounded-lg">Info</TabsTrigger>
          <TabsTrigger value="stats" className="rounded-lg">Stats</TabsTrigger>
          <TabsTrigger value="achievements" className="rounded-lg">Badges</TabsTrigger>
        </TabsList>

        {/* Profile Info */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Personal Information
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Name</Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Age</Label>
                  <Input
                    value={profileData.age}
                    onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-700 font-medium">Email</Label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium">Height</Label>
                  <Input
                    value={profileData.height}
                    onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium">Weight</Label>
                  <Input
                    value={profileData.weight}
                    onChange={(e) => setProfileData(prev => ({ ...prev, weight: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-1 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-700 font-medium">Goals</Label>
                <Input
                  value={profileData.goals}
                  onChange={(e) => setProfileData(prev => ({ ...prev, goals: e.target.value }))}
                  disabled={!isEditing}
                  className="mt-1 rounded-lg"
                />
              </div>
              
              {isEditing && (
                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              Your Statistics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className={`text-center p-4 rounded-xl ${
                  stat.color === 'blue' ? 'bg-blue-50' :
                  stat.color === 'green' ? 'bg-green-50' :
                  stat.color === 'yellow' ? 'bg-yellow-50' :
                  'bg-purple-50'
                }`}>
                  <p className={`text-2xl font-bold ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`}>{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Daily Progress</span>
                  <span className="font-medium">{mockProgress.daily}%</span>
                </div>
                <Progress value={mockProgress.daily} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Weekly Consistency</span>
                  <span className="font-medium">{mockProgress.weekly}%</span>
                </div>
                <Progress value={mockProgress.weekly} className="h-2" />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-4 mt-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`text-center p-4 rounded-xl border-2 transition-all ${
                  achievement.unlocked 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}>
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <p className="text-xs font-medium text-gray-700">{achievement.name}</p>
                  {achievement.unlocked && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs mt-1">Unlocked</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;