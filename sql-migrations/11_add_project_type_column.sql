-- Migration: Add project_type column to project table
-- Date: 2025-09-23

-- Add project_type column to project table
ALTER TABLE project
ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'new' CHECK (project_type IN ('new', 'renovation'));

-- Add comment to the column
COMMENT ON COLUMN project.project_type IS 'Type of project: new construction or renovation';

-- Update existing projects to have default type 'new'
UPDATE project
SET project_type = 'new'
WHERE project_type IS NULL;