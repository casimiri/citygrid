'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { referentielAPI } from '@/lib/api'
import { Calculator, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ConformityResult {
  equipment_type_id: string
  equipment_type_name: string
  category_name: string
  required: number
  current: number
  is_compliant: boolean
  deficit: number
}

interface ConformityCheck {
  conformity_checks: ConformityResult[]
  is_compliant: boolean
}

export default function CalculatorPage() {
  const [projectData, setProjectData] = useState({
    name: '',
    population: '',
    area_sqm: '',
    address: '',
    equipment_instances: [] as any[],
  })
  const [results, setResults] = useState<ConformityCheck | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await referentielAPI.checkConformity({
        ...projectData,
        population: parseInt(projectData.population) || 0,
        area_sqm: parseFloat(projectData.area_sqm) || 0,
      })

      setResults(response.data)
    } catch (error) {
      console.error('Error checking conformity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Calculateur de conformité</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Données du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom du projet</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quartier de la Part-Dieu"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <input
                  type="text"
                  value={projectData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100 Cours Lafayette, 69003 Lyon"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Population</label>
                  <input
                    type="number"
                    value={projectData.population}
                    onChange={(e) => handleInputChange('population', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Superficie (m²)</label>
                  <input
                    type="number"
                    value={projectData.area_sqm}
                    onChange={(e) => handleInputChange('area_sqm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2500000"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Calcul en cours...' : 'Vérifier la conformité'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Résultats de conformité
              {results && (
                results.is_compliant ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Saisissez les données du projet et cliquez sur "Vérifier la conformité" pour voir les résultats.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  results.is_compliant 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {results.is_compliant ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      results.is_compliant ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {results.is_compliant ? 'Projet conforme' : 'Projet non conforme'}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    results.is_compliant ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {results.is_compliant 
                      ? 'Tous les équipements requis sont présents en quantité suffisante.'
                      : 'Certains équipements sont manquants ou en quantité insuffisante.'
                    }
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-900">Détail par type d'équipement</h4>
                  {results.conformity_checks.map((check, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md border ${
                        check.is_compliant 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{check.equipment_type_name}</div>
                          <div className="text-xs text-gray-600">{check.category_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="font-medium">{check.current}</span>
                            <span className="text-gray-500"> / {check.required}</span>
                          </div>
                          {check.deficit > 0 && (
                            <div className="text-xs text-red-600">
                              Manque: {check.deficit}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comment ça fonctionne ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium mb-2">Saisissez les données</h3>
              <p className="text-sm text-gray-600">
                Renseignez la population, la superficie et l'adresse de votre projet
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-medium mb-2">Calcul automatique</h3>
              <p className="text-sm text-gray-600">
                L'application calcule les besoins selon les seuils définis dans votre référentiel
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-medium mb-2">Résultats détaillés</h3>
              <p className="text-sm text-gray-600">
                Obtenez un rapport de conformité avec les écarts par type d'équipement
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}