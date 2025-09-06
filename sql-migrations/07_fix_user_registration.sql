-- Fix user registration by creating a comprehensive function
-- This handles organization creation and membership setup

-- Function to handle complete user registration with organization
CREATE OR REPLACE FUNCTION complete_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  org_data JSONB;
  new_org_id UUID;
  org_slug TEXT;
BEGIN
  -- Get organization data from user metadata
  org_data := NEW.raw_user_meta_data;
  
  -- Only proceed if we have org_name in metadata
  IF org_data ? 'org_name' AND org_data->>'org_name' != '' THEN
    
    -- Generate a unique slug from org name
    org_slug := lower(regexp_replace(org_data->>'org_name', '[^a-zA-Z0-9]', '-', 'g'));
    
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM org WHERE slug = org_slug) LOOP
      org_slug := org_slug || '-' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Create the organization
    INSERT INTO org (name, slug, subscription_status, is_state)
    VALUES (
      org_data->>'org_name',
      org_slug,
      'trialing',
      true  -- Set as government entity for B2G contracts
    )
    RETURNING id INTO new_org_id;
    
    -- Create membership for the user as owner
    INSERT INTO membership (user_id, org_id, role)
    VALUES (NEW.id, new_org_id, 'owner');
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger that handles both profile and organization creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- Create second trigger for organization setup
CREATE TRIGGER on_auth_user_org_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION complete_user_registration();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_user_registration() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;