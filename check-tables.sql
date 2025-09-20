-- Check what tables exist in the database
-- Copy and paste this into your Supabase SQL Editor

-- List all tables in the public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if user_profile table exists specifically
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_profile'
) as user_profile_exists;