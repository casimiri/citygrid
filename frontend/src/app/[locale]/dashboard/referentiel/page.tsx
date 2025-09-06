'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { referentielAPI } from '@/lib/api'
import { Plus, Edit, Trash2 } from 'lucide-react'

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
  created_at: string
}

export default function ReferentielPage() {
  const [categories, setCategories] = useState<EquipmentCategory[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesResponse, typesResponse] = await Promise.all([
        referentielAPI.getCategories(),
        referentielAPI.getTypes()
      ])

      setCategories(categoriesResponse.data)
      setEquipmentTypes(typesResponse.data)
    } catch (error) {
      console.error('Error fetching referentiel data:', error)
    } finally {
      setLoading(false)
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
        <div className="flex gap-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle catégorie
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau type
          </Button>
        </div>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories d'équipements</CardTitle>
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
          <CardTitle>
            Types d'équipements
            {selectedCategory && (
              <span className="ml-2 text-base font-normal text-gray-500">
                - {categories.find(c => c.id === selectedCategory)?.name}
              </span>
            )}
          </CardTitle>
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
    </div>
  )
}