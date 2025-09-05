'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, FileText, Building2, Calendar, DollarSign, Users, MapPin } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ContractFormData {
  contract_number: string
  title: string
  description: string
  contract_type: 'municipal' | 'departmental' | 'regional' | 'national' | 'custom'
  government_org_id: string
  start_date: string
  end_date: string
  budget_amount: string
  currency: string
  scope_description: string
  covers_full_territory: boolean
  legal_framework: string
  contract_terms: string
  renewal_terms: string
  termination_conditions: string
  government_contact_name: string
  government_contact_email: string
  government_contact_phone: string
}

export default function CreateContractPage({ params }: { params: { locale: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState<ContractFormData>({
    contract_number: '',
    title: '',
    description: '',
    contract_type: 'municipal',
    government_org_id: '',
    start_date: '',
    end_date: '',
    budget_amount: '',
    currency: 'EUR',
    scope_description: '',
    covers_full_territory: false,
    legal_framework: '',
    contract_terms: '',
    renewal_terms: '',
    termination_conditions: '',
    government_contact_name: '',
    government_contact_email: '',
    government_contact_phone: ''
  })

  const handleInputChange = (field: keyof ContractFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.contract_number || !formData.title || !formData.start_date || !formData.end_date) {
        throw new Error('Please fill in all required fields')
      }

      // Validate dates
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      if (endDate <= startDate) {
        throw new Error('End date must be after start date')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when auth is implemented
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create contract')
      }

      const contract = await response.json()
      setSuccess(true)
      
      // Redirect to contract details after short delay
      setTimeout(() => {
        router.push(`/${params.locale}/contracts/${contract.id}`)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-900">Contract Created Successfully!</CardTitle>
            <CardDescription>
              Your government contract has been created and is ready for manager assignment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Government Contract</h1>
          <p className="text-slate-600">Set up a new B2G contract for urban equipment management</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential contract details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract_number">Contract Number *</Label>
                  <Input
                    id="contract_number"
                    placeholder="CTR-FR-2024-001"
                    value={formData.contract_number}
                    onChange={(e) => handleInputChange('contract_number', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contract_type">Contract Type</Label>
                  <Select value={formData.contract_type} onValueChange={(value: any) => handleInputChange('contract_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="municipal">Municipal</SelectItem>
                      <SelectItem value="departmental">Departmental</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Contract Title *</Label>
                <Input
                  id="title"
                  placeholder="Urban Equipment Management Contract - City of Paris"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the contract scope and objectives..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates and Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline & Budget
              </CardTitle>
              <CardDescription>
                Contract duration and financial details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="budget_amount">Budget Amount</Label>
                  <Input
                    id="budget_amount"
                    type="number"
                    step="0.01"
                    placeholder="2500000.00"
                    value={formData.budget_amount}
                    onChange={(e) => handleInputChange('budget_amount', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scope and Territory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Scope & Territory
              </CardTitle>
              <CardDescription>
                Define the geographic and administrative scope
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scope_description">Scope Description</Label>
                <Textarea
                  id="scope_description"
                  placeholder="This contract covers all municipalities within the Île-de-France region..."
                  value={formData.scope_description}
                  onChange={(e) => handleInputChange('scope_description', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="covers_full_territory"
                  checked={formData.covers_full_territory}
                  onCheckedChange={(checked) => handleInputChange('covers_full_territory', !!checked)}
                />
                <Label htmlFor="covers_full_territory">Covers full government territory</Label>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Government Contact
              </CardTitle>
              <CardDescription>
                Primary government contact for this contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="government_contact_name">Contact Name</Label>
                  <Input
                    id="government_contact_name"
                    placeholder="Jean Dupont"
                    value={formData.government_contact_name}
                    onChange={(e) => handleInputChange('government_contact_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="government_contact_phone">Phone</Label>
                  <Input
                    id="government_contact_phone"
                    placeholder="+33 1 23 45 67 89"
                    value={formData.government_contact_phone}
                    onChange={(e) => handleInputChange('government_contact_phone', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="government_contact_email">Email</Label>
                <Input
                  id="government_contact_email"
                  type="email"
                  placeholder="j.dupont@interieur.gouv.fr"
                  value={formData.government_contact_email}
                  onChange={(e) => handleInputChange('government_contact_email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal Framework */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Legal Framework
              </CardTitle>
              <CardDescription>
                Legal references and contract terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="legal_framework">Legal Framework</Label>
                <Textarea
                  id="legal_framework"
                  placeholder="Code général des collectivités territoriales - Articles L2212-1 et suivants"
                  value={formData.legal_framework}
                  onChange={(e) => handleInputChange('legal_framework', e.target.value)}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="contract_terms">Contract Terms</Label>
                <Textarea
                  id="contract_terms"
                  placeholder="Specific terms and conditions of this contract..."
                  value={formData.contract_terms}
                  onChange={(e) => handleInputChange('contract_terms', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating Contract...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}