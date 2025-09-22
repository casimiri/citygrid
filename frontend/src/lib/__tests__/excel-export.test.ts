import { exportToExcel, exportConfigs } from '../excel-export'

// Mock XLSX module
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({ '!cols': [] })),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}))

describe('Excel Export Functionality', () => {
  const mockData = [
    {
      id: '1',
      name: 'Test Category',
      description: 'Test Description',
      color: '#FF0000',
      created_at: '2023-01-01T00:00:00Z'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('exportToExcel should call XLSX functions correctly', () => {
    const XLSX = require('xlsx')

    const config = {
      filename: 'test',
      sheetName: 'Test Sheet',
      data: mockData,
      headers: [
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' }
      ]
    }

    exportToExcel(config)

    expect(XLSX.utils.book_new).toHaveBeenCalled()
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled()
    expect(XLSX.writeFile).toHaveBeenCalled()
  })

  test('export configs should have correct structure', () => {
    expect(exportConfigs.categories).toBeDefined()
    expect(exportConfigs.categories.filename).toBe('categories_equipements')
    expect(exportConfigs.categories.headers).toHaveLength(4)

    expect(exportConfigs.equipmentTypes).toBeDefined()
    expect(exportConfigs.equipmentTypes.filename).toBe('types_equipements')
    expect(exportConfigs.equipmentTypes.headers).toHaveLength(6)

    expect(exportConfigs.programmingThresholds).toBeDefined()
    expect(exportConfigs.programmingThresholds.filename).toBe('seuils_programmation')
    expect(exportConfigs.programmingThresholds.headers).toHaveLength(5)

    expect(exportConfigs.areaRequirements).toBeDefined()
    expect(exportConfigs.areaRequirements.filename).toBe('criteres_localisation')
    expect(exportConfigs.areaRequirements.headers).toHaveLength(3)
  })
})