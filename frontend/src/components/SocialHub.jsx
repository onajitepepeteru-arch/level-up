import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Send, Heart, MessageCircle, Share, Trophy, Users, Plus, Search, Hash, Bell, Image as ImageIcon, Video } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import ChatRoom from "./ChatRoom";
import CreateChatRoom from "./CreateChatRoom";

const SocialHub = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [currentView, setCurrentView] = useState('main'); // main, chat-room, create-room
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [chatRooms, setChatRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSocialData();
  }, [activeTab]);

  useEffect(() => {
    // Fetch unread notifications count for header badge
    const fetchUnread = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const res = await fetch(`${backendUrl}/api/user/${userId}/notifications`);
        if (res.ok) {
          const data = await res.json();
          const count = (data || []).filter(n => !n.read).length;
          setUnreadCount(count);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchUnread();
  }, []);

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
          setPosts(data.posts || []);
        } else {
          setPosts([]);
        }
      } else if (activeTab === 'chat') {
        // Load user's joined chat rooms only
        const response = await fetch(`${backendUrl}/api/social/chat-rooms?user_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setChatRooms(data.rooms || []);
        } else {
          setChatRooms([]);
        }
      } else if (activeTab === 'leaderboard') {
        // Load leaderboard
        const response = await fetch(`${backendUrl}/api/social/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data.leaderboard || []);
        } else {
          setLeaderboard([]);
        }
      }
    } catch (error) {
      console.error('Error loading social data:', error);
      // On error: keep empty instead of dummy
      if (activeTab === 'feed') setPosts([]);
      else if (activeTab === 'chat') setChatRooms([]);
      else if (activeTab === 'leaderboard') setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedFile) return;
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      let media = [];

      if (selectedFile) {
        const form = new FormData();
        form.append('file', selectedFile);
        const up = await fetch(`${backendUrl}/api/media/upload`, { method: 'POST', body: form });
        if (up.ok) {
          const m = await up.json();
          media = [{ id: m.id, content_type: m.content_type }];
        }
      }

      const postData = { user_id: userId, content: newPost, type: 'general', media };
      const response = await fetch(`${backendUrl}/api/social/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const newPostData = await response.json();
        setPosts(prev => [newPostData, ...prev]);
        setNewPost('');
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast({ title: 'Success', description: 'Post shared successfully!' });
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to share post', variant: 'destructive' });
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/social/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, post_id: postId }) });
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, isLiked: !post.isLiked, likes: post.likes + (post.isLiked ? -1 : 1) } : post));
    } catch (e) {
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, isLiked: !post.isLiked, likes: post.likes + (post.isLiked ? -1 : 1) } : post));
    }
  };

  const handleCommentPost = async (postId) => {
    try {
      const userId = localStorage.getItem('userId');
      const content = prompt('Write a comment:');
      if (!content) return;
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/social/comment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, post_id: postId, content }) });
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post));
      toast({ title: 'Comment added', description: 'Your comment was posted.' });
    } catch (e) {
      setPosts(prev => prev.map(post => post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post));
      toast({ title: 'Comment added', description: 'Your comment was posted.' });
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/social/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, post_id: postId }) });
      toast({ title: 'Shared', description: 'Post shared successfully!' });
    } catch (e) {
      toast({ title: 'Shared', description: 'Post shared successfully!' });
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

  const handleJoinRoom = async (roomId) => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      await fetch(`${backendUrl}/api/social/join-room`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, room_id: roomId }) });
      setChatRooms(prev => prev.map(room => room.id === roomId ? { ...room, isJoined: true, members: room.members + 1 } : room));
      toast({ title: "Success", description: "Joined chat room successfully!" });
    } catch (error) {
      setChatRooms(prev => prev.map(room => room.id === roomId ? { ...room, isJoined: true, members: room.members + 1 } : room));
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
        {(chatRooms || []).slice(0, 2).map((room) => (
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
        {(chatRooms || []).slice(2).map((room) => (
          <Card key={room.id} className="p-3 mb-2 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRoomClick(room)}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                <div className="text-lg">
                  {room.category === 'fitness' ? '💪' : room.category === 'nutrition' ? '🍎' : room.category === 'skincare' ? '✨' : '💬'}
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
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Joined</Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleJoinRoom(room.id); }}>Join</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-3">
      {leaderboard.map((user) => (
        <Card key={user.rank} className={`p-4 ${user.isCurrentUser ? 'border-purple-200 bg-purple-50' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.rank <= 3 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {user.rank <= 3 ? (user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉') : user.rank}
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{user.name}</span>
                {user.isCurrentUser && <Badge variant="default" className="text-xs">You</Badge>}
              </div>
              <div className="text-sm text-gray-600">Level {user.level} • {user.xp} XP • {user.streak} day streak</div>
            </div>
            <Trophy className={`w-5 h-5 ${user.rank <= 3 ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderFeed = () => (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {getUserInitials(JSON.parse(localStorage.getItem('user') || '{}').name)}
          </div>
          <div className="flex-1">
            <Input value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share your fitness journey..." className="mb-3" />
            {previewUrl && (
              <div className="mb-3">
                {selectedFile?.type?.startsWith('video') ? (
                  <video src={previewUrl} controls className="w-full rounded-lg border" />
                ) : (
                  <img src={previewUrl} alt="preview" className="w-full max-h-64 object-cover rounded-lg border" />
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={16} className="mr-1" /> Media
              </Button>
              <Button onClick={handleCreatePost} size="sm" disabled={!newPost.trim() && !selectedFile}>
                <Send size={16} className="mr-2" /> Share
              </Button>
            </div>
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
                <Badge variant="secondary" className="text-xs">Level {post.user.level}</Badge>
                <span className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</span>
              </div>
              <p className="text-gray-700 mb-3">{post.content}</p>
              {post.media && post.media.length > 0 && (
                <div className="mb-3 space-y-2">
                  {post.media.map((m) => (
                    m.content_type?.startsWith('video') ? (
                      <video key={m.id} src={`${process.env.REACT_APP_BACKEND_URL}/api/media/${m.id}`} controls className="w-full rounded-lg border" />
                    ) : (
                      <img key={m.id} src={`${process.env.REACT_APP_BACKEND_URL}/api/media/${m.id}`} alt="post media" className="w-full max-h-64 object-cover rounded-lg border" />
                    )
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Button variant="ghost" size="sm" onClick={() => handleLikePost(post.id)} className={`flex items-center gap-2 ${post.isLiked ? 'text-red-500' : ''}`}>
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                  {post.likes}
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleCommentPost(post.id)}>
                  <MessageCircle size={16} />
                  {post.comments}
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleSharePost(post.id)}>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Hub</h1>
            <p className="text-gray-600">Connect with the fitness community</p>
          </div>
          <button aria-label="Notifications" className="relative" onClick={() => onNavigate && onNavigate('notifications')}>
            <Bell size={22} className="text-purple-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        </div>
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-purple-600'}`}>
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
          <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>
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