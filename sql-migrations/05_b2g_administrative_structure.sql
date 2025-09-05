-- Migration vers architecture B2G avec arborescence administrative configurable
-- Chaque État peut définir sa propre hiérarchie administrative

-- Table pour définir les niveaux administratifs configurables par État
CREATE TABLE administrative_level (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_id UUID REFERENCES org(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 'Région', 'Département', 'Commune', 'County', etc.
  code VARCHAR(50) NOT NULL, -- 'region', 'department', 'commune', 'county', etc.
  level_order INTEGER NOT NULL, -- 1 (plus haut niveau), 2, 3, etc.
  color VARCHAR(7) DEFAULT '#6366f1', -- Couleur hex pour l'interface
  icon VARCHAR(50) DEFAULT 'map', -- Icône pour l'interface
  requires_parent BOOLEAN DEFAULT true, -- Si ce niveau nécessite un parent
  metadata JSONB DEFAULT '{}', -- Configuration spécifique (champs requis, etc.)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(state_id, code),
  UNIQUE(state_id, level_order)
);

-- Table principale pour les nœuds de l'arborescence administrative
CREATE TABLE administrative_node (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state_id UUID REFERENCES org(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES administrative_node(id) ON DELETE CASCADE,
  level_id UUID REFERENCES administrative_level(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50), -- Code administratif officiel (INSEE, FIPS, etc.)
  description TEXT,
  population INTEGER,
  area_sqm DECIMAL,
  location GEOMETRY(Point, 4326), -- Centre géographique
  boundaries GEOMETRY(Polygon, 4326), -- Frontières administratives
  metadata JSONB DEFAULT '{}', -- Données spécifiques (maire, contact, etc.)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions par nœud administratif
CREATE TABLE administrative_permission (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  node_id UUID REFERENCES administrative_node(id) ON DELETE CASCADE,
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
  inherited BOOLEAN DEFAULT false, -- Permission héritée du parent
  granted_by UUID REFERENCES user_profile(id), -- Qui a accordé cette permission
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, node_id)
);

-- Utilisateurs assignés à des nœuds administratifs
CREATE TABLE administrative_user (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
  node_id UUID REFERENCES administrative_node(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'manager', 'technician', 'viewer', 'mayor', etc.
  scope VARCHAR(20) DEFAULT 'node' CHECK (scope IN ('node', 'subtree')), -- 'node' ou 'subtree' (incluant enfants)
  appointed_by UUID REFERENCES user_profile(id), -- Qui a nommé cet utilisateur
  appointed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Mandat ou expiration
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, node_id, role)
);

-- Modification des tables existantes pour supporter l'arborescence administrative
ALTER TABLE project ADD COLUMN administrative_node_id UUID REFERENCES administrative_node(id);
ALTER TABLE equipment_instance ADD COLUMN administrative_node_id UUID REFERENCES administrative_node(id);

-- Ajout d'une colonne pour marquer les organisations comme États (B2G)
ALTER TABLE org ADD COLUMN is_state BOOLEAN DEFAULT false;
ALTER TABLE org ADD COLUMN country_code VARCHAR(3); -- Code ISO pays
ALTER TABLE org ADD COLUMN state_code VARCHAR(10); -- Code officiel de l'État
ALTER TABLE org ADD COLUMN administrative_system VARCHAR(50) DEFAULT 'custom'; -- 'french', 'us_federal', 'german', 'custom'

-- Index pour les performances
CREATE INDEX idx_administrative_level_state ON administrative_level(state_id);
CREATE INDEX idx_administrative_level_order ON administrative_level(state_id, level_order);
CREATE INDEX idx_administrative_node_state ON administrative_node(state_id);
CREATE INDEX idx_administrative_node_parent ON administrative_node(parent_id);
CREATE INDEX idx_administrative_node_level ON administrative_node(level_id);
CREATE INDEX idx_administrative_node_location ON administrative_node USING GIST(location);
CREATE INDEX idx_administrative_node_boundaries ON administrative_node USING GIST(boundaries);
CREATE INDEX idx_administrative_permission_user ON administrative_permission(user_id);
CREATE INDEX idx_administrative_permission_node ON administrative_permission(node_id);
CREATE INDEX idx_administrative_user_user ON administrative_user(user_id);
CREATE INDEX idx_administrative_user_node ON administrative_user(node_id);
CREATE INDEX idx_project_admin_node ON project(administrative_node_id);
CREATE INDEX idx_equipment_instance_admin_node ON equipment_instance(administrative_node_id);

-- Fonction pour récupérer la hiérarchie complète d'un nœud (parents)
CREATE OR REPLACE FUNCTION get_administrative_hierarchy(node_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  level_name VARCHAR(100),
  level_order INTEGER,
  parent_id UUID
) AS $$
WITH RECURSIVE hierarchy AS (
  -- Nœud de départ
  SELECT 
    an.id,
    an.name,
    al.name as level_name,
    al.level_order,
    an.parent_id
  FROM administrative_node an
  JOIN administrative_level al ON an.level_id = al.id
  WHERE an.id = node_uuid
  
  UNION ALL
  
  -- Parents récursifs
  SELECT 
    an.id,
    an.name,
    al.name as level_name,
    al.level_order,
    an.parent_id
  FROM administrative_node an
  JOIN administrative_level al ON an.level_id = al.id
  JOIN hierarchy h ON an.id = h.parent_id
)
SELECT * FROM hierarchy ORDER BY level_order;
$$ LANGUAGE sql;

-- Fonction pour récupérer tous les descendants d'un nœud
CREATE OR REPLACE FUNCTION get_administrative_subtree(node_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  level_name VARCHAR(100),
  level_order INTEGER,
  parent_id UUID,
  depth INTEGER
) AS $$
WITH RECURSIVE subtree AS (
  -- Nœud de départ
  SELECT 
    an.id,
    an.name,
    al.name as level_name,
    al.level_order,
    an.parent_id,
    0 as depth
  FROM administrative_node an
  JOIN administrative_level al ON an.level_id = al.id
  WHERE an.id = node_uuid
  
  UNION ALL
  
  -- Enfants récursifs
  SELECT 
    an.id,
    an.name,
    al.name as level_name,
    al.level_order,
    an.parent_id,
    s.depth + 1
  FROM administrative_node an
  JOIN administrative_level al ON an.level_id = al.id
  JOIN subtree s ON an.parent_id = s.id
)
SELECT * FROM subtree ORDER BY depth, level_order, name;
$$ LANGUAGE sql;

-- Fonction pour calculer les permissions héritées
CREATE OR REPLACE FUNCTION calculate_inherited_permissions(user_uuid UUID, state_uuid UUID)
RETURNS TABLE (
  node_id UUID,
  permission_level VARCHAR(20),
  inherited BOOLEAN,
  source_node_id UUID
) AS $$
WITH RECURSIVE permission_inheritance AS (
  -- Permissions directes
  SELECT 
    ap.node_id,
    ap.permission_level,
    ap.inherited,
    ap.node_id as source_node_id,
    0 as depth
  FROM administrative_permission ap
  JOIN administrative_node an ON ap.node_id = an.id
  WHERE ap.user_id = user_uuid 
    AND an.state_id = state_uuid
  
  UNION ALL
  
  -- Permissions héritées des parents
  SELECT 
    child.id as node_id,
    pi.permission_level,
    true as inherited,
    pi.source_node_id,
    pi.depth + 1
  FROM permission_inheritance pi
  JOIN administrative_node child ON child.parent_id = pi.node_id
  WHERE pi.depth < 10 -- Limite de sécurité pour éviter les boucles
)
SELECT DISTINCT 
  node_id,
  permission_level,
  inherited,
  source_node_id
FROM permission_inheritance;
$$ LANGUAGE sql;

-- Triggers pour maintenir l'intégrité
CREATE OR REPLACE FUNCTION validate_administrative_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le parent appartient au même État
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM administrative_node 
      WHERE id = NEW.parent_id AND state_id = NEW.state_id
    ) THEN
      RAISE EXCEPTION 'Le nœud parent doit appartenir au même État';
    END IF;
  END IF;
  
  -- Vérifier que le niveau est cohérent avec le parent
  IF NEW.parent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM administrative_node parent_node
      JOIN administrative_level parent_level ON parent_node.level_id = parent_level.id
      JOIN administrative_level child_level ON NEW.level_id = child_level.id
      WHERE parent_node.id = NEW.parent_id 
        AND parent_level.level_order < child_level.level_order
        AND parent_level.state_id = child_level.state_id
    ) THEN
      RAISE EXCEPTION 'Le niveau administratif doit être cohérent avec la hiérarchie';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_administrative_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON administrative_node
  FOR EACH ROW EXECUTE FUNCTION validate_administrative_hierarchy();

