# Database Migration Required

## Issue
The `equipment_type` table is missing the `superficie` column which is needed for the "Créer un nouveau type d'équipement" form.

## Migration to Apply
Run the following SQL command in the Supabase SQL editor:

```sql
ALTER TABLE equipment_type ADD COLUMN IF NOT EXISTS superficie DECIMAL;
COMMENT ON COLUMN equipment_type.superficie IS 'Area in square meters (m²) for the equipment type';
```

## Files Updated
The following files have been updated to support the `superficie` field:

### Backend
- `src/referentiel/referentiel.service.ts` - Added superficie to createEquipmentType method
- `src/referentiel/referentiel.controller.ts` - Added superficie to API schema and method signature

### Frontend
- `src/app/[locale]/dashboard/referentiel/page.tsx` - Added superficie to interface, form state, and UI
- `src/lib/api.ts` - Added superficie to createType API interface

## Status
✅ Code changes complete
⚠️ Database migration pending - needs to be applied manually through Supabase dashboard

## Test After Migration
After applying the migration, test creating a new equipment type with a superficie value to ensure persistence works correctly.