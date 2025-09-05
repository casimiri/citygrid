'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, UserPlus, Shield, Settings, BarChart3, FileDown, Users, Building } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ManagerAssignmentFormProps {
  contractId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface User {
  id: string
  email: string
  full_name: string
}

interface AdministrativeNode {
  id: string
  name: string
  level_name: string
  level_order: number
}

interface ManagerFormData {
  user_id: string
  role: string
  is_primary: boolean
  administrative_scope_node_id: string
  manages_full_contract: boolean
  can_create_admin_tree: boolean
  can_assign_users: boolean
  can_manage_projects: boolean
  can_view_analytics: boolean
  can_export_data: boolean
  start_date: string
  end_date: string
}

const managerRoles = [
  { value: 'contract_manager', label: 'Contract Manager', description: 'Full contract oversight' },
  { value: 'technical_manager', label: 'Technical Manager', description: 'Technical implementation' },
  { value: 'regional_manager', label: 'Regional Manager', description: 'Regional coordination' },
  { value: 'government_liaison', label: 'Government Liaison', description: 'Government interface' },
]

export default function ManagerAssignmentForm({ 
  contractId, 
  onSuccess, 
  onCancel 
}: ManagerAssignmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [administrativeNodes, setAdministrativeNodes] = useState<AdministrativeNode[]>([])
  
  const [formData, setFormData] = useState<ManagerFormData>({
    user_id: '',
    role: 'contract_manager',
    is_primary: false,
    administrative_scope_node_id: '',
    manages_full_contract: true,
    can_create_admin_tree: true,
    can_assign_users: true,
    can_manage_projects: true,
    can_view_analytics: true,
    can_export_data: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })

  useEffect(() => {
    // Load available users and administrative nodes
    loadUsers()
    loadAdministrativeNodes()
  }, [contractId])

  const loadUsers = async () => {
    try {
      // This would be replaced with actual API call to get available users
      const mockUsers: User[] = [
        { id: '1', email: 'manager1@gov.fr', full_name: 'Pierre Martin' },
        { id: '2', email: 'manager2@gov.fr', full_name: 'Marie Dubois' },
        { id: '3', email: 'manager3@gov.fr', full_name: 'Jean Leroy' },
      ]
      setUsers(mockUsers)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadAdministrativeNodes = async () => {
    try {
      // This would be replaced with actual API call to get administrative nodes for the contract
      const mockNodes: AdministrativeNode[] = [
        { id: '1', name: 'Île-de-France', level_name: 'Région', level_order: 1 },
        { id: '2', name: 'Paris', level_name: 'Département', level_order: 2 },
        { id: '3', name: 'Paris 1er', level_name: 'Commune', level_order: 3 },
      ]
      setAdministrativeNodes(mockNodes)
    } catch (err) {
      console.error('Failed to load administrative nodes:', err)
    }
  }

  const handleInputChange = (field: keyof ManagerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.user_id) {
        throw new Error('Please select a user to assign as manager')
      }

      if (!formData.manages_full_contract && !formData.administrative_scope_node_id) {
        throw new Error('Please select an administrative scope when not managing the full contract')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts/assign-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when auth is implemented
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contract_id: contractId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to assign manager')
      }

      onSuccess?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = managerRoles.find(role => role.value === formData.role)

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Assign Contract Manager
        </CardTitle>
        <CardDescription>
          Assign a user as manager for this government contract
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user_id">Select User *</Label>
            <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to assign as manager" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-sm text-slate-500">{user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Manager Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {managerRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-sm text-slate-500">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="text-sm text-slate-600">{selectedRole.description}</p>
            )}
          </div>

          {/* Primary Manager */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_primary"
              checked={formData.is_primary}
              onCheckedChange={(checked) => handleInputChange('is_primary', !!checked)}
            />
            <Label htmlFor="is_primary" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Primary Manager
            </Label>
          </div>
          {formData.is_primary && (
            <div className="ml-6 text-sm text-slate-600">
              <Badge variant="secondary">Primary managers have full contract authority</Badge>
            </div>
          )}

          {/* Administrative Scope */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="manages_full_contract"
                checked={formData.manages_full_contract}
                onCheckedChange={(checked) => handleInputChange('manages_full_contract', !!checked)}
              />
              <Label htmlFor="manages_full_contract" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Manages full contract territory
              </Label>
            </div>

            {!formData.manages_full_contract && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="administrative_scope_node_id">Administrative Scope</Label>
                <Select
                  value={formData.administrative_scope_node_id}
                  onValueChange={(value) => handleInputChange('administrative_scope_node_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select administrative node" />
                  </SelectTrigger>
                  <SelectContent>
                    {administrativeNodes.map(node => (
                      <SelectItem key={node.id} value={node.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{node.level_name}</Badge>
                          {node.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Manager Permissions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_create_admin_tree"
                  checked={formData.can_create_admin_tree}
                  onCheckedChange={(checked) => handleInputChange('can_create_admin_tree', !!checked)}
                />
                <Label htmlFor="can_create_admin_tree" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Create admin tree
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_assign_users"
                  checked={formData.can_assign_users}
                  onCheckedChange={(checked) => handleInputChange('can_assign_users', !!checked)}
                />
                <Label htmlFor="can_assign_users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Assign users
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_manage_projects"
                  checked={formData.can_manage_projects}
                  onCheckedChange={(checked) => handleInputChange('can_manage_projects', !!checked)}
                />
                <Label htmlFor="can_manage_projects" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Manage projects
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_view_analytics"
                  checked={formData.can_view_analytics}
                  onCheckedChange={(checked) => handleInputChange('can_view_analytics', !!checked)}
                />
                <Label htmlFor="can_view_analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  View analytics
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_export_data"
                  checked={formData.can_export_data}
                  onCheckedChange={(checked) => handleInputChange('can_export_data', !!checked)}
                />
                <Label htmlFor="can_export_data" className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  Export data
                </Label>
              </div>
            </div>
          </div>

          {/* Assignment Period */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Assignment Period</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty for indefinite assignment
                </p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Assigning Manager...' : 'Assign Manager'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}