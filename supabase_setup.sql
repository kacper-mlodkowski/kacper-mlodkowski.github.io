-- Create user table if it doesn't exist
-- Note: The auth.users table is automatically created by Supabase Auth for registered users
CREATE TABLE IF NOT EXISTS "user" (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON "user";
DROP POLICY IF EXISTS "Allow public read access" ON "user";

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert"
ON "user"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow public read (optional - change if you want)
CREATE POLICY "Allow public read access"
ON "user"
FOR SELECT
TO public
USING (true);

