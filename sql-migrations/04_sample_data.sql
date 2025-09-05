-- Sample data for development and testing
-- This should only be run in development environment

-- Sample organization
INSERT INTO org (id, name, slug, subscription_status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Ville de Lyon', 'ville-lyon', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Métropole de Marseille', 'metropole-marseille', 'trialing');

-- Sample equipment categories
INSERT INTO equipment_category (org_id, name, description, color) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sports', 'Équipements sportifs et de loisir', '#10B981'),
('550e8400-e29b-41d4-a716-446655440001', 'Éducation', 'Établissements scolaires et éducatifs', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440001', 'Santé', 'Équipements de santé et centres médicaux', '#EF4444'),
('550e8400-e29b-41d4-a716-446655440001', 'Culture', 'Équipements culturels et artistiques', '#8B5CF6'),
('550e8400-e29b-41d4-a716-446655440002', 'Sports', 'Équipements sportifs', '#059669'),
('550e8400-e29b-41d4-a716-446655440002', 'Santé', 'Centres de santé', '#DC2626');

-- Sample equipment types
INSERT INTO equipment_type (org_id, category_id, name, description, icon) VALUES
-- Lyon
('550e8400-e29b-41d4-a716-446655440001', 
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Sports' LIMIT 1),
 'Terrain de football', 'Terrain de football réglementaire', 'football'),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Sports' LIMIT 1),
 'Gymnase', 'Gymnase polyvalent', 'dumbbell'),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Éducation' LIMIT 1),
 'École primaire', 'Établissement d''enseignement primaire', 'school'),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Santé' LIMIT 1),
 'Centre médical', 'Centre de soins médicaux', 'hospital'),

-- Marseille
('550e8400-e29b-41d4-a716-446655440002',
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440002' AND name = 'Sports' LIMIT 1),
 'Piscine municipale', 'Piscine publique', 'waves'),
 
('550e8400-e29b-41d4-a716-446655440002',
 (SELECT id FROM equipment_category WHERE org_id = '550e8400-e29b-41d4-a716-446655440002' AND name = 'Santé' LIMIT 1),
 'Pharmacie', 'Officine pharmaceutique', 'pill');

-- Sample thresholds
INSERT INTO threshold (org_id, equipment_type_id, name, min_population, max_distance_meters, min_area_sqm) VALUES
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Terrain de football' LIMIT 1),
 'Zone urbaine dense', 5000, 1000, 7140),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'École primaire' LIMIT 1),
 'Quartier résidentiel', 1000, 500, 2000);

-- Sample area requirements
INSERT INTO area_requirement (org_id, equipment_type_id, zone_type, requirement_per_1000_inhabitants) VALUES
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Terrain de football' LIMIT 1),
 'Zone urbaine', 0.5),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Gymnase' LIMIT 1),
 'Zone urbaine', 0.8),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'École primaire' LIMIT 1),
 'Zone résidentielle', 2.0),
 
('550e8400-e29b-41d4-a716-446655440002',
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440002' AND name = 'Piscine municipale' LIMIT 1),
 'Zone métropolitaine', 0.3);

-- Sample projects
INSERT INTO project (org_id, name, description, status, location, address, population, area_sqm, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440001', 
 'Quartier de la Part-Dieu', 
 'Réaménagement du quartier d''affaires', 
 'active',
 ST_SetSRID(ST_Point(4.8556, 45.7640), 4326),
 '100 Cours Lafayette, 69003 Lyon',
 25000,
 2500000,
 NULL),
 
('550e8400-e29b-41d4-a716-446655440001',
 'ZAC de Gerland',
 'Zone d''aménagement concerté de Gerland',
 'draft',
 ST_SetSRID(ST_Point(4.8372, 45.7228), 4326),
 '50 Avenue Tony Garnier, 69007 Lyon',
 15000,
 1800000,
 NULL),
 
('550e8400-e29b-41d4-a716-446655440002',
 'Quartier de la Joliette',
 'Rénovation urbaine du centre-ville',
 'active',
 ST_SetSRID(ST_Point(5.3659, 43.3047), 4326),
 '10 Place de la Joliette, 13002 Marseille',
 18000,
 2200000,
 NULL);

-- Sample equipment instances
INSERT INTO equipment_instance (org_id, project_id, equipment_type_id, name, location, address, quantity, status) VALUES
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM project WHERE name = 'Quartier de la Part-Dieu' LIMIT 1),
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'Gymnase' LIMIT 1),
 'Gymnase Part-Dieu Sud',
 ST_SetSRID(ST_Point(4.8565, 45.7635), 4326),
 '120 Cours Lafayette, 69003 Lyon',
 1,
 'planned'),
 
('550e8400-e29b-41d4-a716-446655440001',
 (SELECT id FROM project WHERE name = 'Quartier de la Part-Dieu' LIMIT 1),
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440001' AND name = 'École primaire' LIMIT 1),
 'École primaire Voltaire',
 ST_SetSRID(ST_Point(4.8545, 45.7625), 4326),
 '85 Rue de Bonnel, 69003 Lyon',
 1,
 'active'),
 
('550e8400-e29b-41d4-a716-446655440002',
 (SELECT id FROM project WHERE name = 'Quartier de la Joliette' LIMIT 1),
 (SELECT id FROM equipment_type WHERE org_id = '550e8400-e29b-41d4-a716-446655440002' AND name = 'Piscine municipale' LIMIT 1),
 'Piscine de la Joliette',
 ST_SetSRID(ST_Point(5.3665, 43.3052), 4326),
 '25 Boulevard de Dunkerque, 13002 Marseille',
 1,
 'planned');