'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { projectsAPI, administrativeAPI, referentielAPI, orgAPI } from '@/lib/api'
import { Plus, MapPin, Users, Calendar } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  project_type?: string
  address: string
  population: number
  area_sqm: number
  created_at: string
  updated_at: string
  equipment_instances: any[]
  administrative_node_id?: string
  area_requirements?: AreaRequirement[]
}

interface AdministrativeNode {
  id: string
  name: string
  level_name: string
  parent_id?: string
}

interface AreaRequirement {
  id: string
  zone_type: string
  created_at: string
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusLabels = {
  draft: 'Brouillon',
  active: 'Actif',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const projectTypeLabels = {
  new: 'Nouveau',
  renovation: 'Rénovation',
}

const projectTypeColors = {
  new: 'bg-blue-100 text-blue-800',
  renovation: 'bg-orange-100 text-orange-800',
}

export default function DashboardProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Dropdown data
  const [administrativeNodes, setAdministrativeNodes] = useState<AdministrativeNode[]>([])
  const [areaRequirements, setAreaRequirements] = useState<AreaRequirement[]>([])
  const [dropdownsLoading, setDropdownsLoading] = useState(false)

  // Project creation state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    address: '',
    area_sqm: '',
    status: 'draft',
    project_type: 'new',
    administrative_node_id: '',
    area_requirement_ids: [] as string[]
  })
  const [projectLoading, setProjectLoading] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    fetchDropdownData()
  }, [])

  const fetchDropdownData = async () => {
    setDropdownsLoading(true)
    try {
      // Get the user's current organization
      const orgResponse = await orgAPI.getCurrent()
      const currentOrg = orgResponse.data

      // Use the current organization ID to fetch administrative nodes
      const stateId = currentOrg.id

      const [nodesResponse, areaReqResponse] = await Promise.all([
        administrativeAPI.getTree(stateId),
        referentielAPI.getAreaRequirements()
      ])

      // Flatten the tree structure to get all nodes
      const flattenNodes = (nodes: any[]): AdministrativeNode[] => {
        const result: AdministrativeNode[] = []
        nodes.forEach(node => {
          result.push({
            id: node.id,
            name: node.name,
            level_name: node.level?.name || 'Niveau non défini',
            parent_id: node.parent_id
          })
          if (node.children && node.children.length > 0) {
            result.push(...flattenNodes(node.children))
          }
        })
        return result
      }

      setAdministrativeNodes(flattenNodes(nodesResponse.data || []))
      setAreaRequirements(areaReqResponse.data || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
      // Reset dropdowns on error
      setAdministrativeNodes([])
      setAreaRequirements([])
    } finally {
      setDropdownsLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setProjectLoading(true)
    setProjectError(null)

    try {
      // Basic validation
      if (!projectForm.name.trim()) {
        throw new Error('Le nom du projet est obligatoire')
      }
      if (!projectForm.description.trim()) {
        throw new Error('La description du projet est obligatoire')
      }

      const projectData = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim(),
        address: projectForm.address.trim() || undefined,
        area_sqm: projectForm.area_sqm ? parseFloat(projectForm.area_sqm) : undefined,
        status: projectForm.status,
        project_type: projectForm.project_type,
        administrative_node_id: projectForm.administrative_node_id || undefined,
        area_requirement_ids: projectForm.area_requirement_ids.length > 0 ? projectForm.area_requirement_ids : undefined
      }

      // Validate numeric fields
      if (projectData.area_sqm !== undefined && projectData.area_sqm < 0) {
        throw new Error('La surface ne peut pas être négative')
      }

      const response = await projectsAPI.create(projectData)
      setProjects([...projects, response.data])
      setProjectForm({
        name: '',
        description: '',
        address: '',
        area_sqm: '',
        status: 'draft',
        project_type: 'new',
        administrative_node_id: '',
        area_requirement_ids: []
      })
      setProjectDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating project:', error)
      setProjectError(error.response?.data?.message || error.message || 'Erreur lors de la création du projet')
    } finally {
      setProjectLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Projets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projets</h1>
        <Dialog open={projectDialogOpen} onOpenChange={(open) => {
          setProjectDialogOpen(open)
          if (open) {
            setProjectError(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              {projectError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{projectError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">Nom du projet *</Label>
                  <Input
                    id="project-name"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="Nom du projet"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="project-type">Type de projet</Label>
                  <select
                    id="project-type"
                    value={projectForm.project_type}
                    onChange={(e) => setProjectForm({ ...projectForm, project_type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="new">Nouveau</option>
                    <option value="renovation">Rénovation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-status">Statut</Label>
                  <select
                    id="project-status"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="draft">Brouillon</option>
                    <option value="active">Actif</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-admin-node">Nœud administratif</Label>
                  <select
                    id="project-admin-node"
                    value={projectForm.administrative_node_id}
                    onChange={(e) => setProjectForm({ ...projectForm, administrative_node_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    disabled={dropdownsLoading}
                  >
                    <option value="">
                      {dropdownsLoading ? 'Chargement...' : administrativeNodes.length === 0 ? 'Aucun nœud disponible' : 'Sélectionner un nœud'}
                    </option>
                    {administrativeNodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name} ({node.level_name})
                      </option>
                    ))}
                  </select>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Debug: {administrativeNodes.length} nœuds chargés, loading: {dropdownsLoading.toString()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="project-area-req">Critères de localisation</Label>
                  <div className="border border-input rounded-md p-2 max-h-32 overflow-y-auto">
                    {dropdownsLoading ? (
                      <p className="text-sm text-gray-500">Chargement...</p>
                    ) : areaRequirements.length === 0 ? (
                      <p className="text-sm text-gray-500">Aucun critère disponible</p>
                    ) : (
                      <div className="space-y-2">
                        {areaRequirements.map((req) => (
                          <label key={req.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={projectForm.area_requirement_ids.includes(req.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProjectForm({
                                    ...projectForm,
                                    area_requirement_ids: [...projectForm.area_requirement_ids, req.id]
                                  })
                                } else {
                                  setProjectForm({
                                    ...projectForm,
                                    area_requirement_ids: projectForm.area_requirement_ids.filter(id => id !== req.id)
                                  })
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{req.zone_type}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {projectForm.area_requirement_ids.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {projectForm.area_requirement_ids.length} critère(s) sélectionné(s)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="project-description">Description *</Label>
                <Textarea
                  id="project-description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Description du projet"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="project-address">Adresse</Label>
                <Input
                  id="project-address"
                  value={projectForm.address}
                  onChange={(e) => setProjectForm({ ...projectForm, address: e.target.value })}
                  placeholder="Adresse du projet"
                />
              </div>

              <div>
                <Label htmlFor="project-area">Surface (m²)</Label>
                <Input
                  id="project-area"
                  type="number"
                  value={projectForm.area_sqm}
                  onChange={(e) => setProjectForm({ ...projectForm, area_sqm: e.target.value })}
                  placeholder="Surface en m²"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={projectLoading}>
                  {projectLoading ? 'Création...' : 'Créer le projet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet
              </h3>
              <p className="text-gray-500 mb-4">
                Commencez by créant votre premier projet d'aménagement
              </p>
              <Button onClick={() => setProjectDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un projet
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        statusColors[project.status as keyof typeof statusColors]
                      }`}
                    >
                      {statusLabels[project.status as keyof typeof statusLabels]}
                    </span>
                    {project.project_type && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          projectTypeColors[project.project_type as keyof typeof projectTypeColors]
                        }`}
                      >
                        {projectTypeLabels[project.project_type as keyof typeof projectTypeLabels]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {project.equipment_instances?.length || 0} équipements
                  </span>
                </div>
                <CardTitle className="text-xl">
                  <Link
                    href={`/dashboard/projets/${project.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {project.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-2 text-sm">
                  {project.address && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="truncate">{project.address}</span>
                    </div>
                  )}

                  {project.population && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{project.population.toLocaleString()} habitants</span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">
                        {(project.area_sqm / 10000).toFixed(1)} ha
                      </div>
                      <div className="text-gray-500">Surface</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {project.equipment_instances?.length || 0}
                      </div>
                      <div className="text-gray-500">Équipements</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}