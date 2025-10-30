import express from 'express';
import supabase from '../lib/supabase.js';
import authenticateUser from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const allowedFields = [
      'name',
      'username',
      'avatar_url',
      'activity_level',
      'goals',
      'preferences',
      'onboarding_completed'
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(filteredUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/leaderboard', authenticateUser, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, username, level, xp, streak_days, avatar_url')
      .order('xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ leaderboard: users });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: scans, error: scansError } = await supabase
      .from('scanner_results')
      .select('scan_type, xp_awarded, created_at')
      .eq('user_id', userId);

    if (scansError) throw scansError;

    const today = new Date().toISOString().split('T')[0];
    const todayScans = scans.filter(s => s.created_at.startsWith(today));

    const stats = {
      level: user.level,
      xp: user.xp,
      streak_days: user.streak_days,
      total_scans: scans.length,
      today_scans: todayScans.length,
      xp_to_next_level: (user.level * 100) - user.xp,
      subscription_tier: user.subscription_tier,
      subscription_active: user.subscription_active
    };

    res.json(stats);
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, level, xp, streak_days, avatar_url, created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
