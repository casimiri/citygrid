-- Disable the create_user_profile_trigger that's causing registration failures
-- Copy and paste this into your Supabase SQL Editor

-- First, let's see if the trigger exists
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'create_user_profile_trigger';

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Also drop the function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify the trigger is gone
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'create_user_profile_trigger';