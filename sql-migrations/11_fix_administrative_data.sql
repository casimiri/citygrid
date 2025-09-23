-- Migration: Fix administrative data conflicts
-- This resolves ID conflicts between regular organizations and state organizations

-- First, ensure the state organization exists with the correct ID
INSERT INTO org (id, name, slug, is_state, country_code, state_code, administrative_system, subscription_status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'République Française',
  'france',
  true,
  'FRA',
  'FR',
  'french',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  is_state = EXCLUDED.is_state,
  country_code = EXCLUDED.country_code,
  state_code = EXCLUDED.state_code,
  administrative_system = EXCLUDED.administrative_system;

-- Ensure administrative levels exist for the correct state
INSERT INTO administrative_level (state_id, name, code, level_order, color, icon) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Région', 'region', 1, '#ef4444', 'map'),
('550e8400-e29b-41d4-a716-446655440000', 'Département', 'department', 2, '#f59e0b', 'map-pin'),
('550e8400-e29b-41d4-a716-446655440000', 'Commune', 'commune', 3, '#10b981', 'home')
ON CONFLICT (state_id, code) DO NOTHING;

-- Create administrative nodes for the French state
WITH level_ids AS (
  SELECT id, code FROM administrative_level WHERE state_id = '550e8400-e29b-41d4-a716-446655440000'
)
INSERT INTO administrative_node (state_id, level_id, name, code, population, area_sqm)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  level_ids.id,
  'Île-de-France',
  '11',
  12278210,
  12012000000
FROM level_ids WHERE code = 'region'
ON CONFLICT DO NOTHING;

-- Add a department in the Île-de-France region
WITH region_id AS (
  SELECT id FROM administrative_node
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Île-de-France'
), level_id AS (
  SELECT id FROM administrative_level
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440000' AND code = 'department'
)
INSERT INTO administrative_node (state_id, parent_id, level_id, name, code, population, area_sqm)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  region_id.id,
  level_id.id,
  'Paris',
  '75',
  2161000,
  105400000
FROM region_id, level_id
ON CONFLICT DO NOTHING;

-- Add a commune in Paris department
WITH department_id AS (
  SELECT id FROM administrative_node
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440000' AND name = 'Paris' AND code = '75'
), level_id AS (
  SELECT id FROM administrative_level
  WHERE state_id = '550e8400-e29b-41d4-a716-446655440000' AND code = 'commune'
)
INSERT INTO administrative_node (state_id, parent_id, level_id, name, code, population, area_sqm)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  department_id.id,
  level_id.id,
  'Paris 1er Arrondissement',
  '75101',
  16888,
  1830000
FROM department_id, level_id
ON CONFLICT DO NOTHING;