-- Essential tables for user registration
-- Run this in Supabase SQL Editor

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

-- Organizations table
CREATE TABLE IF NOT EXISTS org (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profile (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization membership
CREATE TABLE IF NOT EXISTS membership (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profile(id),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_membership_user_org ON membership(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_org_updated_at'
    ) THEN
        CREATE TRIGGER update_org_updated_at
        BEFORE UPDATE ON org
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_user_profile_updated_at'
    ) THEN
        CREATE TRIGGER update_user_profile_updated_at
        BEFORE UPDATE ON user_profile
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE org ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org table
CREATE POLICY "Users can view organizations they are members of" ON org
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM membership
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organizations they are admins of" ON org
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM membership
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for user_profile table
CREATE POLICY "Users can view their own profile" ON user_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for membership table
CREATE POLICY "Users can view memberships for organizations they belong to" ON membership
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM membership
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage memberships" ON membership
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM membership
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for audit_log table
CREATE POLICY "Users can view audit logs for their organizations" ON audit_log
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM membership
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow service role to insert audit logs" ON audit_log
  FOR INSERT WITH CHECK (true);