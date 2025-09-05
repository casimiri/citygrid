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
import { administrativeAPI } from '@/lib/api'

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
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors
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
          <div className="font-medium text-sm truncate">{node.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span>{node.level.name}</span>
            {node.code && <span>Code: {node.code}</span>}
            {node.population && <span><Users className="w-3 h-3 inline mr-1" />{node.population.toLocaleString()}</span>}
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
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
  const [newLevel, setNewLevel] = useState({
    name: '',
    code: '',
    level_order: 1,
    color: '#6366f1',
    icon: 'map',
    requires_parent: true
  })
  const [newNode, setNewNode] = useState({
    parent_id: '',
    level_id: '',
    name: '',
    code: '',
    description: '',
    population: '',
    area_sqm: ''
  })

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

  const handleCreateLevel = async () => {
    try {
      const stateId = localStorage.getItem('currentOrgId')
      if (!stateId) return

      await administrativeAPI.createLevel(stateId, newLevel)
      setNewLevel({
        name: '',
        code: '',
        level_order: levels.length + 1,
        color: '#6366f1',
        icon: 'map',
        requires_parent: true
      })
      setIsLevelDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error creating level:', error)
    }
  }

  const handleCreateNode = async () => {
    try {
      const stateId = localStorage.getItem('currentOrgId')
      if (!stateId) return

      const nodeData = {
        ...newNode,
        parent_id: newNode.parent_id || undefined,
        population: newNode.population ? parseInt(newNode.population) : undefined,
        area_sqm: newNode.area_sqm ? parseFloat(newNode.area_sqm) : undefined
      }

      await administrativeAPI.createNode(stateId, nodeData)
      setNewNode({
        parent_id: '',
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {selectedNode.path.map((pathItem, index) => (
                  <span key={index}>
                    {pathItem}
                    {index < selectedNode.path.length - 1 && <ChevronRight className="w-3 h-3 mx-1" />}
                  </span>
                ))}
                {selectedNode.path.length > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                <span className="font-medium">{selectedNode.name}</span>
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
          <Dialog open={isLevelDialogOpen} onOpenChange={setIsLevelDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Configurer les niveaux
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouveau niveau administratif</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du niveau</Label>
                    <Input
                      id="name"
                      value={newLevel.name}
                      onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                      placeholder="ex: Région"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={newLevel.code}
                      onChange={(e) => setNewLevel({ ...newLevel, code: e.target.value })}
                      placeholder="ex: region"
                    />
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
                    />
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
                <Button onClick={handleCreateLevel} className="w-full">
                  Créer le niveau
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
            <CardTitle>Configuration des niveaux administratifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {levels
                .sort((a, b) => a.level_order - b.level_order)
                .map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="font-medium">{level.name}</span>
                        <Badge variant="outline">Niveau {level.level_order}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{level.code}</Badge>
                      {level.requires_parent && (
                        <Badge variant="outline">Nécessite parent</Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}