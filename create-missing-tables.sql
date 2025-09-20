-- Create all missing tables for registration
-- Copy and paste this into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');
    END IF;
END $$;

-- Create org table
CREATE TABLE IF NOT EXISTS org (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create membership table
CREATE TABLE IF NOT EXISTS membership (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Enable RLS on all tables
ALTER TABLE org ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'org' AND policyname = 'Users can view organizations they are members of'
    ) THEN
        CREATE POLICY "Users can view organizations they are members of" ON org
          FOR SELECT USING (
            id IN (
              SELECT org_id FROM membership
              WHERE user_id = auth.uid()
            )
          );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'org' AND policyname = 'Service role can insert organizations'
    ) THEN
        CREATE POLICY "Service role can insert organizations" ON org
          FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- RLS Policies for membership table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'membership' AND policyname = 'Users can view their memberships'
    ) THEN
        CREATE POLICY "Users can view their memberships" ON membership
          FOR SELECT USING (user_id = auth.uid());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'membership' AND policyname = 'Service role can insert memberships'
    ) THEN
        CREATE POLICY "Service role can insert memberships" ON membership
          FOR INSERT WITH CHECK (true);
    END IF;
END $$;