-- Find and disable ALL triggers that might be blocking user creation
-- Copy and paste this into your Supabase SQL Editor

-- First, let's find ALL triggers on auth.users table
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- Also check for triggers on user_profile table
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'user_profile' AND event_object_schema = 'public';

-- List all functions that might be related to user creation
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%user%' OR
    routine_name LIKE '%profile%' OR
    routine_name LIKE '%auth%'
  );

-- Check for any RLS policies on auth schema (this requires special privileges)
-- This might not work but let's try
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'auth';