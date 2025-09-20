-- Temporarily disable RLS to fix registration issues
-- Copy and paste this into your Supabase SQL Editor

-- Disable RLS on org and membership tables temporarily
ALTER TABLE org DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view member orgs" ON org;
DROP POLICY IF EXISTS "Service role can insert orgs" ON org;
DROP POLICY IF EXISTS "Users can view own memberships" ON membership;
DROP POLICY IF EXISTS "Service role can insert" ON membership;

-- Show current status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('org', 'membership');