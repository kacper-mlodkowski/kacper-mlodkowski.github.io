-- Create user table if it doesn't exist
-- Note: The auth.users table is automatically created by Supabase Auth for registered users
-- The id column references auth.users.id (UUID)
CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists with BIGSERIAL id, migrate it to use UUID
DO $$ 
BEGIN
  -- Check if id column is BIGSERIAL (integer type) and needs migration
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user' 
    AND column_name = 'id' 
    AND data_type IN ('bigint', 'integer')
  ) THEN
    -- Add new id column as UUID (temporary name)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'id_uuid'
    ) THEN
      ALTER TABLE "user" ADD COLUMN id_uuid UUID REFERENCES auth.users(id) ON DELETE CASCADE;
      -- Drop old primary key constraint
      ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_pkey;
      -- Drop old id column
      ALTER TABLE "user" DROP COLUMN id;
      -- Rename new column to id
      ALTER TABLE "user" RENAME COLUMN id_uuid TO id;
      -- Add primary key constraint
      ALTER TABLE "user" ADD PRIMARY KEY (id);
    END IF;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON "user";
DROP POLICY IF EXISTS "Allow users to insert own record" ON "user";
DROP POLICY IF EXISTS "Allow public read access" ON "user";

-- Create a function to insert user profile (runs with SECURITY DEFINER to bypass RLS)
-- This allows the insert even if the user doesn't have an active session yet
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify that the user_id exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;
  
  INSERT INTO "user" (id, first_name, last_name, date_of_birth)
  VALUES (user_id, first_name, last_name, date_of_birth)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, DATE) TO anon;

-- Allow authenticated users to insert their own record (id must match auth.uid())
CREATE POLICY "Allow users to insert own record"
ON "user"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow public read (optional - change if you want)
CREATE POLICY "Allow public read access"
ON "user"
FOR SELECT
TO public
USING (true);

-- Create movie table if it doesn't exist
CREATE TABLE IF NOT EXISTS movie (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  imdb_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing movie table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'movie' AND column_name = 'imdb_url') THEN
    ALTER TABLE movie ADD COLUMN imdb_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'movie' AND column_name = 'image_url') THEN
    ALTER TABLE movie ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'movie' AND column_name = 'user_id') THEN
    ALTER TABLE movie ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on movie table
ALTER TABLE movie ENABLE ROW LEVEL SECURITY;

-- Create admin_users table to track which users have admin privileges
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON movie;
DROP POLICY IF EXISTS "Allow users to delete own movies" ON movie;
DROP POLICY IF EXISTS "Allow admins to delete any movie" ON movie;
DROP POLICY IF EXISTS "Allow public read access" ON movie;
DROP POLICY IF EXISTS "Allow public read admin_users" ON admin_users;

-- Allow authenticated users to insert (user_id will be set automatically via trigger or application)
CREATE POLICY "Allow authenticated users to insert"
ON movie
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to delete their own movies
CREATE POLICY "Allow users to delete own movies"
ON movie
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to delete any movie
CREATE POLICY "Allow admins to delete any movie"
ON movie
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Allow public read
CREATE POLICY "Allow public read access"
ON movie
FOR SELECT
TO public
USING (true);

-- Allow public to read admin_users (to check if user is admin)
CREATE POLICY "Allow public read admin_users"
ON admin_users
FOR SELECT
TO public
USING (true);

