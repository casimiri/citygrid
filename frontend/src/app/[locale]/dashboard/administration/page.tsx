'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MapPin, 
  Users, 
  Building,
  Settings,
  Edit,
  Trash
} from 'lucide-react'
import { administrativeAPI, authAPI } from '@/lib/api'

interface AdministrativeLevel {
  id: string
  name: string
  code: string
  level_order: number
  color: string
  icon: string
  requires_parent: boolean
}

interface AdministrativeNode {
  id: string
  parent_id?: string
  name: string
  code?: string
  description?: string
  population?: number
  area_sqm?: number
  level: AdministrativeLevel
  children: AdministrativeNode[]
  depth: number
  path: string[]
}

interface TreeNodeProps {
  node: AdministrativeNode
  onNodeClick: (node: AdministrativeNode) => void
  selectedNode: AdministrativeNode | null
  level: number
}

function TreeNode({ node, onNodeClick, selectedNode, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedNode?.id === node.id

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'map': return <MapPin className="w-4 h-4" />
      case 'building': return <Building className="w-4 h-4" />
      case 'home': return <Building className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  return (
    <div className="select-none">
      <div className="relative">
        {/* Connecting lines */}
        {level > 0 && (
          <>
            {/* Vertical line from parent */}
            <div
              className="absolute border-l-2 border-gray-300"
              style={{
                left: level * 20 - 10,
                top: -8,
                height: '16px'
              }}
            />
            {/* Horizontal line to node */}
            <div
              className="absolute border-t-2 border-gray-300"
              style={{
                left: level * 20 - 10,
                top: 8,
                width: '10px'
              }}
            />
          </>
        )}

        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors relative
            hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border border-blue-200' : ''}
          `}
          style={{ marginLeft: level * 20 }}
          onClick={() => onNodeClick(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(!isExpanded)
              }}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}

          <div
            className="w-3 h-3 rounded-full border-2"
            style={{ backgroundColor: node.level.color, borderColor: node.level.color }}
          />

          {getIcon(node.level.icon)}

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate flex items-center gap-2">
              {node.name}
              {hasChildren && (
                <Badge variant="outline" className="text-xs">
                  {node.children.length} enfant{node.children.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-4">
              <span>{node.level.name}</span>
              {node.code && <span>Code: {node.code}</span>}
              {node.population && <span><Users className="w-3 h-3 inline mr-1" />{node.population.toLocaleString()}</span>}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line for children */}
          {level >= 0 && (
            <div
              className="absolute border-l-2 border-gray-300"
              style={{
                left: (level + 1) * 20 - 10,
                top: 0,
                height: `${node.children.length * 50}px`
              }}
            />
          )}
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onNodeClick={onNodeClick}
              selectedNode={selectedNode}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdministrationPage() {
  const [levels, setLevels] = useState<AdministrativeLevel[]>([])
  const [tree, setTree] = useState<AdministrativeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<AdministrativeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false)
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false)
  const [editingLevel, setEditingLevel] = useState<AdministrativeLevel | null>(null)
  const [newLevel, setNewLevel] = useState({
    name: '',
    code: '',
    level_order: 1,
    color: '#6366f1',
    icon: 'map',
    requires_parent: true
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [newNode, setNewNode] = useState({
    parent_id: 'none',
    level_id: '',
    name: '',
    code: '',
    description: '',
    population: '',
    area_sqm: ''
  })

  const validateLevel = (level: typeof newLevel) => {
    const newErrors: { [key: string]: string } = {}
    
    if (!level.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }
    
    if (!level.code.trim()) {
      newErrors.code = 'Le code est obligatoire'
    } else if (levels.some(l => l.code === level.code && l.id !== editingLevel?.id)) {
      newErrors.code = 'Ce code existe déjà'
    }
    
    if (level.level_order < 1) {
      newErrors.level_order = 'L\'ordre doit être supérieur à 0'
    } else if (levels.some(l => l.level_order === level.level_order && l.id !== editingLevel?.id)) {
      newErrors.level_order = 'Cet ordre existe déjà'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const fetchData = async () => {
    try {
      const stateId = localStorage.getItem('currentOrgId') // Récupérer l'ID de l'État actuel
      if (!stateId) return

      const [levelsResponse, treeResponse] = await Promise.all([
        administrativeAPI.getLevels(stateId),
        administrativeAPI.getTree(stateId)
      ])

      setLevels(levelsResponse.data)
      setTree(treeResponse.data)
    } catch (error) {
      console.error('Error fetching administrative data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const resetLevelForm = () => {
    setNewLevel({
      name: '',
      code: '',
      level_order: levels.length + 1,
      color: '#6366f1',
      icon: 'map',
      requires_parent: true
    })
    setEditingLevel(null)
    setErrors({})
  }

  const handleCreateLevel = async () => {
    console.log('🎯 handleCreateLevel called')
    console.log('📋 Form data:', newLevel)

    const isValid = validateLevel(newLevel)
    console.log('✅ Validation result:', isValid)
    if (!isValid) {
      console.log('❌ Validation failed, stopping execution')
      return
    }

    try {
      let stateId = localStorage.getItem('currentOrgId')
      console.log('🏢 State ID from localStorage:', stateId)

      if (!stateId) {
        console.log('🔍 No stateId in localStorage, fetching from user profile...')
        try {
          const profileResponse = await authAPI.getProfile()
          stateId = profileResponse.data.user.currentOrg
          console.log('🏢 State ID from profile:', stateId)

          if (stateId) {
            localStorage.setItem('currentOrgId', stateId)
            console.log('💾 Saved stateId to localStorage')
          }
        } catch (profileError) {
          console.error('❌ Failed to get profile:', profileError)
          setErrors({ general: 'Impossible de récupérer les informations utilisateur' })
          return
        }
      }

      if (!stateId) {
        console.log('❌ No stateId found after all attempts, stopping execution')
        setErrors({ general: 'ID de l\'organisation non trouvé' })
        return
      }

      if (editingLevel) {
        console.log('✏️ Updating existing level:', editingLevel.id)
        await administrativeAPI.updateLevel(stateId, editingLevel.id, newLevel)
      } else {
        console.log('➕ Creating new level with data:', { stateId, newLevel })
        const response = await administrativeAPI.createLevel(stateId, newLevel)
        console.log('✅ Level created successfully:', response.data)
      }

      console.log('🔄 Resetting form and refreshing data')
      resetLevelForm()
      setIsLevelDialogOpen(false)
      fetchData()
    } catch (error: any) {
      console.error('❌ Error saving level:', error)
      console.error('📝 Error details:', error.response?.data || error.message)
      setErrors({ general: 'Erreur lors de la sauvegarde du niveau' })
    }
  }

  const handleEditLevel = (level: AdministrativeLevel) => {
    setEditingLevel(level)
    setNewLevel({
      name: level.name,
      code: level.code,
      level_order: level.level_order,
      color: level.color,
      icon: level.icon,
      requires_parent: level.requires_parent
    })
    setIsLevelDialogOpen(true)
  }

  const handleDeleteLevel = async (levelId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce niveau ? Cette action est irréversible.')) {
      return
    }
    
    try {
      const stateId = localStorage.getItem('currentOrgId')
      if (!stateId) return

      await administrativeAPI.deleteLevel(stateId, levelId)
      fetchData()
    } catch (error) {
      console.error('Error deleting level:', error)
    }
  }

  const handleReorderLevels = async (fromIndex: number, toIndex: number) => {
    try {
      const stateId = localStorage.getItem('currentOrgId')
      if (!stateId) return

      const sortedLevels = [...levels].sort((a, b) => a.level_order - b.level_order)
      const [movedLevel] = sortedLevels.splice(fromIndex, 1)
      sortedLevels.splice(toIndex, 0, movedLevel)

      const reorderedLevels = sortedLevels.map((level, index) => ({
        ...level,
        level_order: index + 1
      }))

      await Promise.all(
        reorderedLevels.map(level => 
          administrativeAPI.updateLevel(stateId, level.id, level)
        )
      )

      fetchData()
    } catch (error) {
      console.error('Error reordering levels:', error)
    }
  }

  const getAvailableParents = () => {
    if (!newNode.level_id) return []

    const selectedLevel = levels.find(l => l.id === newNode.level_id)
    if (!selectedLevel) return []

    // Fonction récursive pour aplatir l'arbre
    const flattenTree = (nodes: AdministrativeNode[]): AdministrativeNode[] => {
      let result: AdministrativeNode[] = []
      for (const node of nodes) {
        result.push(node)
        if (node.children && node.children.length > 0) {
          result = result.concat(flattenTree(node.children))
        }
      }
      return result
    }

    const allNodes = flattenTree(tree)

    // Filtrer les nœuds qui peuvent être parents:
    // - Niveau inférieur (level_order plus petit)
    // - Pas le nœud lui-même (si on modifie)
    return allNodes.filter(node =>
      node.level.level_order < selectedLevel.level_order
    )
  }

  const handleCreateNode = async () => {
    try {
      const stateId = localStorage.getItem('currentOrgId')
      if (!stateId) return

      const nodeData = {
        ...newNode,
        parent_id: newNode.parent_id === 'none' ? undefined : newNode.parent_id,
        population: newNode.population ? parseInt(newNode.population) : undefined,
        area_sqm: newNode.area_sqm ? parseFloat(newNode.area_sqm) : undefined
      }

      await administrativeAPI.createNode(stateId, nodeData)
      setNewNode({
        parent_id: 'none',
        level_id: '',
        name: '',
        code: '',
        description: '',
        population: '',
        area_sqm: ''
      })
      setIsNodeDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating node:', error)
    }
  }

  const renderNodeDetails = () => {
    if (!selectedNode) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Sélectionnez un élément dans l'arborescence pour voir ses détails
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: selectedNode.level.color }}
            />
            <h3 className="text-lg font-semibold">{selectedNode.name}</h3>
            <Badge variant="secondary">{selectedNode.level.name}</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextLevel = levels.find(l => l.level_order === selectedNode.level.level_order + 1)
                if (nextLevel) {
                  setNewNode({
                    parent_id: selectedNode.id,
                    level_id: nextLevel.id,
                    name: '',
                    code: '',
                    description: '',
                    population: '',
                    area_sqm: ''
                  })
                  setIsNodeDialogOpen(true)
                }
              }}
              disabled={!levels.find(l => l.level_order === selectedNode.level.level_order + 1)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un enfant
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm">
              <Trash className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Code administratif</Label>
              <p className="text-sm">{selectedNode.code || 'Non défini'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Description</Label>
              <p className="text-sm">{selectedNode.description || 'Aucune description'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Chemin hiérarchique</Label>
              <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg">
                {selectedNode.path.map((pathItem, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span className="text-gray-600">{pathItem}</span>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  </span>
                ))}
                <span className="font-medium text-blue-600 flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedNode.level.color }}
                  />
                  {selectedNode.name}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Population</Label>
              <p className="text-sm">
                {selectedNode.population ? selectedNode.population.toLocaleString() + ' habitants' : 'Non renseigné'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Superficie</Label>
              <p className="text-sm">
                {selectedNode.area_sqm ? 
                  (selectedNode.area_sqm / 1000000).toFixed(2) + ' km²' : 
                  'Non renseigné'
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Enfants directs</Label>
              <p className="text-sm">{selectedNode.children?.length || 0} éléments</p>
            </div>
          </div>
        </div>

        {selectedNode.children && selectedNode.children.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-600 block mb-2">Éléments enfants</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {selectedNode.children.map((child) => (
                <div
                  key={child.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedNode(child)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: child.level.color }}
                    />
                    <span className="text-sm font-medium">{child.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{child.level.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Structure Administrative</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Structure Administrative</h1>
        <div className="flex gap-2">
          <Dialog open={isLevelDialogOpen} onOpenChange={(open) => {
            setIsLevelDialogOpen(open)
            if (!open) resetLevelForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Configurer les niveaux
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLevel ? 'Modifier le niveau administratif' : 'Créer un nouveau niveau administratif'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {errors.general && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {errors.general}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du niveau</Label>
                    <Input
                      id="name"
                      value={newLevel.name}
                      onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                      placeholder="ex: Région"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
                  </div>
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={newLevel.code}
                      onChange={(e) => setNewLevel({ ...newLevel, code: e.target.value })}
                      placeholder="ex: region"
                      className={errors.code ? 'border-red-500' : ''}
                    />
                    {errors.code && <span className="text-xs text-red-600">{errors.code}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="order">Ordre hiérarchique</Label>
                    <Input
                      id="order"
                      type="number"
                      value={newLevel.level_order}
                      onChange={(e) => setNewLevel({ ...newLevel, level_order: parseInt(e.target.value) })}
                      className={errors.level_order ? 'border-red-500' : ''}
                    />
                    {errors.level_order && <span className="text-xs text-red-600">{errors.level_order}</span>}
                  </div>
                  <div>
                    <Label htmlFor="color">Couleur</Label>
                    <Input
                      id="color"
                      type="color"
                      value={newLevel.color}
                      onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Icône</Label>
                    <Select value={newLevel.icon} onValueChange={(value) => setNewLevel({ ...newLevel, icon: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="map">📍 Carte</SelectItem>
                        <SelectItem value="building">🏢 Bâtiment</SelectItem>
                        <SelectItem value="home">🏠 Maison</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="requires_parent"
                      checked={newLevel.requires_parent}
                      onChange={(e) => setNewLevel({ ...newLevel, requires_parent: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="requires_parent" className="text-sm">
                      Nécessite un parent
                    </Label>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    console.log('🖱️ Button clicked: "Créer le niveau"')
                    handleCreateLevel()
                  }}
                  className="w-full"
                >
                  {editingLevel ? 'Modifier le niveau' : 'Créer le niveau'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNodeDialogOpen} onOpenChange={setIsNodeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un élément
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer un nouveau nœud administratif</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nodeName">Nom</Label>
                    <Input
                      id="nodeName"
                      value={newNode.name}
                      onChange={(e) => setNewNode({ ...newNode, name: e.target.value })}
                      placeholder="ex: Île-de-France"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nodeCode">Code</Label>
                    <Input
                      id="nodeCode"
                      value={newNode.code}
                      onChange={(e) => setNewNode({ ...newNode, code: e.target.value })}
                      placeholder="ex: IDF"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="level">Niveau administratif</Label>
                    <Select value={newNode.level_id} onValueChange={(value) => setNewNode({ ...newNode, level_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: level.color }}
                              />
                              {level.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="parent">Élément parent (optionnel)</Label>
                    <Select value={newNode.parent_id} onValueChange={(value) => setNewNode({ ...newNode, parent_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucun parent</SelectItem>
                        {getAvailableParents().map((node) => (
                          <SelectItem key={node.id} value={node.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: node.level.color }}
                              />
                              <span>{node.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {node.level.name}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newNode.description}
                    onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      value={newNode.population}
                      onChange={(e) => setNewNode({ ...newNode, population: e.target.value })}
                      placeholder="Nombre d'habitants"
                    />
                  </div>
                  <div>
                    <Label htmlFor="area">Superficie (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={newNode.area_sqm}
                      onChange={(e) => setNewNode({ ...newNode, area_sqm: e.target.value })}
                      placeholder="Superficie en m²"
                    />
                  </div>
                </div>
                <Button onClick={handleCreateNode} className="w-full">
                  Créer l'élément
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arborescence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Arborescence Administrative
            </CardTitle>
            <p className="text-sm text-gray-600">
              Cliquez sur un élément pour voir ses détails
            </p>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {tree.length > 0 ? (
              <div className="space-y-1">
                {tree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    onNodeClick={setSelectedNode}
                    selectedNode={selectedNode}
                    level={0}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                Aucune structure administrative définie
              </div>
            )}
          </CardContent>
        </Card>

        {/* Détails du nœud sélectionné */}
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent>
            {renderNodeDetails()}
          </CardContent>
        </Card>
      </div>

      {/* Configuration des niveaux */}
      {levels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Configuration des niveaux administratifs
              <Badge variant="outline">{levels.length} niveau{levels.length > 1 ? 'x' : ''}</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Gérez les niveaux hiérarchiques de votre structure administrative
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {levels
                .sort((a, b) => a.level_order - b.level_order)
                .map((level, index) => (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          #{level.level_order}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-5 h-5 rounded-full border-2" 
                          style={{ backgroundColor: level.color, borderColor: level.color }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{level.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {level.code.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{level.icon === 'map' ? '📍' : level.icon === 'building' ? '🏢' : '🏠'}</span>
                            {level.requires_parent && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                Parent requis
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {/* Move up button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderLevels(index, index - 1)}
                          disabled={index === 0}
                          className="w-8 h-8 p-0"
                        >
                          ⬆️
                        </Button>
                        {/* Move down button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderLevels(index, index + 1)}
                          disabled={index === levels.length - 1}
                          className="w-8 h-8 p-0"
                        >
                          ⬇️
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLevel(level)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLevel(level.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash className="w-4 h-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            
            {levels.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="font-medium mb-2">Aucun niveau configuré</h3>
                <p className="text-sm mb-4">
                  Commencez par créer votre premier niveau administratif
                </p>
                <Button onClick={() => setIsLevelDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un niveau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}