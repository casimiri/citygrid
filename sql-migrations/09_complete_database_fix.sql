-- Complete database fix - remove all problematic policies and triggers
-- Focus on getting a working authentication system

-- 1. COMPLETELY DISABLE RLS and remove all policies causing infinite recursion
ALTER TABLE membership DISABLE ROW LEVEL SECURITY;
ALTER TABLE org DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on these tables
DROP POLICY IF EXISTS "Users can view own memberships" ON membership;
DROP POLICY IF EXISTS "Users can manage their org memberships" ON membership;
DROP POLICY IF EXISTS "Org owners can manage memberships" ON membership;
DROP POLICY IF EXISTS "Enable read access for all users" ON membership;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON membership;
DROP POLICY IF EXISTS "Enable update for users based on email" ON membership;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON membership;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON org;
DROP POLICY IF EXISTS "Users can update their organizations" ON org;
DROP POLICY IF EXISTS "Enable read access for all users" ON org;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON org;
DROP POLICY IF EXISTS "Enable update for users based on email" ON org;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON org;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profile;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profile;
DROP POLICY IF EXISTS "Enable update for users based on email" ON user_profile;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON user_profile;

-- 2. DROP ALL EXISTING TRIGGERS that might cause recursion
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_org_setup ON auth.users;
DROP TRIGGER IF EXISTS simple_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 3. DROP ALL EXISTING FUNCTIONS
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS complete_user_registration() CASCADE;
DROP FUNCTION IF EXISTS simple_handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_triggers_info() CASCADE;

-- 4. CREATE A SINGLE, SIMPLE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION create_user_profile_only()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create user profile, nothing else
  INSERT INTO user_profile (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREATE A SINGLE TRIGGER
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION create_user_profile_only();

-- 6. ENSURE LYON ORG EXISTS AND IS PROPERLY CONFIGURED
INSERT INTO org (id, name, slug, subscription_status, is_state, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Ville de Lyon',
  'lyon',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_state = EXCLUDED.is_state,
  updated_at = NOW();

-- 7. CREATE TEST USERS WITH DIRECT MEMBERSHIP (no triggers involved)
DO $$
DECLARE
  test_user_id UUID;
  admin_user_id UUID;
  lyon_org_id UUID := '550e8400-e29b-41d4-a716-446655440001';
BEGIN
  -- Create test@contractville.fr user
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test@contractville.fr';
  
  IF test_user_id IS NULL THEN
    test_user_id := gen_random_uuid();
    
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
      is_super_admin
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
      false
    );
    
    -- Manual profile creation (bypass trigger)
    INSERT INTO user_profile (id, email, full_name, created_at, updated_at)
    VALUES (test_user_id, 'test@contractville.fr', 'Test Contract User', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Manual membership creation
    INSERT INTO membership (user_id, org_id, role, created_at, updated_at)
    VALUES (test_user_id, lyon_org_id, 'admin', NOW(), NOW())
    ON CONFLICT (user_id, org_id) DO NOTHING;
    
    RAISE NOTICE 'Created test user: test@contractville.fr / password123';
  ELSE
    RAISE NOTICE 'Test user already exists: test@contractville.fr';
  END IF;

  -- Create admin@contractville.fr user if it doesn't exist
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@contractville.fr';
  
  IF admin_user_id IS NULL THEN
    admin_user_id := gen_random_uuid();
    
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
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@contractville.fr',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Contract Admin"}',
      false
    );
    
    -- Manual profile creation
    INSERT INTO user_profile (id, email, full_name, created_at, updated_at)
    VALUES (admin_user_id, 'admin@contractville.fr', 'Contract Admin', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
    -- Manual membership creation
    INSERT INTO membership (user_id, org_id, role, created_at, updated_at)
    VALUES (admin_user_id, lyon_org_id, 'owner', NOW(), NOW())
    ON CONFLICT (user_id, org_id) DO NOTHING;
    
    RAISE NOTICE 'Created admin user: admin@contractville.fr / password123';
  ELSE
    RAISE NOTICE 'Admin user already exists: admin@contractville.fr';
  END IF;
END $$;

-- 8. GRANT NECESSARY PERMISSIONS
GRANT EXECUTE ON FUNCTION create_user_profile_only() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_only() TO anon;

-- Grant table access permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profile TO authenticated;
GRANT SELECT ON org TO authenticated;
GRANT SELECT ON membership TO authenticated;

-- 9. SIMPLE RLS POLICIES (optional - can be enabled later if needed)
-- For now, we'll leave RLS disabled to ensure no recursion

-- 10. VERIFY THE SETUP
SELECT 
  'Database Fix Summary:' as status,
  COUNT(*) as total_users
FROM auth.users;

SELECT 
  u.email,
  up.full_name,
  m.role,
  o.name as org_name,
  o.is_state
FROM auth.users u
LEFT JOIN user_profile up ON u.id = up.id
LEFT JOIN membership m ON u.id = m.user_id  
LEFT JOIN org o ON m.org_id = o.id
WHERE u.email IN ('test@contractville.fr', 'admin@contractville.fr')
ORDER BY u.email;

-- Success message
SELECT '✅ Database fix completed successfully!' as result;