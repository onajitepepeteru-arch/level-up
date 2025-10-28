/*
  # Create Social Tables

  1. New Tables
    - `posts`
      - `id` (uuid, primary key) - Post unique identifier
      - `user_id` (uuid, foreign key) - User who created the post
      - `content` (text) - Post content
      - `type` (text) - Post type (general, achievement, scan)
      - `likes` (integer) - Number of likes
      - `likes_by` (jsonb) - Array of user IDs who liked
      - `comments` (jsonb) - Array of comment objects
      - `share_count` (integer) - Number of shares
      - `media` (jsonb) - Array of media objects
      - `xp_earned` (integer, nullable) - XP earned if achievement post
      - `timestamp` (timestamptz) - When post was created

    - `chat_rooms`
      - `id` (uuid, primary key) - Room unique identifier
      - `name` (text) - Room name
      - `description` (text) - Room description
      - `category` (text) - Room category
      - `type` (text) - Room type (public, private)
      - `max_members` (integer) - Maximum number of members
      - `creator_id` (uuid, foreign key) - User who created the room
      - `members` (jsonb) - Array of member user IDs
      - `last_message` (text) - Last message text
      - `last_activity` (timestamptz) - Last activity timestamp
      - `created_at` (timestamptz) - Room creation timestamp

    - `chat_messages`
      - `id` (uuid, primary key) - Message unique identifier
      - `room_id` (uuid, foreign key) - Chat room ID
      - `user_id` (uuid, foreign key) - User who sent the message
      - `message` (text) - Message content
      - `type` (text) - Message type (text, image, shared_post)
      - `meta` (jsonb) - Additional metadata
      - `timestamp` (timestamptz) - When message was sent

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read/write their data
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text DEFAULT 'general',
  likes integer DEFAULT 0,
  likes_by jsonb DEFAULT '[]'::jsonb,
  comments jsonb DEFAULT '[]'::jsonb,
  share_count integer DEFAULT 0,
  media jsonb DEFAULT '[]'::jsonb,
  xp_earned integer,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_timestamp_idx ON posts(timestamp DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'general',
  type text DEFAULT 'public',
  max_members integer DEFAULT 50,
  creator_id uuid REFERENCES users(id) ON DELETE SET NULL,
  members jsonb DEFAULT '[]'::jsonb,
  last_message text DEFAULT '',
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_rooms_last_activity_idx ON chat_rooms(last_activity DESC);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read public rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (type = 'public' OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(members)));

CREATE POLICY "Authenticated users can create rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creators can update rooms"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL,
  type text DEFAULT 'text',
  meta jsonb,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_timestamp_idx ON chat_messages(timestamp);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can read messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
      AND (chat_rooms.type = 'public' OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(members)))
    )
  );

CREATE POLICY "Room members can insert messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
      AND (chat_rooms.type = 'public' OR auth.uid()::text = ANY(SELECT jsonb_array_elements_text(members)))
    )
  );