'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { analyticsAPI } from '@/lib/api'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface DashboardKPIs {
  totalProjects: number
  totalEquipments: number
  coveragePercentage: number
  nonCompliantItems: number
  lastUpdated: string
}

interface CoverageData {
  equipment_type_name: string
  category_name: string
  required: number
  current: number
  coverage_percentage: number
  deficit: number
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [coverageData, setCoverageData] = useState<CoverageData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisResponse, coverageResponse] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getCoverage()
        ])

        setKpis(kpisResponse.data)
        setCoverageData(coverageResponse.data.coverage_data || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour : {kpis?.lastUpdated ? new Date(kpis.lastUpdated).toLocaleString('fr-FR') : 'N/A'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Projets actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalProjects || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              projets en cours de suivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Couverture globale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis?.coveragePercentage || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              taux de couverture moyen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Équipements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalEquipments || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              équipements recensés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Non-conformités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {kpis?.nonCompliantItems || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              défauts de couverture
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Couverture par type d'équipement</CardTitle>
          </CardHeader>
          <CardContent>
            {coverageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={coverageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="equipment_type_name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => `Type: ${label}`}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'current' ? 'Actuel' : 'Requis'
                    ]}
                  />
                  <Bar dataKey="current" fill="#10B981" name="current" />
                  <Bar dataKey="required" fill="#EF4444" name="required" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Aucune donnée de couverture disponible
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carte des équipements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">Carte interactive à venir</p>
              <p className="text-xs text-gray-400 ml-2">(MapLibre GL JS)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Détail de la couverture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Type d'équipement</th>
                  <th className="text-left py-2">Catégorie</th>
                  <th className="text-right py-2">Requis</th>
                  <th className="text-right py-2">Actuel</th>
                  <th className="text-right py-2">Couverture</th>
                  <th className="text-right py-2">Déficit</th>
                </tr>
              </thead>
              <tbody>
                {coverageData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.equipment_type_name}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="text-right py-2">{item.required}</td>
                    <td className="text-right py-2">{item.current}</td>
                    <td className="text-right py-2">
                      <span className={`font-medium ${
                        item.coverage_percentage >= 100 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.coverage_percentage}%
                      </span>
                    </td>
                    <td className="text-right py-2">
                      {item.deficit > 0 && (
                        <span className="text-red-600">-{item.deficit}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}