-- Simple script to create the missing user_profile table
-- Copy and paste this into your Supabase SQL Editor

-- Create the user_profile table
CREATE TABLE user_profile (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (required for Supabase)
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own profile" ON user_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = id);