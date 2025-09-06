'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, User, Bell, Shield, Database } from 'lucide-react'

export default function DashboardParametresPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos préférences et paramètres du compte
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Profil utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Modifiez vos informations personnelles
            </p>
            <Button variant="outline" className="w-full">
              Gérer le profil
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2 text-green-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Configurez vos préférences de notifications
            </p>
            <Button variant="outline" className="w-full">
              Configurer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Mot de passe et authentification
            </p>
            <Button variant="outline" className="w-full">
              Sécurité
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-600" />
              Données
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Export et sauvegarde des données
            </p>
            <Button variant="outline" className="w-full">
              Gérer les données
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Préférences générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Mode sombre</h4>
                <p className="text-sm text-gray-600">
                  Activer le thème sombre de l'interface
                </p>
              </div>
              <Button variant="outline" size="sm">
                Basculer
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Langue</h4>
                <p className="text-sm text-gray-600">
                  Français (FR)
                </p>
              </div>
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}