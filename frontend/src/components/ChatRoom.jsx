import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Send, Users, Settings, MoreVertical, Search, UserPlus } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const ChatRoom = ({ room, onBack, onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
    loadRoomMembers();
  }, [room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      // Try to load from backend first
      const response = await fetch(`${backendUrl}/api/chat-room/${room.id}/messages?user_id=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || getMockMessages());
      } else {
        setMessages(getMockMessages());
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages(getMockMessages());
    }
  };

  const loadRoomMembers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/chat-room/${room.id}/members`);
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || getMockMembers());
      } else {
        setMembers(getMockMembers());
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers(getMockMembers());
    }
  };

  const getMockMessages = () => [
    {
      id: '1',
      user: { name: 'Sarah Johnson', id: 'user1', avatar: null },
      message: 'Welcome everyone! This is a great community for fitness beginners 💪',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'text'
    },
    {
      id: '2',
      user: { name: 'Mike Chen', id: 'user2', avatar: null },
      message: 'Just completed my first body scan! The results are amazing. Thanks for all the motivation!',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      type: 'text'
    },
    {
      id: '3',
      user: { name: 'Alex Rivera', id: 'user3', avatar: null },
      message: 'Does anyone have tips for improving posture? My scan showed forward head posture.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text'
    },
    {
      id: '4',
      user: { name: 'Lisa Wong', id: 'user4', avatar: null },
      message: '@Alex Try chin tucks and wall slides! They helped me a lot. Also check your workspace setup.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      type: 'text'
    }
  ];

  const getMockMembers = () => [
    { id: 'user1', name: 'Sarah Johnson', avatar: null, role: 'admin', online: true },
    { id: 'user2', name: 'Mike Chen', avatar: null, role: 'member', online: true },
    { id: 'user3', name: 'Alex Rivera', avatar: null, role: 'member', online: false },
    { id: 'user4', name: 'Lisa Wong', avatar: null, role: 'member', online: true },
    { id: 'user5', name: 'David Park', avatar: null, role: 'member', online: false }
  ];

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsLoading(true);
    
    try {
      const userId = localStorage.getItem('userId');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const messageData = {
        user_id: userId,
        room_id: room.id,
        message: newMessage,
        type: 'text'
      };
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/chat-room/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, newMessageData]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      // Fallback: Add message locally
      const mockMessage = {
        id: Date.now().toString(),
        user: { 
          name: JSON.parse(localStorage.getItem('user') || '{}').name || 'You',
          id: localStorage.getItem('userId'),
          avatar: null
        },
        message: newMessage,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, mockMessage]);
    }
    
    setNewMessage('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  const getUserInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleViewActivity = () => {
    onNavigate('activity');
  };

  const handleRoomSettings = () => {
    toast({
      title: "Room Settings",
      description: "Room management features coming soon!"
    });
  };

  const handleInviteMembers = () => {
    toast({
      title: "Invite Members",
      description: "Member invitation system coming soon!"
    });
  };

  const currentUserId = localStorage.getItem('userId');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{room.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={14} />
                <span>{members.length} members</span>
                <span>•</span>
                <span>{members.filter(m => m.online).length} online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleViewActivity}>
              <Search size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleInviteMembers}>
              <UserPlus size={16} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRoomSettings}>
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Room Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <p className="text-sm text-blue-700">{room.description}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.user.id === currentUserId;
          
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isCurrentUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {getUserInitials(message.user.name)}
                  </div>
                )}
                
                <div className={`rounded-lg p-3 ${
                  isCurrentUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  {!isCurrentUser && (
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      {message.user.name}
                    </div>
                  )}
                  <p className={`text-sm ${isCurrentUser ? 'text-white' : 'text-gray-700'}`}>
                    {message.message}
                  </p>
                  <div className={`text-xs mt-1 ${
                    isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <div className="animate-pulse text-gray-600 text-xs">•••</div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm text-gray-500">Someone is typing...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 h-12 rounded-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 p-0"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Members Panel (Toggle) */}
      <div className="bg-white border-t border-gray-200">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Active Members</span>
            <Badge variant="secondary" className="text-xs">
              {members.filter(m => m.online).length} online
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-2">
            {members.filter(m => m.online).slice(0, 8).map((member) => (
              <div key={member.id} className="flex flex-col items-center gap-1 min-w-[50px]">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs relative">
                  {getUserInitials(member.name)}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600 truncate max-w-[50px]">
                  {member.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;