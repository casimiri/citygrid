-- Function to check project conformity
CREATE OR REPLACE FUNCTION check_project_conformity(
  org_id UUID,
  project_data JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::JSONB;
  equipment_types RECORD;
  required_count INTEGER;
  current_count INTEGER;
  conformity_check JSONB;
BEGIN
  -- Initialize result
  result := jsonb_build_object('conformity_checks', '[]'::JSONB, 'is_compliant', true);
  
  -- Loop through each equipment type in the organization
  FOR equipment_types IN 
    SELECT et.id, et.name, et.category_id, ec.name as category_name
    FROM equipment_type et
    JOIN equipment_category ec ON et.category_id = ec.id
    WHERE et.org_id = check_project_conformity.org_id
  LOOP
    -- Calculate required count based on thresholds and area requirements
    SELECT COALESCE(ar.requirement_per_1000_inhabitants * (project_data->>'population')::INTEGER / 1000, 0)::INTEGER
    INTO required_count
    FROM area_requirement ar
    WHERE ar.org_id = check_project_conformity.org_id 
      AND ar.equipment_type_id = equipment_types.id
    LIMIT 1;
    
    -- Get current count from project data
    SELECT COALESCE(COUNT(*), 0)::INTEGER
    INTO current_count
    FROM jsonb_array_elements(project_data->'equipment_instances') ei
    WHERE (ei->>'equipment_type_id')::UUID = equipment_types.id;
    
    -- Build conformity check object
    conformity_check := jsonb_build_object(
      'equipment_type_id', equipment_types.id,
      'equipment_type_name', equipment_types.name,
      'category_name', equipment_types.category_name,
      'required', COALESCE(required_count, 0),
      'current', current_count,
      'is_compliant', current_count >= COALESCE(required_count, 0),
      'deficit', GREATEST(COALESCE(required_count, 0) - current_count, 0)
    );
    
    -- Add to results
    result := jsonb_set(
      result, 
      '{conformity_checks}', 
      (result->'conformity_checks') || conformity_check
    );
    
    -- Update overall compliance
    IF current_count < COALESCE(required_count, 0) THEN
      result := jsonb_set(result, '{is_compliant}', 'false'::JSONB);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coverage analytics
CREATE OR REPLACE FUNCTION get_coverage_analytics(
  org_id UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  coverage_data JSONB := '[]'::JSONB;
  equipment_type RECORD;
  total_required INTEGER;
  total_current INTEGER;
  coverage_item JSONB;
BEGIN
  -- Loop through each equipment type
  FOR equipment_type IN 
    SELECT et.id, et.name, ec.name as category_name, ec.color
    FROM equipment_type et
    JOIN equipment_category ec ON et.category_id = ec.id
    WHERE et.org_id = get_coverage_analytics.org_id
  LOOP
    -- Calculate total required across all projects
    SELECT COALESCE(SUM(
      ar.requirement_per_1000_inhabitants * p.population / 1000
    ), 0)::INTEGER
    INTO total_required
    FROM project p
    LEFT JOIN area_requirement ar ON ar.equipment_type_id = equipment_type.id
    WHERE p.org_id = get_coverage_analytics.org_id;
    
    -- Calculate total current equipment instances
    SELECT COALESCE(COUNT(*), 0)::INTEGER
    INTO total_current
    FROM equipment_instance ei
    WHERE ei.org_id = get_coverage_analytics.org_id
      AND ei.equipment_type_id = equipment_type.id;
    
    -- Build coverage item
    coverage_item := jsonb_build_object(
      'equipment_type_id', equipment_type.id,
      'equipment_type_name', equipment_type.name,
      'category_name', equipment_type.category_name,
      'category_color', equipment_type.color,
      'required', total_required,
      'current', total_current,
      'coverage_percentage', CASE 
        WHEN total_required > 0 THEN ROUND(total_current::DECIMAL / total_required * 100, 1)
        ELSE 0
      END,
      'deficit', GREATEST(total_required - total_current, 0)
    );
    
    coverage_data := coverage_data || coverage_item;
  END LOOP;
  
  result := jsonb_build_object('coverage_data', coverage_data);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  org_id UUID,
  user_id UUID,
  action TEXT,
  entity TEXT,
  entity_id UUID DEFAULT NULL,
  before_data JSONB DEFAULT NULL,
  after_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_log (org_id, user_id, action, entity, entity_id, before, after)
  VALUES (org_id, user_id, action, entity, entity_id, before_data, after_data)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profile (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_org_statistics(
  org_id UUID
) RETURNS JSONB AS $$
DECLARE
  stats JSONB;
  total_projects INTEGER;
  total_equipment INTEGER;
  active_memberships INTEGER;
BEGIN
  -- Count projects
  SELECT COUNT(*) INTO total_projects
  FROM project WHERE org_id = get_org_statistics.org_id;
  
  -- Count equipment instances
  SELECT COUNT(*) INTO total_equipment
  FROM equipment_instance WHERE org_id = get_org_statistics.org_id;
  
  -- Count active memberships
  SELECT COUNT(*) INTO active_memberships
  FROM membership WHERE org_id = get_org_statistics.org_id;
  
  stats := jsonb_build_object(
    'total_projects', total_projects,
    'total_equipment', total_equipment,
    'active_memberships', active_memberships,
    'updated_at', NOW()
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;