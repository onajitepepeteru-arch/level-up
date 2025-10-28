/*
  # Create Scans Table

  1. New Tables
    - `scans`
      - `id` (uuid, primary key) - Scan unique identifier
      - `user_id` (uuid, foreign key) - User who performed the scan
      - `scan_type` (text) - Type of scan (body, face, food)
      - `image_url` (text, nullable) - URL of scanned image
      - `analysis_result` (jsonb) - AI analysis results
      - `xp_earned` (integer) - XP earned from this scan
      - `timestamp` (timestamptz) - When scan was performed

  2. Security
    - Enable RLS on `scans` table
    - Add policy for authenticated users to read their own scans
    - Add policy for authenticated users to insert their own scans
*/

CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_type text NOT NULL,
  image_url text,
  analysis_result jsonb DEFAULT '{}'::jsonb,
  xp_earned integer DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans(user_id);
CREATE INDEX IF NOT EXISTS scans_scan_type_idx ON scans(scan_type);
CREATE INDEX IF NOT EXISTS scans_timestamp_idx ON scans(timestamp DESC);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans"
  ON scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);