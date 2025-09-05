'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { signJWT, setTokenInCookies, removeTokenFromCookies, getCurrentUser } from '@/lib/auth'
import { authAPI } from '@/lib/api'
import type { AuthContextType, User, Organization, Membership } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createSupabaseClient()

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setUser(null)
        setOrganization(null)
        setMemberships([])
        setRole(null)
        return
      }

      // Get user profile and memberships from API
      const [profileResponse, membershipsResponse] = await Promise.all([
        authAPI.getProfile(),
        authAPI.getMemberships()
      ])

      setUser(profileResponse.data.user)
      setMemberships(membershipsResponse.data)
      setRole(currentUser.role)
      
      // Set current organization
      const currentOrg = membershipsResponse.data.find(
        (m: Membership) => m.org_id === currentUser.org_id
      )?.org
      setOrganization(currentOrg || null)
      
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setOrganization(null)
      setMemberships([])
      setRole(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data.user) {
      // Get user memberships to create JWT
      const { data: memberships } = await supabase
        .from('membership')
        .select(`
          *,
          org:org_id (*)
        `)
        .eq('user_id', data.user.id)

      if (memberships && memberships.length > 0) {
        // Use first organization by default
        const firstMembership = memberships[0]
        const token = await signJWT({
          sub: data.user.id,
          email: data.user.email!,
          org_id: firstMembership.org_id,
          role: firstMembership.role,
        })

        setTokenInCookies(token, firstMembership.org_id)
        await refreshUser()
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    removeTokenFromCookies()
    setUser(null)
    setOrganization(null)
    setMemberships([])
    setRole(null)
  }

  const switchOrg = async (orgId: string, role: string) => {
    if (!user) return

    const token = await signJWT({
      sub: user.id,
      email: user.email,
      org_id: orgId,
      role,
    })

    setTokenInCookies(token, orgId)
    await refreshUser()
  }

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser()
      setLoading(false)
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          removeTokenFromCookies()
          setUser(null)
          setOrganization(null)
          setMemberships([])
          setRole(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    organization,
    memberships,
    role,
    loading,
    signIn,
    signOut,
    switchOrg,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}