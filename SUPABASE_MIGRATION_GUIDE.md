# Supabase Database Migration Guide

## Overview
This guide explains the database structure adaptations needed for the enhanced project creation functionality that supports **multiple area requirement selections** per project.

## Current Status

### ✅ Already Implemented
1. **Administrative Structure**: The `administrative_node_id` field was already added to the `project` table in migration `05_b2g_administrative_structure.sql` (line 69)
2. **Administrative Tables**: All necessary administrative tables exist:
   - `administrative_level`
   - `administrative_node`
   - `administrative_permission`
   - `administrative_user`

### ❌ Missing Implementation
1. **Multiple Area Requirements**: Support for multiple area requirements per project via junction table

## Required Migration

### Migration File: `10_add_area_requirement_to_project.sql`

The migration creates a **many-to-many relationship** between projects and area requirements:

```sql
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

-- Add RLS policies for the junction table
ALTER TABLE project_area_requirement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project area requirements in their org" ON project_area_requirement
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project p
      JOIN membership m ON m.org_id = p.org_id AND m.user_id = auth.uid()
      WHERE p.id = project_area_requirement.project_id
    )
  );

CREATE POLICY "Organization members can manage project area requirements" ON project_area_requirement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project p
      JOIN membership m ON m.org_id = p.org_id AND m.user_id = auth.uid()
      WHERE p.id = project_area_requirement.project_id
    )
  );
```

## How to Apply Migration

### Option 1: Using the Migration Runner Script
```bash
# Ensure environment variables are set
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the migration
node migrate.js sql-migrations/10_add_area_requirement_to_project.sql
```

### Option 2: Manual Application
1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Paste the migration SQL content
4. Execute the migration

### Option 3: Using Supabase CLI (if available)
```bash
supabase db push
```

## Verification

After applying the migration, verify the changes:

```sql
-- Check that the junction table was created
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'project_area_requirement'
ORDER BY ordinal_position;

-- Check that the indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'project_area_requirement';

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'project_area_requirement';
```

## Updated Database Structure

After migration, the relationship will be:

```sql
-- Project table (unchanged)
CREATE TABLE project (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES org(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  location GEOMETRY(Point, 4326),
  address TEXT,
  area_sqm DECIMAL,
  created_by UUID REFERENCES user_profile(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  administrative_node_id UUID REFERENCES administrative_node(id) -- ✅ Already exists
);

-- New junction table for many-to-many relationship
CREATE TABLE project_area_requirement (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  area_requirement_id UUID NOT NULL REFERENCES area_requirement(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, area_requirement_id)
);
```

## Frontend/Backend Impact

### ✅ Already Implemented
- **Frontend**: Multi-select checkboxes for area requirements
- **Backend API**: Accepts `area_requirement_ids` array parameter
- **Service Layer**: Creates junction table records for each selected area requirement
- **TypeScript Interfaces**: Updated to handle arrays of area requirements
- **Form Validation**: Handles multiple selections

### 🔄 Key Changes Made
1. **Form Field**: Changed from single dropdown to multi-select checkboxes
2. **API Parameter**: Changed from `area_requirement_id` to `area_requirement_ids: string[]`
3. **Database Pattern**: Changed from foreign key to junction table
4. **Backend Logic**: Two-step creation (project first, then junction records)

## Test Project Creation

After migration, test by creating a project with:
1. Administrative node selection (single)
2. **Multiple area requirement selections** (new feature)
3. Verify all selected area requirements are associated with the project

## Query Examples

### Fetch Project with Area Requirements
```sql
SELECT
  p.*,
  array_agg(ar.zone_type) as area_requirements
FROM project p
LEFT JOIN project_area_requirement par ON p.id = par.project_id
LEFT JOIN area_requirement ar ON par.area_requirement_id = ar.id
WHERE p.org_id = 'your-org-id'
GROUP BY p.id;
```

### Check Project's Area Requirements
```sql
SELECT
  p.name as project_name,
  ar.zone_type as area_requirement
FROM project p
JOIN project_area_requirement par ON p.id = par.project_id
JOIN area_requirement ar ON par.area_requirement_id = ar.id
WHERE p.id = 'project-id';
```

## Rollback Plan

If needed, the migration can be rolled back:

```sql
-- Remove the junction table and its policies
DROP POLICY IF EXISTS "Users can view project area requirements in their org" ON project_area_requirement;
DROP POLICY IF EXISTS "Organization members can manage project area requirements" ON project_area_requirement;
DROP TABLE IF EXISTS project_area_requirement;
```

## Notes

- **Breaking Change**: This changes the API from single to multiple area requirements
- **Backwards Compatibility**: Existing projects are not affected (no area requirements)
- **Performance**: Junction table includes proper indexes and RLS policies
- **UI Enhancement**: Multi-select provides better user experience
- **Data Integrity**: Unique constraint prevents duplicate associations