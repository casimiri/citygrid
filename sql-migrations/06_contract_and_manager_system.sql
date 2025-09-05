-- Migration for B2G Contract Management and Manager Assignment System
-- This builds on the existing B2G administrative structure

-- Contract statuses
CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'active', 'suspended', 'expired', 'terminated');

-- Contract types 
CREATE TYPE contract_type AS ENUM ('municipal', 'departmental', 'regional', 'national', 'custom');

-- Government contracts table
CREATE TABLE government_contract (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Contract identification
  contract_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  contract_type contract_type NOT NULL,
  
  -- Government entity (the org must be a state: is_state = true)
  government_org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  
  -- Contract details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Administrative scope (which administrative nodes this contract covers)
  scope_description TEXT,
  covers_full_territory BOOLEAN DEFAULT false,
  
  -- Status and lifecycle
  status contract_status DEFAULT 'draft',
  signed_date DATE,
  approved_by VARCHAR(255), -- Government official who approved
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Legal and administrative
  legal_framework TEXT, -- Reference to laws, regulations
  contract_terms TEXT, -- Specific terms and conditions
  renewal_terms TEXT, -- How contract can be renewed
  termination_conditions TEXT,
  
  -- Contact information
  government_contact_name VARCHAR(255),
  government_contact_email VARCHAR(255),
  government_contact_phone VARCHAR(50),
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional contract-specific data
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Contract administrative scope - which specific administrative nodes are covered
CREATE TABLE contract_administrative_scope (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES government_contract(id) ON DELETE CASCADE,
  administrative_node_id UUID REFERENCES administrative_node(id) ON DELETE CASCADE,
  includes_subtree BOOLEAN DEFAULT true, -- If true, includes all child nodes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, administrative_node_id)
);

-- Manager assignments for contracts
CREATE TABLE contract_manager (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES government_contract(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  
  -- Manager details
  role VARCHAR(100) DEFAULT 'contract_manager', -- 'contract_manager', 'technical_manager', 'regional_manager'
  is_primary BOOLEAN DEFAULT false, -- Primary manager for the contract
  
  -- Scope of management
  administrative_scope_node_id UUID REFERENCES administrative_node(id), -- Optional: specific node they manage
  manages_full_contract BOOLEAN DEFAULT true, -- If false, they only manage specific nodes
  
  -- Manager permissions and responsibilities
  can_create_admin_tree BOOLEAN DEFAULT true,
  can_assign_users BOOLEAN DEFAULT true,
  can_manage_projects BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT true,
  can_export_data BOOLEAN DEFAULT true,
  
  -- Assignment details  
  appointed_by UUID REFERENCES user_profile(id), -- Who appointed this manager
  appointment_date DATE DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE, -- Optional: if manager role has expiration
  
  -- Status
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(contract_id, user_id, administrative_scope_node_id), -- User can only be manager once per contract per scope
  CONSTRAINT valid_manager_dates CHECK (end_date IS NULL OR end_date > start_date)
);

-- Contract amendments and modifications
CREATE TABLE contract_amendment (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES government_contract(id) ON DELETE CASCADE,
  amendment_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Amendment details
  effective_date DATE NOT NULL,
  budget_change DECIMAL(15,2), -- Positive or negative amount
  scope_changes TEXT,
  
  -- Approval
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contract_id, amendment_number)
);

