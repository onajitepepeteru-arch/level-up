/*
  # Create Notifications and Reminders Tables

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key) - Notification unique identifier
      - `user_id` (uuid, foreign key) - User who receives the notification
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `read` (boolean) - Whether notification has been read
      - `type` (text) - Notification type (system, social, achievement)
      - `timestamp` (timestamptz) - When notification was created

    - `reminders`
      - `id` (uuid, primary key) - Reminder unique identifier
      - `user_id` (uuid, foreign key) - User who set the reminder
      - `title` (text) - Reminder title
      - `description` (text) - Reminder description
      - `reminder_type` (text) - Type (workout, skincare, meal)
      - `time` (time) - Reminder time
      - `days` (jsonb) - Days of week (array of day names)
      - `active` (boolean) - Whether reminder is active
      - `created_at` (timestamptz) - When reminder was created

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own notifications and reminders
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  type text DEFAULT 'system',
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_timestamp_idx ON notifications(timestamp DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  reminder_type text NOT NULL,
  time time NOT NULL,
  days jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);