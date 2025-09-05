'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { projectsAPI } from '@/lib/api'
import { Plus, MapPin, Users, Calendar } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  address: string
  population: number
  area_sqm: number
  created_at: string
  updated_at: string
  equipment_instances: any[]
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

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
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau projet
        </Button>
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
              <Button>
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
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      statusColors[project.status as keyof typeof statusColors]
                    }`}
                  >
                    {statusLabels[project.status as keyof typeof statusLabels]}
                  </span>
                  <span className="text-xs text-gray-500">
                    {project.equipment_instances?.length || 0} équipements
                  </span>
                </div>
                <CardTitle className="text-xl">
                  <Link
                    href={`/projets/${project.id}`}
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