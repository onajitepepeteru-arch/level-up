import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MessageCircle, Users, Bell, Search, Plus, Crown, Heart, Share2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { mockSocialFeed, mockChats, mockGroups } from "../mock";

const SocialHub = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState("feed");
  const { toast } = useToast();

  const handleChat = (chatUser) => {
    if (chatUser === "AI Coach") {
      onNavigate('ai-chat');
    } else {
      toast({
        title: "Chat Feature",
        description: `Opening chat with ${chatUser}...`
      });
    }
  };

  const handleMessage = (user) => {
    toast({
      title: "Message",
      description: `Messaging ${user}...`
    });
  };

  const handleJoinGroup = (groupName) => {
    toast({
      title: "Group",
      description: `Joining ${groupName}...`
    });
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">Social Hub</h1>
        <p className="text-gray-600 mt-1">Your Feed</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl p-1">
          <TabsTrigger value="feed" className="rounded-lg">Feed</TabsTrigger>
          <TabsTrigger value="chats" className="rounded-lg">Chats</TabsTrigger>
          <TabsTrigger value="groups" className="rounded-lg">Groups</TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-4 mt-4">
          {mockSocialFeed.map((post) => (
            <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <img 
                  src={post.user.avatar} 
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{post.user.name}</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                      Level {post.user.level}
                    </Badge>
                    <span className="text-sm text-gray-500">{post.timestamp}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4 mr-1" />
                      <span className="text-xs">Like</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleMessage(post.user.name)}
                      className="text-gray-500 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Comment</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500 transition-colors">
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="text-xs">Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Add Post Button */}
          <Card className="p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <div className="text-center">
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Share your progress</p>
              <p className="text-xs text-gray-400">Let others know about your achievements!</p>
            </div>
          </Card>
        </TabsContent>

        {/* Chats Tab */}
        <TabsContent value="chats" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Chats</h3>
            <Button variant="ghost" size="sm" className="text-blue-600">New</Button>
          </div>
          
          {mockChats.map((chat) => (
            <Card key={chat.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={chat.user.avatar} 
                    alt={chat.user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.unread && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">1</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{chat.user.name}</span>
                    <span className="text-sm text-gray-500">{chat.timestamp}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{chat.lastMessage}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleChat(chat.user.name)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Chat
                </Button>
              </div>
            </Card>
          ))}
          
          {/* AI Coach Chat */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">AI Fitness Coach</span>
                  <Badge className="bg-purple-100 text-purple-700 text-xs">PRO</Badge>
                </div>
                <p className="text-gray-600 text-sm">Ready to help you reach your goals!</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => handleChat("AI Coach")}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Chat
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Interest Groups</h3>
            <Button variant="ghost" size="sm" className="text-blue-600">Discover</Button>
          </div>
          
          {mockGroups.map((group) => (
            <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  group.type === 'skincare' ? 'bg-pink-100' : 'bg-blue-100'
                }`}>
                  {group.type === 'skincare' ? (
                    <span className="text-2xl">✨</span>
                  ) : (
                    <span className="text-2xl">💪</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{group.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.members} members
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                  <Button 
                    size="sm" 
                    onClick={() => handleJoinGroup(group.name)}
                    className={`rounded-lg ${
                      group.type === 'skincare' 
                        ? 'bg-pink-600 hover:bg-pink-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    Join Group
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {/* Discover More Groups */}
          <Card className="p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer">
            <div className="text-center">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Discover More Groups</p>
              <p className="text-xs text-gray-400">Find communities that match your interests</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialHub;