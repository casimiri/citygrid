-- Migration: Add support for multiple area requirements per project
-- This allows projects to be associated with multiple location criteria (area requirements)

-- Create junction table for many-to-many relationship between projects and area requirements
CREATE TABLE project_area_requirement (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  area_requirement_id UUID NOT NULL REFERENCES area_requirement(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, area_requirement_id)
);

-- Create indexes for performance
CREATE INDEX idx_project_area_requirement_project ON project_area_requirement(project_id);
CREATE INDEX idx_project_area_requirement_area_req ON project_area_requirement(area_requirement_id);

-- Add RLS policy for the junction table
ALTER TABLE project_area_requirement ENABLE ROW LEVEL SECURITY;

-- Allow users to view project area requirements in their organization
CREATE POLICY "Users can view project area requirements in their org" ON project_area_requirement
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project p
      JOIN membership m ON m.org_id = p.org_id AND m.user_id = auth.uid()
      WHERE p.id = project_area_requirement.project_id
    )
  );

-- Allow users to manage project area requirements in their organization
CREATE POLICY "Organization members can manage project area requirements" ON project_area_requirement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project p
      JOIN membership m ON m.org_id = p.org_id AND m.user_id = auth.uid()
      WHERE p.id = project_area_requirement.project_id
    )
  );

-- Note: If the single area_requirement_id column exists from a previous migration,
-- it should be removed after data migration
-- ALTER TABLE project DROP COLUMN IF EXISTS area_requirement_id;