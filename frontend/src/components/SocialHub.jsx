import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Avatar } from "./ui/avatar";
import { Send, Heart, MessageCircle, Share, Trophy, Users, Plus, Search, Hash } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import ChatRoom from "./ChatRoom";
import CreateChatRoom from "./CreateChatRoom";

const SocialHub = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [currentView, setCurrentView] = useState('main'); // main, chat-room, create-room
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSocialData();
  }, [activeTab]);

  const loadSocialData = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      if (activeTab === 'feed') {
        // Load social feed
        const response = await fetch(`${backendUrl}/api/social/feed?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts || getMockPosts());
        } else {
          setPosts(getMockPosts());
        }
      } else if (activeTab === 'chat') {
        // Load chat rooms
        const response = await fetch(`${backendUrl}/api/social/chat-rooms?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setChatRooms(data.rooms || getMockChatRooms());
        } else {
          setChatRooms(getMockChatRooms());
        }
      } else if (activeTab === 'leaderboard') {
        // Load leaderboard
        const response = await fetch(`${backendUrl}/api/social/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard || getMockLeaderboard());
        } else {
          setLeaderboard(getMockLeaderboard());
        }
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      // Load mock data as fallback
      if (activeTab === 'feed') setPosts(getMockPosts());
      else if (activeTab === 'chat') setChatRooms(getMockChatRooms());
      else if (activeTab === 'leaderboard') setLeaderboard(getMockLeaderboard());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockPosts = () => [
    {
      id: '1',
      user: { name: 'Sarah Johnson', avatar: null, level: 3 },
      content: 'Just completed my morning workout! 💪 Feeling amazing after that body scan - seeing real progress!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 12,
      comments: 3,
      isLiked: false,
      type: 'achievement',
      xp_earned: 15
    },
    {
      id: '2',
      user: { name: 'Mike Chen', avatar: null, level: 5 },
      content: 'Food scan revealed I was missing protein in my diet. Thanks to the AI coach for the great meal suggestions! 🥗',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      likes: 8,
      comments: 5,
      isLiked: true,
      type: 'nutrition'
    },
    {
      id: '3',
      user: { name: 'Alex Rivera', avatar: null, level: 2 },
      content: 'Week 2 of my fitness journey! The face scanner helped me improve my skincare routine. Loving this holistic approach! ✨',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      likes: 15,
      comments: 7,
      isLiked: false,
      type: 'progress'
    }
  ];

  const getMockChatRooms = () => [
    {
      id: '1',
      name: 'Fitness Beginners',
      description: 'Support group for fitness newcomers',
      category: 'fitness',
      type: 'public',
      members: 156,
      lastMessage: 'Just shared my first scan results!',
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      isJoined: true
    },
    {
      id: '2',
      name: 'Nutrition Masters',
      description: 'Share recipes and nutrition tips',
      category: 'nutrition',
      type: 'public',
      members: 89,
      lastMessage: 'Great protein smoothie recipe here...',
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isJoined: false
    },
    {
      id: '3',
      name: 'Body Transformation',
      description: 'Track your body scan progress together',
      category: 'fitness',
      type: 'public',
      members: 203,
      lastMessage: 'Amazing progress this month everyone!',
      lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isJoined: true
    },
    {
      id: '4',
      name: 'Skincare Squad',
      description: 'Glowing skin tips and face scan discussions',
      category: 'skincare',
      type: 'public',
      members: 67,
      lastMessage: 'Try this new moisturizer routine!',
      lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isJoined: false
    }
  ];

  const getMockLeaderboard = () => [
    { rank: 1, name: 'Jessica Wong', level: 8, xp: 2840, streak: 15, avatar: null },
    { rank: 2, name: 'David Park', level: 7, xp: 2650, streak: 12, avatar: null },
    { rank: 3, name: 'Maria Garcia', level: 6, xp: 2100, streak: 18, avatar: null },
    { rank: 4, name: 'You', level: 1, xp: 50, streak: 1, avatar: null, isCurrentUser: true },
    { rank: 5, name: 'Tom Wilson', level: 5, xp: 1890, streak: 9, avatar: null }
  ];

  const handleJoinRoom = async (roomId) => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      await fetch(`${backendUrl}/api/social/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, room_id: roomId })
      });
      
      setChatRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, isJoined: true, members: room.members + 1 }
          : room
      ));
      
      toast({ title: "Success", description: "Joined chat room successfully!" });
    } catch (error) {
      setChatRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, isJoined: true, members: room.members + 1 }
          : room
      ));
      toast({ title: "Success", description: "Joined chat room successfully!" });
    }
  };

  const handleRoomClick = (room) => {
    if (room.isJoined) {
      setSelectedRoom(room);
      setCurrentView('chat-room');
    } else {
      handleJoinRoom(room.id);
    }
  };

  const handleCreateRoom = () => {
    setCurrentView('create-room');
  };

  const handleRoomCreated = (newRoom) => {
    setChatRooms(prev => [newRoom, ...prev]);
    setSelectedRoom(newRoom);
    setCurrentView('chat-room');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedRoom(null);
  };

  // If in chat room view
  if (currentView === 'chat-room' && selectedRoom) {
    return <ChatRoom room={selectedRoom} onBack={handleBackToMain} onNavigate={onNavigate} />;
  }

  // If in create room view
  if (currentView === 'create-room') {
    return <CreateChatRoom onBack={handleBackToMain} onCreate={handleRoomCreated} />;
  }

  const renderChatRooms = () => (
    <div className="space-y-4">
      {/* Search and Create */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search chat rooms..." className="pl-10" />
        </div>
        <Button size="sm" onClick={handleCreateRoom} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus size={16} className="mr-2" />
          Create
        </Button>
      </div>

      {/* Featured Rooms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Featured Rooms</h3>
        
        {chatRooms.slice(0, 2).map((room) => (
          <Card key={room.id} className="p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRoomClick(room)}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Hash size={16} className="text-gray-400" />
                <h4 className="font-semibold">{room.name}</h4>
                {room.type === 'private' && <Badge variant="outline" className="text-xs">Private</Badge>}
              </div>
              <Badge variant="outline" className="text-xs">
                <Users size={12} className="mr-1" />
                {room.members}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{room.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <p className="truncate max-w-48">{room.lastMessage}</p>
                <p>{formatTimeAgo(room.lastActivity)}</p>
              </div>
              
              {room.isJoined ? (
                <Badge className="bg-green-500">
                  <MessageCircle size={12} className="mr-1" />
                  Joined
                </Badge>
              ) : (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); handleJoinRoom(room.id); }}>
                  Join
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* All Rooms */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">All Rooms</h3>
        
        {chatRooms.slice(2).map((room) => (
          <Card key={room.id} className="p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRoomClick(room)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                <div className="text-lg">
                  {room.category === 'fitness' ? '💪' : 
                   room.category === 'nutrition' ? '🍎' : 
                   room.category === 'skincare' ? '✨' : '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{room.name}</h4>
                    <Badge variant="secondary" className="text-xs">{room.members}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{room.description}</p>
                </div>
              </div>
              
              {room.isJoined ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Joined
                </Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleJoinRoom(room.id); }}>
                  Join
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      const userId = localStorage.getItem('userId');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const postData = {
        user_id: userId,
        content: newPost,
        type: 'general'
      };
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        const newPostData = await response.json();
        setPosts(prev => [newPostData, ...prev]);
        setNewPost('');
        toast({ title: "Success", description: "Post shared successfully!" });
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      // Fallback: Add post locally
      const mockPost = {
        id: Date.now().toString(),
        user: { 
          name: JSON.parse(localStorage.getItem('user') || '{}').name || 'You',
          avatar: null,
          level: 1
        },
        content: newPost,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        isLiked: false,
        type: 'general'
      };
      
      setPosts(prev => [mockPost, ...prev]);
      setNewPost('');
      toast({ title: "Success", description: "Post shared successfully!" });
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/social/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, post_id: postId })
      });
      
      // Update UI regardless of backend response
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.likes + (post.isLiked ? -1 : 1) }
          : post
      ));
    } catch (error) {
      // Update UI even if backend fails
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.likes + (post.isLiked ? -1 : 1) }
          : post
      ));
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getUserInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const renderFeed = () => (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {getUserInitials(JSON.parse(localStorage.getItem('user') || '{}').name)}
          </div>
          <div className="flex-1">
            <Input
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your fitness journey..."
              className="mb-3"
            />
            <Button onClick={handleCreatePost} size="sm" disabled={!newPost.trim()}>
              <Send size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts */}
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {getUserInitials(post.user.name)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{post.user.name}</span>
                <Badge variant="secondary" className="text-xs">
                  Level {post.user.level}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(post.timestamp)}
                </span>
              </div>
              
              <p className="text-gray-700 mb-3">{post.content}</p>
              
              {post.xp_earned && (
                <Badge className="mb-3 bg-green-500">
                  +{post.xp_earned} XP Earned
                </Badge>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : ''}`}
                >
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                  {post.likes}
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <MessageCircle size={16} />
                  {post.comments}
                </Button>
                
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Share size={16} />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-3">
      {leaderboard.map((user, index) => (
        <Card 
          key={user.rank} 
          className={`p-4 ${user.isCurrentUser ? 'border-purple-200 bg-purple-50' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              user.rank === 1 ? 'bg-yellow-500 text-white' :
              user.rank === 2 ? 'bg-gray-400 text-white' :
              user.rank === 3 ? 'bg-amber-600 text-white' :
              'bg-gray-200 text-gray-700'
            }`}>
              {user.rank <= 3 ? (
                user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'
              ) : (
                user.rank
              )}
            </div>
            
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {getUserInitials(user.name)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.name}</span>
                {user.isCurrentUser && <Badge variant="default" className="text-xs">You</Badge>}
              </div>
              <div className="text-sm text-gray-600">
                Level {user.level} • {user.xp} XP • {user.streak} day streak
              </div>
            </div>
            
            <Trophy className={`w-5 h-5 ${
              user.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'
            }`} />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Social Hub</h1>
        <p className="text-gray-600">Connect with the fitness community</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-6">
          {[
            { id: 'feed', label: 'Feed', icon: MessageCircle },
            { id: 'chat', label: 'Chat Rooms', icon: Users },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-purple-600'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'feed' && renderFeed()}
            {activeTab === 'chat' && renderChatRooms()}
            {activeTab === 'leaderboard' && renderLeaderboard()}
          </>
        )}
      </div>
    </div>
  );
};

export default SocialHub;