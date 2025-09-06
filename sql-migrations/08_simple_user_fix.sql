-- Simple fix for user registration - remove problematic triggers
-- and create a basic working system

-- 1. Remove ALL problematic triggers causing infinite recursion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_org_setup ON auth.users;
DROP TRIGGER IF EXISTS simple_on_auth_user_created ON auth.users;

-- 2. Create a simple trigger that only handles user profile creation
CREATE OR REPLACE FUNCTION simple_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create simple trigger (after dropping existing one above)
CREATE TRIGGER simple_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION simple_handle_new_user();

-- 4. Create a test user directly (bypass registration form issues)
DO $$
DECLARE
  test_user_id UUID;
  lyon_org_id UUID := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  -- Check if test user already exists
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@contractville.fr';
  
  -- Only create if doesn't exist
  IF test_user_id IS NULL THEN
    -- Generate new UUID for test user
    test_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      test_user_id,
      'authenticated',
      'authenticated',
      'test@contractville.fr',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Test Contract User"}',
      false,
      NOW()
    );
    
    -- The trigger will create the user_profile automatically
    
    -- Create membership manually
    INSERT INTO membership (user_id, org_id, role) 
    VALUES (test_user_id, lyon_org_id, 'admin')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Test user created: test@contractville.fr / password123';
  ELSE
    RAISE NOTICE 'Test user already exists: test@contractville.fr';
  END IF;
END $$;

-- 5. Ensure the Lyon organization is marked as government entity for contracts
UPDATE org SET is_state = true WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION simple_handle_new_user() TO authenticated;

-- 7. Verify setup
SELECT 
  u.email,
  up.full_name,
  m.role,
  o.name as org_name,
  o.is_state
FROM auth.users u
JOIN user_profile up ON u.id = up.id
JOIN membership m ON u.id = m.user_id  
JOIN org o ON m.org_id = o.id
WHERE u.email = 'test@contractville.fr';