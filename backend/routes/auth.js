import express from 'express';
import Joi from 'joi';
import supabase from '../lib/supabase.js';

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

router.post('/register', async (req, res) => {
  try {
    const { error: validationError } = registerSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password, name } = req.body;

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          display_name: name
        }
      }
    });

    if (signUpError) {
      return res.status(400).json({ error: signUpError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const username = name.trim().split(' ')[0].toLowerCase() + Math.floor(Math.random() * 1000);

    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        username,
        level: 1,
        xp: 0,
        streak_days: 0,
        onboarding_completed: false,
        subscription_tier: 'free',
        subscription_active: false,
        auth_provider: 'email'
      })
      .select()
      .single();

    if (insertError) {
      console.error('User insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create user profile' });
    }

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        username: userData.username,
        level: userData.level,
        xp: userData.xp,
        onboarding_completed: userData.onboarding_completed
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { error: validationError } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        username: userData.username,
        level: userData.level,
        xp: userData.xp,
        onboarding_completed: userData.onboarding_completed,
        goals: userData.goals,
        activity_level: userData.activity_level
      },
      session: data.session,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Google ID token required' });
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!existingUser) {
      const username = data.user.email.split('@')[0] + Math.floor(Math.random() * 1000);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata.full_name || data.user.email,
          username,
          level: 1,
          xp: 0,
          streak_days: 0,
          onboarding_completed: false,
          subscription_tier: 'free',
          subscription_active: false,
          auth_provider: 'google',
          avatar_url: data.user.user_metadata.avatar_url
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      return res.json({
        message: 'Google sign-in successful',
        user: newUser,
        session: data.session,
        token: data.session.access_token
      });
    }

    res.json({
      message: 'Google sign-in successful',
      user: existingUser,
      session: data.session,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

router.post('/apple', async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Apple ID token required' });
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: id_token
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!existingUser) {
      const username = (data.user.email?.split('@')[0] || 'appleuser') + Math.floor(Math.random() * 1000);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata.full_name || data.user.email || 'Apple User',
          username,
          level: 1,
          xp: 0,
          streak_days: 0,
          onboarding_completed: false,
          subscription_tier: 'free',
          subscription_active: false,
          auth_provider: 'apple'
        })
        .select()
        .single();

      if (insertError) {
        return res.status(500).json({ error: 'Failed to create user profile' });
      }

      return res.json({
        message: 'Apple sign-in successful',
        user: newUser,
        session: data.session,
        token: data.session.access_token
      });
    }

    res.json({
      message: 'Apple sign-in successful',
      user: existingUser,
      session: data.session,
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ error: 'Apple authentication failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { error: validationError } = resetPasswordSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { email } = req.body;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { password, access_token } = req.body;

    if (!password || !access_token) {
      return res.status(400).json({ error: 'Password and access token are required' });
    }

    const { data, error } = await supabase.auth.updateUser(
      { password },
      { accessToken: access_token }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Password updated successfully',
      user: data.user
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
