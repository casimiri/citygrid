'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import {
  LayoutDashboard,
  Building2,
  Folder,
  Calculator,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  MapPin,
  User,
  Building
} from 'lucide-react'

// Mock data for demonstration
const mockKPIs = {
  totalProjects: 24,
  totalEquipments: 1547,
  coveragePercentage: 87,
  nonCompliantItems: 12,
  lastUpdated: new Date().toISOString()
}

const mockCoverageData = [
  { equipment_type_name: 'Éclairage', current: 85, required: 100 },
  { equipment_type_name: 'Signalisation', current: 42, required: 50 },
  { equipment_type_name: 'Mobilier urbain', current: 78, required: 80 },
  { equipment_type_name: 'Espaces verts', current: 35, required: 45 }
]

const mockUser = {
  full_name: 'Jean Dupont',
  email: 'jean.dupont@ville-demo.fr'
}

const mockOrganization = {
  name: 'Ville de Paris - 15e Arrondissement'
}

const mockRole = 'Administrateur'

export default function DashboardDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with improved design */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-blue-600">CityGrid</div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-700">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </div>
              <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                Administration
              </div>
              <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600">
                <Building2 className="w-4 h-4 mr-2" />
                Référentiel
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Language Switcher */}
            <div className="flex items-center space-x-2">
              <LanguageSwitcher />
            </div>

            {/* Organization info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <Building className="w-5 h-5 text-blue-600" />
              <div className="flex flex-col">
                <div className="text-sm font-semibold text-gray-900">
                  {mockOrganization.name}
                </div>
                <div className="text-xs text-gray-500">
                  Organisation
                </div>
              </div>
              <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full capitalize font-medium">
                {mockRole}
              </span>
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <User className="w-5 h-5 text-green-600" />
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {mockUser.full_name}
                </div>
                <div className="text-xs text-gray-500">
                  {mockUser.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 bg-gray-50 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-lg text-gray-600 mt-2">
                Vue d'ensemble de votre organisation et de vos projets
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">
                Dernière mise à jour
              </div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(mockKPIs.lastUpdated).toLocaleString('fr-FR')}
              </div>
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
                <div className="text-2xl font-bold">{mockKPIs.totalProjects}</div>
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
                  {mockKPIs.coveragePercentage}%
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
                <div className="text-2xl font-bold">{mockKPIs.totalEquipments}</div>
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
                  {mockKPIs.nonCompliantItems}
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockCoverageData}>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations organisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Building className="w-8 h-8 text-blue-600" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {mockOrganization.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Organisation principale
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {mockUser.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {mockUser.email}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs bg-green-600 text-white rounded-full font-medium">
                      {mockRole}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}