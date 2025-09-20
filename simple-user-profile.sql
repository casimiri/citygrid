-- Very simple user_profile table creation
-- Copy and paste this into your Supabase SQL Editor

DROP TABLE IF EXISTS user_profile CASCADE;

CREATE TABLE user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);