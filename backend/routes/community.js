import express from 'express';
import supabase from '../lib/supabase.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

router.get('/rooms', authenticateUser, async (req, res) => {
  try {
    const { data: rooms, error } = await supabase
      .from('community_rooms')
      .select(`
        *,
        creator:users!creator_id(id, name, username, level)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ rooms });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

router.post('/rooms', authenticateUser, async (req, res) => {
  try {
    const { name, description, room_type } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const { data: room, error: roomError } = await supabase
      .from('community_rooms')
      .insert({
        name,
        description: description || '',
        creator_id: userId,
        room_type: room_type || 'public',
        member_count: 1
      })
      .select()
      .single();

    if (roomError) throw roomError;

    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        room_id: room.id,
        user_id: userId,
        role: 'admin'
      });

    if (memberError) throw memberError;

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.get('/rooms/:roomId', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: room, error } = await supabase
      .from('community_rooms')
      .select(`
        *,
        creator:users!creator_id(id, name, username, level, avatar_url)
      `)
      .eq('id', roomId)
      .single();

    if (error) throw error;

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Fetch room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.post('/rooms/:roomId/join', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const { data: existing } = await supabase
      .from('community_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        role: 'member'
      });

    if (memberError) throw memberError;

    const { data: room } = await supabase
      .from('community_rooms')
      .select('member_count')
      .eq('id', roomId)
      .single();

    await supabase
      .from('community_rooms')
      .update({ member_count: (room.member_count || 0) + 1 })
      .eq('id', roomId);

    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

router.post('/rooms/:roomId/leave', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const { error: deleteError } = await supabase
      .from('community_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    const { data: room } = await supabase
      .from('community_rooms')
      .select('member_count')
      .eq('id', roomId)
      .single();

    await supabase
      .from('community_rooms')
      .update({ member_count: Math.max((room.member_count || 1) - 1, 0) })
      .eq('id', roomId);

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

router.get('/rooms/:roomId/messages', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const { data: messages, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        user:users!user_id(id, name, username, level, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/rooms/:roomId/messages', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { message, message_type } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const { data: newMessage, error: insertError } = await supabase
      .from('community_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        message,
        message_type: message_type || 'text'
      })
      .select(`
        *,
        user:users!user_id(id, name, username, level, avatar_url)
      `)
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/rooms/:roomId/members', authenticateUser, async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: members, error } = await supabase
      .from('community_members')
      .select(`
        *,
        user:users!user_id(id, name, username, level, avatar_url)
      `)
      .eq('room_id', roomId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    res.json({ members });
  } catch (error) {
    console.error('Fetch members error:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.get('/my-rooms', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: memberships, error } = await supabase
      .from('community_members')
      .select(`
        room_id,
        role,
        joined_at,
        room:community_rooms(*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    res.json({ rooms: memberships });
  } catch (error) {
    console.error('Fetch my rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch your rooms' });
  }
});

export default router;
