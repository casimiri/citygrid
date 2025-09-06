'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, FileSpreadsheet, BarChart3 } from 'lucide-react'

export default function DashboardCalculateurPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calculateur IEU</h1>
          <p className="text-gray-600 mt-2">
            Calculez l'Indice d'Équipement Urbain pour vos territoires
          </p>
        </div>
        <Button>
          <Calculator className="w-4 h-4 mr-2" />
          Nouveau calcul
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" />
              Calcul rapide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Calculez rapidement l'IEU pour un projet spécifique
            </p>
            <Button variant="outline" className="w-full">
              Démarrer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
              Import Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Importez vos données depuis un fichier Excel
            </p>
            <Button variant="outline" className="w-full">
              Importer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Analyse avancée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Analyse comparative et tendances
            </p>
            <Button variant="outline" className="w-full">
              Analyser
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des calculs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun calcul effectué
            </h3>
            <p className="text-gray-500">
              Vos calculs d'IEU apparaîtront ici
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}