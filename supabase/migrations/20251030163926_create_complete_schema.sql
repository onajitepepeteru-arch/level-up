/*
  # Complete LevelUp Database Schema
  
  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `username` (text, unique)
      - `avatar_url` (text, nullable)
      - `level` (integer, default 1)
      - `xp` (integer, default 0)
      - `streak_days` (integer, default 0)
      - `last_activity_date` (date, nullable)
      - `onboarding_completed` (boolean, default false)
      - `activity_level` (text, nullable)
      - `goals` (jsonb, nullable)
      - `preferences` (jsonb, nullable)
      - `subscription_tier` (text, default 'free')
      - `subscription_active` (boolean, default false)
      - `subscription_ends_at` (timestamptz, nullable)
      - `stripe_customer_id` (text, nullable)
      - `auth_provider` (text, default 'email')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `scanner_results`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `scan_type` (text: 'body', 'face', 'food')
      - `image_url` (text)
      - `analysis_data` (jsonb)
      - `xp_awarded` (integer)
      - `created_at` (timestamptz)
      
    - `community_rooms`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `creator_id` (uuid, references users)
      - `room_type` (text, default 'public')
      - `member_count` (integer, default 0)
      - `created_at` (timestamptz)
      
    - `community_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references community_rooms)
      - `user_id` (uuid, references users)
      - `role` (text, default 'member')
      - `joined_at` (timestamptz)
      
    - `community_messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, references community_rooms)
      - `user_id` (uuid, references users)
      - `message` (text)
      - `message_type` (text, default 'text')
      - `created_at` (timestamptz)
      
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)
      
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `stripe_subscription_id` (text, unique)
      - `status` (text)
      - `plan_id` (text)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  last_activity_date date,
  onboarding_completed boolean DEFAULT false,
  activity_level text,
  goals jsonb,
  preferences jsonb,
  subscription_tier text DEFAULT 'free',
  subscription_active boolean DEFAULT false,
  subscription_ends_at timestamptz,
  stripe_customer_id text,
  auth_provider text DEFAULT 'email',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create scanner_results table
CREATE TABLE IF NOT EXISTS scanner_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_type text NOT NULL CHECK (scan_type IN ('body', 'face', 'food')),
  image_url text NOT NULL,
  analysis_data jsonb NOT NULL,
  xp_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create community_rooms table
CREATE TABLE IF NOT EXISTS community_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_type text DEFAULT 'public',
  member_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create community_members table
CREATE TABLE IF NOT EXISTS community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Create community_messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES community_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL,
  plan_id text NOT NULL,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view other profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Scanner results policies
CREATE POLICY "Users can view own scan results"
  ON scanner_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan results"
  ON scanner_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Community rooms policies
CREATE POLICY "Anyone can view public rooms"
  ON community_rooms FOR SELECT
  TO authenticated
  USING (room_type = 'public');

CREATE POLICY "Users can create rooms"
  ON community_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their rooms"
  ON community_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Community members policies
CREATE POLICY "Members can view their memberships"
  ON community_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join rooms"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON community_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Community messages policies
CREATE POLICY "Room members can view messages"
  ON community_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.room_id = community_messages.room_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Room members can send messages"
  ON community_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.room_id = community_messages.room_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scanner_results_user_id ON scanner_results(user_id);
CREATE INDEX IF NOT EXISTS idx_scanner_results_created_at ON scanner_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_room_id ON community_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_room_id ON community_members(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for subscriptions table
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();