-- Contract deliverables and milestones
CREATE TABLE contract_deliverable (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES government_contract(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completion_date DATE,
  
  -- Deliverable details
  deliverable_type VARCHAR(100), -- 'report', 'system', 'training', 'documentation'
  requirements TEXT,
  acceptance_criteria TEXT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Assignment
  assigned_to UUID REFERENCES contract_manager(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract notifications and communications
CREATE TABLE contract_notification (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES government_contract(id) ON DELETE CASCADE,
  
  -- Notification details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- 'reminder', 'warning', 'expiration', 'amendment'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Recipients
  recipient_user_id UUID REFERENCES user_profile(id),
  recipient_email VARCHAR(255),
  
  -- Status
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the org table to add contract-related fields
ALTER TABLE org ADD COLUMN primary_contract_id UUID REFERENCES government_contract(id);
ALTER TABLE org ADD COLUMN contract_manager_email VARCHAR(255);
ALTER TABLE org ADD COLUMN contract_contact_name VARCHAR(255);
ALTER TABLE org ADD COLUMN contract_contact_phone VARCHAR(50);

-- Update user roles to include contract-specific roles  
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'contract_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technical_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'government_liaison';

-- Indexes for performance
CREATE INDEX idx_government_contract_org ON government_contract(government_org_id);
CREATE INDEX idx_government_contract_status ON government_contract(status);
CREATE INDEX idx_government_contract_dates ON government_contract(start_date, end_date);
CREATE INDEX idx_government_contract_number ON government_contract(contract_number);

CREATE INDEX idx_contract_scope_contract ON contract_administrative_scope(contract_id);
CREATE INDEX idx_contract_scope_node ON contract_administrative_scope(administrative_node_id);

CREATE INDEX idx_contract_manager_contract ON contract_manager(contract_id);
CREATE INDEX idx_contract_manager_user ON contract_manager(user_id);
CREATE INDEX idx_contract_manager_active ON contract_manager(active) WHERE active = true;
CREATE INDEX idx_contract_manager_primary ON contract_manager(contract_id, is_primary) WHERE is_primary = true;

CREATE INDEX idx_contract_amendment_contract ON contract_amendment(contract_id);
CREATE INDEX idx_contract_deliverable_contract ON contract_deliverable(contract_id);
CREATE INDEX idx_contract_deliverable_assigned ON contract_deliverable(assigned_to);
CREATE INDEX idx_contract_deliverable_due_date ON contract_deliverable(due_date);

CREATE INDEX idx_contract_notification_contract ON contract_notification(contract_id);
CREATE INDEX idx_contract_notification_recipient ON contract_notification(recipient_user_id);

-- Functions for contract management

-- Function to get all managers for a contract
CREATE OR REPLACE FUNCTION get_contract_managers(contract_uuid UUID)
RETURNS TABLE (
  manager_id UUID,
  user_id UUID,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  role VARCHAR(100),
  is_primary BOOLEAN,
  administrative_scope_name VARCHAR(255),
  active BOOLEAN
) AS $$
SELECT 
  cm.id as manager_id,
  cm.user_id,
  up.full_name as user_name,
  up.email as user_email,
  cm.role,
  cm.is_primary,
  an.name as administrative_scope_name,
  cm.active
FROM contract_manager cm
JOIN user_profile up ON cm.user_id = up.id  
LEFT JOIN administrative_node an ON cm.administrative_scope_node_id = an.id
WHERE cm.contract_id = contract_uuid
ORDER BY cm.is_primary DESC, cm.created_at ASC;
$$ LANGUAGE sql;

-- Function to check if user is manager for a contract
CREATE OR REPLACE FUNCTION is_contract_manager(user_uuid UUID, contract_uuid UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS(
  SELECT 1 FROM contract_manager 
  WHERE user_id = user_uuid 
    AND contract_id = contract_uuid 
    AND active = true
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
);
$$ LANGUAGE sql;

-- Function to get active contracts for a government org
CREATE OR REPLACE FUNCTION get_active_contracts(org_uuid UUID)
RETURNS TABLE (
  contract_id UUID,
  contract_number VARCHAR(100),
  title VARCHAR(255),
  status contract_status,
  start_date DATE,
  end_date DATE,
  manager_count BIGINT
) AS $$
SELECT 
  gc.id as contract_id,
  gc.contract_number,
  gc.title,
  gc.status,
  gc.start_date,
  gc.end_date,
  COUNT(cm.id) as manager_count
FROM government_contract gc
LEFT JOIN contract_manager cm ON gc.id = cm.contract_id AND cm.active = true
WHERE gc.government_org_id = org_uuid 
  AND gc.active = true
  AND gc.status IN ('active', 'pending')
GROUP BY gc.id, gc.contract_number, gc.title, gc.status, gc.start_date, gc.end_date
ORDER BY gc.created_at DESC;
$$ LANGUAGE sql;

-- Function to automatically expire contracts
CREATE OR REPLACE FUNCTION expire_contracts()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
BEGIN
  UPDATE government_contract 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND end_date < CURRENT_DATE
    AND status != 'expired';
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamps
CREATE TRIGGER update_government_contract_updated_at 
  BEFORE UPDATE ON government_contract 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_manager_updated_at 
  BEFORE UPDATE ON contract_manager 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_deliverable_updated_at 
  BEFORE UPDATE ON contract_deliverable 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to ensure only one primary manager per contract
CREATE OR REPLACE FUNCTION ensure_single_primary_manager()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Remove primary status from other managers of the same contract
    UPDATE contract_manager 
    SET is_primary = false, updated_at = NOW()
    WHERE contract_id = NEW.contract_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_manager_trigger
  AFTER INSERT OR UPDATE ON contract_manager
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_manager();

-- Sample data for testing
INSERT INTO government_contract (
  contract_number,
  title,
  description,
  contract_type,
  government_org_id,
  start_date,
  end_date,
  budget_amount,
  status,
  government_contact_name,
  government_contact_email,
  legal_framework
) VALUES (
  'CTR-FR-2024-001',
  'Contrat de déploiement CityGrid - République Française',
  'Déploiement de la solution CityGrid pour la gestion des équipements urbains sur le territoire français',
  'national',
  '550e8400-e29b-41d4-a716-446655440001',
  '2024-01-01',
  '2026-12-31',
  2500000.00,
  'active',
  'Jean Dupont',
  'j.dupont@interieur.gouv.fr',
  'Code général des collectivités territoriales - Articles L2212-1 et suivants'
) ON CONFLICT (contract_number) DO NOTHING;