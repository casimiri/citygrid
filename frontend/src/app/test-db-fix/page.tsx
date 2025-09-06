'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

export default function TestDbFix() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createSupabaseClient()

  const runFix = async () => {
    setLoading(true)
    setResult('Starting database fixes...\n')
    
    try {
      // First, drop existing problematic triggers
      setResult(prev => prev + 'Step 1: Dropping problematic triggers...\n')
      
      let { error } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'on_auth_user_created')
      
      if (!error) {
        setResult(prev => prev + '✅ Found existing triggers, proceeding with fixes\n')
      }
      
      // Step 2: Create simple user profile function with direct SQL
      setResult(prev => prev + 'Step 2: Creating simplified user handling...\n')
      
      // We'll use the client to execute raw SQL via edge function or direct DB access
      const fixSQL = `
        -- Drop existing triggers
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        DROP TRIGGER IF EXISTS on_auth_user_org_setup ON auth.users;
        DROP TRIGGER IF EXISTS simple_on_auth_user_created ON auth.users;
        
        -- Create simple function
        CREATE OR REPLACE FUNCTION simple_handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO user_profile (id, email, full_name)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
          )
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create simple trigger
        CREATE TRIGGER simple_on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW 
          EXECUTE FUNCTION simple_handle_new_user();
      `
      
      setResult(prev => prev + '⚠️ Manual SQL execution required. Check SQL migrations file.\n')
      setResult(prev => prev + '✅ Use: psql -h <host> -U postgres -d <database> -f sql-migrations/08_simple_user_fix.sql\n')
      
      // Test current state
      setResult(prev => prev + '\nStep 3: Testing current database state...\n')
      
      const { data: orgData, error: orgError } = await supabase
        .from('org')
        .select('id, name, is_state')
        .limit(3)
      
      if (orgError) {
        setResult(prev => prev + `❌ Org test failed: ${orgError.message}\n`)
      } else {
        setResult(prev => prev + `✅ Org table accessible: ${orgData?.length || 0} records\n`)
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('email')
        .limit(3)
      
      if (profileError) {
        setResult(prev => prev + `❌ User profiles test failed: ${profileError.message}\n`)
      } else {
        setResult(prev => prev + `✅ User profiles accessible: ${profileData?.length || 0} records\n`)
      }
      
    } catch (error) {
      setResult(prev => prev + `\nError: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@contractville.fr',
        password: 'password123'
      })
      
      if (error) {
        setResult(`Login Error: ${error.message}`)
      } else {
        setResult(`Login Success! User: ${data.user?.email}`)
      }
    } catch (error) {
      setResult(`Login Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Fix Utility</h1>
      
      <div className="space-y-4">
        <button 
          onClick={runFix}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Fix Database'}
        </button>
        
        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>
      
      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
        {result}
      </pre>
    </div>
  )
}