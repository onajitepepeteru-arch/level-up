import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Camera, Edit3, Trophy, Target, Calendar, Upload } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const Profile = ({ onBack }) => {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      const userId = localStorage.getItem('userId');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setEditData(user);
        setImagePreview(user.avatar_url);
      }

      // Fetch latest user data from backend
      if (userId) {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/user/${userId}`);
        
        if (response.ok) {
          const latestUserData = await response.json();
          setUserData(latestUserData);
          setEditData(latestUserData);
          setImagePreview(latestUserData.avatar_url);
          localStorage.setItem('user', JSON.stringify(latestUserData));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive"
        });
        return;
      }

      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('User not logged in');
      }

      // Upload profile image if selected
      if (profileImage) {
        const formData = new FormData();
        formData.append('file', profileImage);
        
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const uploadResponse = await fetch(`${backendUrl}/api/upload/avatar?user_id=${userId}`, {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          editData.avatar_url = uploadData.avatar_url;
        }
      }

      // Update profile data
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setProfileImage(null);
        
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  const getProfileInitials = () => {
    if (!userData?.name) return 'U';
    return userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAchievements = () => [
    {
      id: 'first_scan',
      title: 'First Scan',
      description: 'Completed your first health scan',
      icon: '🎯',
      unlocked: userData?.total_scans > 0
    },
    {
      id: 'level_up',
      title: 'Level Up',
      description: 'Reached Level 2',
      icon: '🚀',
      unlocked: userData?.level >= 2
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Maintained a 7-day streak',
      icon: '🔥',
      unlocked: userData?.streak_days >= 7
    },
    {
      id: 'scanner_pro',
      title: 'Scanner Pro',
      description: 'Completed 10 scans',
      icon: '📸',
      unlocked: userData?.total_scans >= 10
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={20} />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="p-6">
          <div className="text-center">
            <div className="relative inline-block mb-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                  {getProfileInitials()}
                </div>
              )}
              
              {isEditing && (
                <Button
                  onClick={triggerImageSelect}
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Camera size={14} />
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {userData?.name || 'User'}
            </h2>
            <p className="text-gray-600 mb-4">{userData?.email}</p>
            
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {userData?.level || 1}
                </div>
                <div className="text-sm text-gray-600">Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userData?.xp || 0}
                </div>
                <div className="text-sm text-gray-600">XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userData?.total_scans || 0}
                </div>
                <div className="text-sm text-gray-600">Scans</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Profile Form */}
        {isEditing && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={editData.age || ''}
                  onChange={(e) => setEditData({...editData, age: parseInt(e.target.value)})}
                  placeholder="Enter your age"
                />
              </div>
              
              <div>
                <Label htmlFor="goals">Fitness Goals</Label>
                <Input
                  id="goals"
                  value={editData.goals?.join(', ') || ''}
                  onChange={(e) => setEditData({...editData, goals: e.target.value.split(', ')})}
                  placeholder="e.g., Lose Weight, Build Muscle"
                />
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-lg font-bold">{userData?.streak_days || 0}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </Card>
          
          <Card className="p-4 text-center">
            <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold">{userData?.goals?.length || 0}</div>
            <div className="text-sm text-gray-600">Active Goals</div>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Achievements</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {getAchievements().map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  achievement.unlocked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className="font-semibold text-sm">{achievement.title}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {achievement.description}
                  </div>
                  {achievement.unlocked && (
                    <Badge variant="default" className="mt-2 text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity Summary */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium">
                {userData?.created_at 
                  ? new Date(userData.created_at).toLocaleDateString()
                  : 'Today'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Active</span>
              <span className="font-medium">
                {userData?.last_activity 
                  ? new Date(userData.last_activity).toLocaleDateString()
                  : 'Today'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subscription</span>
              <Badge variant={userData?.subscription_active ? 'default' : 'secondary'}>
                {userData?.subscription_plan || 'Free'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;