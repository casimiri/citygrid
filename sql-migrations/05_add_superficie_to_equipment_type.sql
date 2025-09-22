-- Add superficie field to equipment_type table
ALTER TABLE equipment_type ADD COLUMN superficie DECIMAL;

-- Add comment to describe the field
COMMENT ON COLUMN equipment_type.superficie IS 'Area in square meters (m²) for the equipment type';