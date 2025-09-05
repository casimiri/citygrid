-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Organizations table
CREATE TABLE org (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_status subscription_status DEFAULT 'trialing',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE user_profile (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Organization membership
CREATE TABLE membership (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Equipment categories
CREATE TABLE equipment_category (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment types
CREATE TABLE equipment_type (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  category_id UUID REFERENCES equipment_category(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thresholds for conformity
CREATE TABLE threshold (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_type(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  min_population INTEGER,
  max_distance_meters INTEGER,
  min_area_sqm DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Area requirements
CREATE TABLE area_requirement (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_type(id) ON DELETE CASCADE,
  zone_type VARCHAR(100) NOT NULL,
  requirement_per_1000_inhabitants DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE project (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  location GEOMETRY(Point, 4326),
  address TEXT,
  population INTEGER,
  area_sqm DECIMAL,
  created_by UUID REFERENCES user_profile(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment instances in projects
CREATE TABLE equipment_instance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  project_id UUID REFERENCES project(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_type(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location GEOMETRY(Point, 4326),
  address TEXT,
  quantity INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attachments (files, documents)
CREATE TABLE attachment (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  project_id UUID REFERENCES project(id) ON DELETE CASCADE,
  equipment_instance_id UUID REFERENCES equipment_instance(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES user_profile(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for tracking changes
CREATE TABLE audit_log (
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

-- Create indexes for better performance
CREATE INDEX idx_membership_user_org ON membership(user_id, org_id);
CREATE INDEX idx_equipment_category_org ON equipment_category(org_id);
CREATE INDEX idx_equipment_type_org ON equipment_type(org_id);
CREATE INDEX idx_equipment_type_category ON equipment_type(category_id);
CREATE INDEX idx_threshold_org ON threshold(org_id);
CREATE INDEX idx_threshold_equipment_type ON threshold(equipment_type_id);
CREATE INDEX idx_area_requirement_org ON area_requirement(org_id);
CREATE INDEX idx_project_org ON project(org_id);
CREATE INDEX idx_project_location ON project USING GIST(location);
CREATE INDEX idx_equipment_instance_org ON equipment_instance(org_id);
CREATE INDEX idx_equipment_instance_project ON equipment_instance(project_id);
CREATE INDEX idx_equipment_instance_location ON equipment_instance USING GIST(location);
CREATE INDEX idx_attachment_org ON attachment(org_id);
CREATE INDEX idx_attachment_project ON attachment(project_id);
CREATE INDEX idx_audit_log_org ON audit_log(org_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_org_updated_at BEFORE UPDATE ON org FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_category_updated_at BEFORE UPDATE ON equipment_category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_type_updated_at BEFORE UPDATE ON equipment_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_threshold_updated_at BEFORE UPDATE ON threshold FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_area_requirement_updated_at BEFORE UPDATE ON area_requirement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON project FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_instance_updated_at BEFORE UPDATE ON equipment_instance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();