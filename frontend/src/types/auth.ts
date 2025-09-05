export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
}

export interface Membership {
  id: string
  user_id: string
  org_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  org?: Organization
}

export interface AuthContextType {
  user: User | null
  organization: Organization | null
  memberships: Membership[]
  role: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  switchOrg: (orgId: string, role: string) => Promise<void>
  refreshUser: () => Promise<void>
}