'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { referentielAPI } from '@/lib/api'
import { Plus, Edit, Trash2, Download } from 'lucide-react'
import { exportToExcel, exportConfigs } from '@/lib/excel-export'

interface EquipmentCategory {
  id: string
  name: string
  description: string
  color: string
  created_at: string
}

interface EquipmentType {
  id: string
  name: string
  description: string
  icon: string
  category: EquipmentCategory
  superficie?: number
  created_at: string
}

interface ProgrammingThreshold {
  id: string
  name: string
  min_population?: number
  max_distance_meters?: number
  min_area_sqm?: number
  created_at: string
}

interface AreaRequirement {
  id: string
  zone_type: string
  requirement_per_1000_inhabitants: number
  created_at: string
}

interface AdministrativeLevel {
  id: string
  name: string
  code: string
  level_order: number
  color: string
  icon: string
}

export default function ReferentielPage() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [programmingThresholds, setProgrammingThresholds] = useState<ProgrammingThreshold[]>([])
  const [areaRequirements, setAreaRequirements] = useState<AreaRequirement[]>([])
  const [administrativeLevels, setAdministrativeLevels] = useState<AdministrativeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Category creation state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Type creation state
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    icon: '',
    categoryId: '',
    superficie: '',
    thresholdIds: [] as string[],
    areaRequirementIds: [] as string[],
    administrativeLevelIds: [] as string[]
  })
  const [typeLoading, setTypeLoading] = useState(false)

  // Threshold creation state
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false)
  const [thresholdForm, setThresholdForm] = useState({
    name: '',
    min_population: '',
    max_distance_meters: '',
    min_area_sqm: ''
  })
  const [thresholdLoading, setThresholdLoading] = useState(false)

  // Area requirement creation state
  const [areaReqDialogOpen, setAreaReqDialogOpen] = useState(false)
  const [areaReqForm, setAreaReqForm] = useState({
    zone_type: ''
  })
  const [areaReqLoading, setAreaReqLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesResponse, typesResponse, thresholdsResponse, areaReqResponse, adminLevelsResponse] = await Promise.all([
        referentielAPI.getCategories(),
        referentielAPI.getTypes(),
        referentielAPI.getProgrammingThresholds(),
        referentielAPI.getAreaRequirements(),
        referentielAPI.getAdministrativeLevels()
      ])

      setCategories(categoriesResponse.data)
      setEquipmentTypes(typesResponse.data)
      setProgrammingThresholds(thresholdsResponse.data)
      setAreaRequirements(areaReqResponse.data)
      setAdministrativeLevels(adminLevelsResponse.data)
    } catch (error) {
      console.error('Error fetching referentiel data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryLoading(true)

    try {
      const response = await referentielAPI.createCategory(categoryForm)
      setCategories([...categories, response.data])
      setCategoryForm({ name: '', description: '', color: '#3B82F6' })
      setCategoryDialogOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault()
    setTypeLoading(true)

    try {
      const typeData = {
        name: typeForm.name,
        description: typeForm.description,
        icon: typeForm.icon,
        categoryId: typeForm.categoryId,
        superficie: typeForm.superficie ? parseFloat(typeForm.superficie) : undefined,
        thresholdIds: typeForm.thresholdIds,
        areaRequirementIds: typeForm.areaRequirementIds,
        administrativeLevelIds: typeForm.administrativeLevelIds
      }

      const response = await referentielAPI.createType(typeData)
      setEquipmentTypes([...equipmentTypes, response.data])
      setTypeForm({
        name: '',
        description: '',
        icon: '',
        categoryId: '',
        superficie: '',
        thresholdIds: [],
        areaRequirementIds: [],
        administrativeLevelIds: []
      })
      setTypeDialogOpen(false)
    } catch (error) {
      console.error('Error creating type:', error)
    } finally {
      setTypeLoading(false)
    }
  }

  const handleCreateThreshold = async (e: React.FormEvent) => {
    e.preventDefault()
    setThresholdLoading(true)

    try {
      const thresholdData = {
        name: thresholdForm.name,
        min_population: thresholdForm.min_population ? parseInt(thresholdForm.min_population) : undefined,
        max_distance_meters: thresholdForm.max_distance_meters ? parseInt(thresholdForm.max_distance_meters) : undefined,
        min_area_sqm: thresholdForm.min_area_sqm ? parseFloat(thresholdForm.min_area_sqm) : undefined
      }

      const response = await referentielAPI.createProgrammingThreshold(thresholdData)
      setProgrammingThresholds([...programmingThresholds, response.data])
      setThresholdForm({ name: '', min_population: '', max_distance_meters: '', min_area_sqm: '' })
      setThresholdDialogOpen(false)
    } catch (error) {
      console.error('Error creating threshold:', error)
    } finally {
      setThresholdLoading(false)
    }
  }

  const handleCreateAreaReq = async (e: React.FormEvent) => {
    e.preventDefault()
    setAreaReqLoading(true)

    try {
      const areaReqData = {
        zone_type: areaReqForm.zone_type
      }

      const response = await referentielAPI.createAreaRequirement(areaReqData)
      setAreaRequirements([...areaRequirements, response.data])
      setAreaReqForm({ zone_type: '' })
      setAreaReqDialogOpen(false)
    } catch (error) {
      console.error('Error creating area requirement:', error)
    } finally {
      setAreaReqLoading(false)
    }
  }

  // Export functions
  const handleExportCategories = () => {
    try {
      exportToExcel({
        ...exportConfigs.categories,
        data: categories
      })
    } catch (error) {
      console.error('Error exporting categories:', error)
    }
  }

  const handleExportEquipmentTypes = () => {
    try {
      const typesToExport = selectedCategory
        ? equipmentTypes.filter(type => type.category.id === selectedCategory)
        : equipmentTypes

      exportToExcel({
        ...exportConfigs.equipmentTypes,
        data: typesToExport,
        filename: selectedCategory
          ? `types_equipements_${categories.find(c => c.id === selectedCategory)?.name || 'filtres'}`
          : exportConfigs.equipmentTypes.filename
      })
    } catch (error) {
      console.error('Error exporting equipment types:', error)
    }
  }

  const handleExportProgrammingThresholds = () => {
    try {
      exportToExcel({
        ...exportConfigs.programmingThresholds,
        data: programmingThresholds
      })
    } catch (error) {
      console.error('Error exporting programming thresholds:', error)
    }
  }

  const handleExportAreaRequirements = () => {
    try {
      exportToExcel({
        ...exportConfigs.areaRequirements,
        data: areaRequirements
      })
    } catch (error) {
      console.error('Error exporting area requirements:', error)
    }
  }

  const filteredTypes = selectedCategory
    ? equipmentTypes.filter(type => type.category.id === selectedCategory)
    : equipmentTypes

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Référentiel</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Référentiel</h1>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nom</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Nom de la catégorie"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category-description">Description</Label>
                  <Input
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Description de la catégorie"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category-color">Couleur</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="category-color"
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      className="w-20 h-10"
                      required
                    />
                    <Input
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={categoryLoading}>
                    {categoryLoading ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau type d'équipement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateType} className="space-y-4">
                <div>
                  <Label htmlFor="type-name">Nom</Label>
                  <Input
                    id="type-name"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    placeholder="Nom du type"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type-description">Description</Label>
                  <Input
                    id="type-description"
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    placeholder="Description du type"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type-icon">Icône</Label>
                  <Input
                    id="type-icon"
                    value={typeForm.icon}
                    onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                    placeholder="Nom de l'icône (ex: Building, Home, etc.)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type-category">Catégorie</Label>
                  <select
                    id="type-category"
                    value={typeForm.categoryId}
                    onChange={(e) => setTypeForm({ ...typeForm, categoryId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="type-superficie">Superficie (m²)</Label>
                  <Input
                    id="type-superficie"
                    type="number"
                    value={typeForm.superficie}
                    onChange={(e) => setTypeForm({ ...typeForm, superficie: e.target.value })}
                    placeholder="Superficie en m²"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="type-thresholds">Seuils de programmation</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {programmingThresholds.map((threshold) => (
                      <label key={threshold.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeForm.thresholdIds.includes(threshold.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTypeForm({
                                ...typeForm,
                                thresholdIds: [...typeForm.thresholdIds, threshold.id]
                              })
                            } else {
                              setTypeForm({
                                ...typeForm,
                                thresholdIds: typeForm.thresholdIds.filter(id => id !== threshold.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {threshold.name}
                          {(threshold.min_population || threshold.max_distance_meters || threshold.min_area_sqm) && (
                            <span className="text-gray-500">
                              {' '}(
                              {threshold.min_population && `Pop: ${threshold.min_population}`}
                              {threshold.min_population && (threshold.max_distance_meters || threshold.min_area_sqm) && ', '}
                              {threshold.max_distance_meters && `Dist: ${threshold.max_distance_meters}m`}
                              {threshold.max_distance_meters && threshold.min_area_sqm && ', '}
                              {threshold.min_area_sqm && `Aire: ${threshold.min_area_sqm}m²`}
                              )
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                    {programmingThresholds.length === 0 && (
                      <p className="text-sm text-gray-500">Aucun seuil disponible</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="type-area-requirements">Critères de localisation</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {areaRequirements.map((areaReq) => (
                      <label key={areaReq.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeForm.areaRequirementIds.includes(areaReq.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTypeForm({
                                ...typeForm,
                                areaRequirementIds: [...typeForm.areaRequirementIds, areaReq.id]
                              })
                            } else {
                              setTypeForm({
                                ...typeForm,
                                areaRequirementIds: typeForm.areaRequirementIds.filter(id => id !== areaReq.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {areaReq.zone_type} ({areaReq.requirement_per_1000_inhabitants}/1000 hab.)
                        </span>
                      </label>
                    ))}
                    {areaRequirements.length === 0 && (
                      <p className="text-sm text-gray-500">Aucun critère disponible</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="type-administrative-levels">Niveaux administratifs</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                    {administrativeLevels.map((level) => (
                      <label key={level.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={typeForm.administrativeLevelIds.includes(level.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTypeForm({
                                ...typeForm,
                                administrativeLevelIds: [...typeForm.administrativeLevelIds, level.id]
                              })
                            } else {
                              setTypeForm({
                                ...typeForm,
                                administrativeLevelIds: typeForm.administrativeLevelIds.filter(id => id !== level.id)
                              })
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {level.name} (Niveau {level.level_order})
                        </span>
                      </label>
                    ))}
                    {administrativeLevels.length === 0 && (
                      <p className="text-sm text-gray-500">Aucun niveau administratif disponible</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setTypeDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={typeLoading}>
                    {typeLoading ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau seuil
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un seuil de programmation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateThreshold} className="space-y-4">
                <div>
                  <Label htmlFor="threshold-name">Nom</Label>
                  <Input
                    id="threshold-name"
                    value={thresholdForm.name}
                    onChange={(e) => setThresholdForm({ ...thresholdForm, name: e.target.value })}
                    placeholder="Nom du seuil"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="threshold-min-population">Population minimum</Label>
                  <Input
                    id="threshold-min-population"
                    type="number"
                    value={thresholdForm.min_population}
                    onChange={(e) => setThresholdForm({ ...thresholdForm, min_population: e.target.value })}
                    placeholder="Population minimum"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold-max-distance">Distance maximum (mètres)</Label>
                  <Input
                    id="threshold-max-distance"
                    type="number"
                    value={thresholdForm.max_distance_meters}
                    onChange={(e) => setThresholdForm({ ...thresholdForm, max_distance_meters: e.target.value })}
                    placeholder="Distance maximum en mètres"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="threshold-min-area">Superficie minimum (m²)</Label>
                  <Input
                    id="threshold-min-area"
                    type="number"
                    value={thresholdForm.min_area_sqm}
                    onChange={(e) => setThresholdForm({ ...thresholdForm, min_area_sqm: e.target.value })}
                    placeholder="Superficie minimum en m²"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setThresholdDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={thresholdLoading}>
                    {thresholdLoading ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={areaReqDialogOpen} onOpenChange={setAreaReqDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau critère
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un critère de localisation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAreaReq} className="space-y-4">
                <div>
                  <Label htmlFor="areareq-zone-type">Type de zone</Label>
                  <Input
                    id="areareq-zone-type"
                    value={areaReqForm.zone_type}
                    onChange={(e) => setAreaReqForm({ ...areaReqForm, zone_type: e.target.value })}
                    placeholder="Type de zone (résidentiel, commercial, etc.)"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setAreaReqDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={areaReqLoading}>
                    {areaReqLoading ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Catégories d'équipements</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCategories}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color + '20' : undefined,
                  borderColor: category.color,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{category.description}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Créé le {new Date(category.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Types d'équipements
              {selectedCategory && (
                <span className="ml-2 text-base font-normal text-gray-500">
                  - {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportEquipmentTypes}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTypes.map((type) => (
              <Card key={type.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: type.category.color }}
                      />
                      <span className="text-sm text-gray-500">
                        {type.category.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  <div className="mt-2 text-xs text-gray-400">
                    Créé le {new Date(type.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun type d'équipement trouvé
              {selectedCategory && ' pour cette catégorie'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Programming Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seuils de programmation</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProgrammingThresholds}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programmingThresholds.map((threshold) => (
              <Card key={threshold.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{threshold.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {threshold.min_population && (
                      <div>Population min: {threshold.min_population.toLocaleString()}</div>
                    )}
                    {threshold.max_distance_meters && (
                      <div>Distance max: {threshold.max_distance_meters}m</div>
                    )}
                    {threshold.min_area_sqm && (
                      <div>Surface min: {threshold.min_area_sqm}m²</div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Créé le {new Date(threshold.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {programmingThresholds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun seuil de programmation trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Area Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Critères de localisation</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAreaRequirements}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areaRequirements.map((requirement) => (
              <Card key={requirement.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{requirement.zone_type}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 text-xs text-gray-400">
                    Créé le {new Date(requirement.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {areaRequirements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun critère de localisation trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}