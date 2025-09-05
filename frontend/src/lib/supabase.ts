import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Database = {
  public: {
    Tables: {
      org: {
        Row: {
          id: string
          name: string
          slug: string
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
      }
      user_profile: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
      }
      membership: {
        Row: {
          id: string
          user_id: string
          org_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          created_at: string
        }
      }
    }
  }
}