-- Triggers pour les timestamps
CREATE TRIGGER update_administrative_level_updated_at 
  BEFORE UPDATE ON administrative_level 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administrative_node_updated_at 
  BEFORE UPDATE ON administrative_node 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données d'exemple pour un État français
INSERT INTO org (id, name, slug, is_state, country_code, state_code, administrative_system) 
VALUES ('550e8400-e29b-41d4-a716-446655440001', 'République Française', 'france', true, 'FRA', 'FR', 'french')
ON CONFLICT (id) DO UPDATE SET
  is_state = EXCLUDED.is_state,
  country_code = EXCLUDED.country_code,
  state_code = EXCLUDED.state_code,
  administrative_system = EXCLUDED.administrative_system;

-- Configuration des niveaux administratifs français
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Région', 'region', 1, '#ef4444', 'map'),
('550e8400-e29b-41d4-a716-446655440001', 'Département', 'department', 2, '#f59e0b', 'map-pin'),
('550e8400-e29b-41d4-a716-446655440001', 'Commune', 'commune', 3, '#10b981', 'home')
ON CONFLICT (state_id, code) DO NOTHING;

-- Exemple d'arborescence administrative française
WITH level_ids AS (
  SELECT id, code FROM administrative_level WHERE state_id = '550e8400-e29b-41d4-a716-446655440001'
)
INSERT INTO administrative_node (state_id, level_id, name, code, population, area_sqm) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  level_ids.id,
  'Île-de-France',
  '11',
  12278210,
  12012000000
FROM level_ids WHERE code = 'region'
ON CONFLICT DO NOTHING;

-- Ajouter un département dans la région Île-de-France
WITH region_id AS (
  SELECT id FROM administrative_node 
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Île-de-France'
), level_id AS (
  SELECT id FROM administrative_level 
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440001' AND code = 'department'
)
INSERT INTO administrative_node (state_id, parent_id, level_id, name, code, population, area_sqm)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  region_id.id,
  level_id.id,
  'Paris',
  '75',
  2161000,
  105400000
FROM region_id, level_id
ON CONFLICT DO NOTHING;