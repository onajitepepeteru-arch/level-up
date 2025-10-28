/*
  # Create Users Table

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - User unique identifier
      - `email` (text, unique) - User email address
      - `password_hash` (text) - Hashed password for authentication
      - `name` (text) - User full name
      - `username` (text, unique) - Unique username
      - `avatar_url` (text, nullable) - Profile picture URL
      - `level` (integer) - Current gamification level
      - `xp` (integer) - Experience points
      - `streak_days` (integer) - Consecutive activity days
      - `goals` (jsonb) - User fitness/health goals
      - `activity_level` (text) - Activity level (sedentary, moderate, active)
      - `onboarding_completed` (boolean) - Whether onboarding is complete
      - `subscription_tier` (text) - Subscription tier (free, basic, pro, premium)
      - `subscription_active` (boolean) - Whether subscription is active
      - `created_at` (timestamptz) - Account creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for authenticated users to update their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  streak_days integer DEFAULT 0,
  goals jsonb DEFAULT '[]'::jsonb,
  activity_level text DEFAULT 'moderate',
  onboarding_completed boolean DEFAULT false,
  subscription_tier text DEFAULT 'free',
  subscription_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can insert during registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);