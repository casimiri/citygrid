-- Fix infinite recursion in membership RLS policy
-- Copy and paste this into your Supabase SQL Editor

-- First, let's see what policies exist on membership table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'membership';

-- Drop problematic policies that might cause recursion
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON org;
DROP POLICY IF EXISTS "Users can view their memberships" ON membership;
DROP POLICY IF EXISTS "Service role can insert memberships" ON membership;

-- Create simpler, non-recursive policies

-- Allow users to view their own memberships
CREATE POLICY "Users can view own memberships" ON membership
  FOR SELECT USING (user_id = auth.uid());

-- Allow service role to insert memberships (for registration)
CREATE POLICY "Service role can insert" ON membership
  FOR INSERT WITH CHECK (true);

-- Allow users to view organizations they belong to (simpler version)
CREATE POLICY "Users can view member orgs" ON org
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membership m
      WHERE m.org_id = org.id
      AND m.user_id = auth.uid()
    )
  );

-- Allow service role to insert organizations (for registration)
CREATE POLICY "Service role can insert orgs" ON org
  FOR INSERT WITH CHECK (true);