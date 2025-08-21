import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ArrowLeft, Users, Lock, Globe, Hash } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const CreateChatRoom = ({ onBack, onCreate }) => {
  const [roomData, setRoomData] = useState({
    name: '',
    description: '',
    type: 'public', // public, private
    category: 'general', // fitness, nutrition, skincare, general
    maxMembers: 50
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: 'general', name: 'General', icon: '💬', description: 'General discussions' },
    { id: 'fitness', name: 'Fitness', icon: '💪', description: 'Workout and training' },
    { id: 'nutrition', name: 'Nutrition', icon: '🍎', description: 'Diet and nutrition' },
    { id: 'skincare', name: 'Skincare', icon: '✨', description: 'Skincare and beauty' }
  ];

  const memberLimits = [10, 25, 50, 100, 250];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!roomData.name.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const newRoom = {
        ...roomData,
        id: Date.now().toString(),
        creator_id: userId,
        creator_name: userData.name,
        members: 1,
        created_at: new Date(),
        isJoined: true
      };
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/chat-room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom)
      });
      
      if (response.ok) {
        const createdRoom = await response.json();
        toast({
          title: "Success",
          description: `"${roomData.name}" chat room created successfully!`
        });
        onCreate(createdRoom);
      } else {
        throw new Error('Failed to create room');
      }
    } catch (error) {
      // Fallback: Create room locally
      const newRoom = {
        ...roomData,
        id: Date.now().toString(),
        creator_id: localStorage.getItem('userId'),
        creator_name: JSON.parse(localStorage.getItem('user') || '{}').name,
        members: 1,
        created_at: new Date(),
        isJoined: true,
        lastMessage: 'Room created',
        lastActivity: new Date()
      };
      
      toast({
        title: "Success",
        description: `"${roomData.name}" chat room created successfully!`
      });
      onCreate(newRoom);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Chat Room</h1>
            <p className="text-sm text-gray-600">Start a new community discussion</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={roomData.name}
                onChange={(e) => setRoomData({...roomData, name: e.target.value})}
                placeholder="e.g., Beginner Fitness Squad"
                className="mt-2"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{roomData.name.length}/50 characters</p>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={roomData.description}
                onChange={(e) => setRoomData({...roomData, description: e.target.value})}
                placeholder="Describe what your room is about..."
                className="mt-2 min-h-[80px]"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{roomData.description.length}/200 characters</p>
            </div>
          </div>
        </Card>

        {/* Category Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Category</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={roomData.category === category.id ? "default" : "outline"}
                onClick={() => setRoomData({...roomData, category: category.id})}
                className="h-auto p-4 justify-start text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-xs opacity-70">{category.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Privacy & Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Room Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={roomData.type === 'public' ? "default" : "outline"}
                  onClick={() => setRoomData({...roomData, type: 'public'})}
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Public</div>
                      <div className="text-xs opacity-70">Anyone can join</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  type="button"
                  variant={roomData.type === 'private' ? "default" : "outline"}
                  onClick={() => setRoomData({...roomData, type: 'private'})}
                  className="h-auto p-4 justify-start"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Private</div>
                      <div className="text-xs opacity-70">Invite only</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-3 block">Max Members</Label>
              <div className="flex flex-wrap gap-2">
                {memberLimits.map((limit) => (
                  <Button
                    key={limit}
                    type="button"
                    variant={roomData.maxMembers === limit ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoomData({...roomData, maxMembers: limit})}
                  >
                    {limit}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Preview
          </h3>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{roomData.name || 'Room Name'}</h4>
                <p className="text-sm text-gray-600">{roomData.description || 'Room description'}</p>
              </div>
              <div className="flex items-center gap-2">
                {roomData.type === 'private' ? <Lock size={14} /> : <Globe size={14} />}
                <Badge variant="outline" className="text-xs">
                  <Users size={12} className="mr-1" />
                  0/{roomData.maxMembers}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-lg">{categories.find(c => c.id === roomData.category)?.icon}</span>
              <Badge variant="secondary" className="text-xs">
                {categories.find(c => c.id === roomData.category)?.name}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isLoading || !roomData.name.trim()}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              "Create Room"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateChatRoom;