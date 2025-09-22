'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
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
  Building,
  Globe
} from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Administration', href: '/dashboard/administration', icon: MapPin },
  { name: 'Référentiel', href: '/dashboard/referentiel', icon: Building2 },
  { name: 'Projets', href: '/dashboard/projets', icon: Folder },
  { name: 'Calculateur', href: '/dashboard/calculateur', icon: Calculator },
  { name: 'Paramètres', href: '/dashboard/parametres', icon: Settings },
]

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const { user, organization, memberships, role, signOut, switchOrg } = useAuth()
  
  // Extract locale from pathname
  const locale = pathname.split('/')[1] || 'fr'

  const handleSignOut = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await signOut()
    }
  }

  const handleSwitchOrg = async (orgId: string, newRole: string) => {
    await switchOrg(orgId, newRole)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-blue-600">
          <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-white">
            CityGrid
          </Link>
        </div>

        {/* Organization selector */}
        {organization && (
          <div className="p-4 border-b">
            <div className="relative">
              <button className="flex items-center justify-between w-full p-2 text-left bg-gray-50 rounded-md hover:bg-gray-100">
                <div>
                  <div className="font-medium text-sm">{organization.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {/* Organization dropdown (simplified) */}
              {memberships.length > 1 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {memberships.map((membership) => (
                    <button
                      key={membership.id}
                      onClick={() => handleSwitchOrg(membership.org_id, membership.role)}
                      className="flex flex-col items-start w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="font-medium text-sm">{membership.org?.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{membership.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const localizedHref = `/${locale}${item.href}`
            const isActive = pathname.startsWith(localizedHref)
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={localizedHref}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user?.full_name || user?.email}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex items-center space-x-6">
                {navigation.map((item) => {
                  const localizedHref = `/${locale}${item.href}`
                  const isActive = pathname.startsWith(localizedHref)
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      href={localizedHref}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Language indicator (placeholder for now) */}
              <div className="flex items-center space-x-2 text-gray-600">
                <Globe className="w-4 h-4" />
                <span className="text-sm">FR</span>
              </div>

              {/* Organization info in top bar */}
              {organization && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                  <Building className="w-5 h-5 text-blue-600" />
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900">
                      {organization.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Organisation
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full capitalize font-medium">
                    {role}
                  </span>
                </div>
              )}
              
              {/* User menu */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                <User className="w-5 h-5 text-green-600" />
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {user?.full_name || 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}