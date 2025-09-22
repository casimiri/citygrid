# Excel Export Functionality

## Overview
The Excel export functionality allows users to export data from all sections of the referentiel page to Excel (.xlsx) files.

## Features
- ✅ Export Categories to Excel
- ✅ Export Equipment Types to Excel (with category filtering support)
- ✅ Export Programming Thresholds to Excel
- ✅ Export Area Requirements to Excel

## Usage

### In the Referentiel Page
Each section now has an "Exporter Excel" button in the header that allows users to download the data as an Excel file.

### Programmatic Usage
```typescript
import { exportToExcel, exportConfigs } from '@/lib/excel-export'

// Export categories
exportToExcel({
  ...exportConfigs.categories,
  data: categoriesArray
})

// Export equipment types with custom filename
exportToExcel({
  ...exportConfigs.equipmentTypes,
  data: equipmentTypesArray,
  filename: 'custom_filename'
})
```

## File Structure

### Generated Files
- `categories_equipements_YYYY-MM-DDTHH-MM-SS.xlsx`
- `types_equipements_YYYY-MM-DDTHH-MM-SS.xlsx`
- `types_equipements_[CategoryName]_YYYY-MM-DDTHH-MM-SS.xlsx` (when filtered by category)
- `seuils_programmation_YYYY-MM-DDTHH-MM-SS.xlsx`
- `criteres_localisation_YYYY-MM-DDTHH-MM-SS.xlsx`

### Excel Sheet Structure

#### Categories Sheet
| Nom | Description | Couleur | Date de création |
|-----|-------------|---------|------------------|

#### Equipment Types Sheet
| Nom | Description | Icône | Catégorie | Superficie (m²) | Date de création |
|-----|-------------|-------|-----------|-----------------|------------------|

#### Programming Thresholds Sheet
| Nom | Population minimum | Distance maximum (m) | Surface minimum (m²) | Date de création |
|-----|-------------------|---------------------|---------------------|------------------|

#### Area Requirements Sheet
| Type de zone | Exigence pour 1000 habitants | Date de création |
|--------------|------------------------------|------------------|

## Technical Details

### Dependencies
- `xlsx` library for Excel file generation
- Auto-formatted dates in French locale (DD/MM/YYYY)
- Column width auto-sizing

### Error Handling
- All export functions include try-catch blocks
- Errors are logged to console
- User-friendly error messages

### Performance
- Client-side Excel generation (no server requests)
- Minimal bundle size impact (~100KB for xlsx library)
- Instant download once generated