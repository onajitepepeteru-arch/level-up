import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Send, Users, Settings, Search, UserPlus, X } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const ChatRoom = ({ room, onBack, onNavigate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsData, setSettingsData] = useState({ name: room?.name || '', description: room?.description || '', type: room?.type || 'public', maxMembers: room?.maxMembers || 50 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
      const response = await fetch(`${backendUrl}/api/chat-room/${room.id}/messages?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      setMessages([]);
    }
  };

  const loadRoomMembers = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/chat-room/${room.id}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        setMembers([]);
      }
    } catch (error) {
      setMembers([]);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const messageData = { user_id: userId, room_id: room.id, message: newMessage, type: 'text' };
      const response = await fetch(`${backendUrl}/api/chat-room/message`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messageData) });
      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, newMessageData]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({ title: 'Message not sent', description: 'Please try again', variant: 'destructive' });
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

  const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const openInvite = () => setInviteOpen(true);
  const closeInvite = () => { setInviteOpen(false); setSearchQuery(''); setSearchResults([]); };
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      setSearchResults([]);
    }
  };

  const handleInvite = async (userId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/chat-room/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_id: room.id, user_id: userId }) });
      if (res.ok) {
        toast({ title: 'Invited', description: 'User added to room' });
        loadRoomMembers();
      }
    } catch (e) {
      toast({ title: 'Invite failed', description: 'Could not invite user', variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const res = await fetch(`${backendUrl}/api/social/chat-room/${room.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsData) });
      if (res.ok) {
        toast({ title: 'Settings updated' });
        closeSettings();
      } else {
        throw new Error('Failed');
      }
    } catch (e) {
      toast({ title: 'Update failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  const renderMessageContent = (message) => {
    if (message.type === 'shared_post' && message.meta?.preview) {
      const p = message.meta.preview;
      return (
        <Card className="p-2 mt-1">
          <div className="text-sm text-gray-800 mb-1">{p.content}</div>
          {p.media && p.media.length > 0 && (
            p.media[0].content_type?.startsWith('video') ? (
              <video src={`${process.env.REACT_APP_BACKEND_URL}/api/media/${p.media[0].id}`} controls className="w-40 rounded" />
            ) : (
              <img src={`${process.env.REACT_APP_BACKEND_URL}/api/media/${p.media[0].id}`} alt="post" className="w-40 h-24 object-cover rounded" />
            )
          )}
        </Card>
      );
    }
    return (
      <p className={`text-sm ${message.user.id === localStorage.getItem('userId') ? 'text-white' : 'text-gray-700'}`}>{message.message}</p>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={20} /></Button>
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
            <Button variant="ghost" size="sm" onClick={() => onNavigate('activity')}><Search size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={openInvite}><UserPlus size={16} /></Button>
            <Button variant="ghost" size="sm" onClick={openSettings}><Settings size={16} /></Button>
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
          const isCurrentUser = message.user.id === localStorage.getItem('userId');
          return (
            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isCurrentUser && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {getUserInitials(message.user.name)}
                  </div>
                )}
                <div className={`rounded-lg p-3 ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200'}`}>
                  {!isCurrentUser && (<div className="text-xs font-semibold text-gray-900 mb-1">{message.user.name}</div>)}
                  {renderMessageContent(message)}
                  <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>{formatTime(message.timestamp)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." className="pr-12 h-12 rounded-full bg-gray-100 border-none focus:bg-white focus:ring-2 focus:ring-blue-500" disabled={isLoading} />
          </div>
          <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isLoading} size="sm" className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 p-0">
            {isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>) : (<Send size={16} />)}
          </Button>
        </div>
      </div>

      {/* Invite Panel */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Invite Members</h3>
              <Button variant="ghost" size="sm" onClick={() => { setInviteOpen(false); }}><X size={16} /></Button>
            </div>
            <div className="flex gap-2 mb-3">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search users by name" />
              <Button onClick={handleSearchUsers}>Search</Button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-sm text-gray-500">No results</div>
              ) : (
                searchResults.map(user => (
                  <Card key={user.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {getUserInitials(user.name)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleInvite(user.id)}>Invite</Button>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Room Settings</h3>
              <Button variant="ghost" size="sm" onClick={closeSettings}><X size={16} /></Button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Name</div>
                <Input value={settingsData.name} onChange={(e) => setSettingsData({ ...settingsData, name: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium">Description</div>
                <Input value={settingsData.description} onChange={(e) => setSettingsData({ ...settingsData, description: e.target.value })} />
              </div>
              <div>
                <div className="text-sm font-medium">Type</div>
                <div className="flex gap-2">
                  <Button type="button" variant={settingsData.type === 'public' ? 'default' : 'outline'} onClick={() => setSettingsData({ ...settingsData, type: 'public' })}>Public</Button>
                  <Button type="button" variant={settingsData.type === 'private' ? 'default' : 'outline'} onClick={() => setSettingsData({ ...settingsData, type: 'private' })}>Private</Button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Max Members</div>
                <Input type="number" min={2} max={250} value={settingsData.maxMembers} onChange={(e) => setSettingsData({ ...settingsData, maxMembers: parseInt(e.target.value || '0', 10) })} />
              </div>
              <div className="flex gap-2 mt-2">
                <Button onClick={handleSaveSettings}>Save</Button>
                <Button variant="outline" onClick={closeSettings}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;