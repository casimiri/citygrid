import * as XLSX from 'xlsx'

export interface ExcelExportConfig {
  filename: string
  sheetName: string
  data: any[]
  headers: { key: string; label: string }[]
}

export function exportToExcel(config: ExcelExportConfig): void {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Prepare the data for export
    const exportData = config.data.map(item => {
      const row: any = {}
      config.headers.forEach(header => {
        const value = getNestedValue(item, header.key)
        row[header.label] = formatCellValue(value)
      })
      return row
    })

    // Create worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    const columnWidths = config.headers.map(header => ({
      wch: Math.max(header.label.length, 15) // Minimum width of 15 characters
    }))
    worksheet['!cols'] = columnWidths

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `${config.filename}_${timestamp}.xlsx`

    // Write the file
    XLSX.writeFile(workbook, filename)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export data to Excel')
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : ''
  }, obj)
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleDateString('fr-FR')
    }
    return JSON.stringify(value)
  }

  return String(value)
}

// Predefined export configurations for referentiel data
export const exportConfigs = {
  categories: {
    filename: 'categories_equipements',
    sheetName: 'Catégories',
    headers: [
      { key: 'name', label: 'Nom' },
      { key: 'description', label: 'Description' },
      { key: 'color', label: 'Couleur' },
      { key: 'created_at', label: 'Date de création' }
    ]
  },

  equipmentTypes: {
    filename: 'types_equipements',
    sheetName: 'Types d\'équipements',
    headers: [
      { key: 'name', label: 'Nom' },
      { key: 'description', label: 'Description' },
      { key: 'icon', label: 'Icône' },
      { key: 'category.name', label: 'Catégorie' },
      { key: 'superficie', label: 'Superficie (m²)' },
      { key: 'created_at', label: 'Date de création' }
    ]
  },

  programmingThresholds: {
    filename: 'seuils_programmation',
    sheetName: 'Seuils de programmation',
    headers: [
      { key: 'name', label: 'Nom' },
      { key: 'min_population', label: 'Population minimum' },
      { key: 'max_distance_meters', label: 'Distance maximum (m)' },
      { key: 'min_area_sqm', label: 'Surface minimum (m²)' },
      { key: 'created_at', label: 'Date de création' }
    ]
  },

  areaRequirements: {
    filename: 'criteres_localisation',
    sheetName: 'Critères de localisation',
    headers: [
      { key: 'zone_type', label: 'Type de zone' },
      { key: 'requirement_per_1000_inhabitants', label: 'Exigence pour 1000 habitants' },
      { key: 'created_at', label: 'Date de création' }
    ]
  }
}