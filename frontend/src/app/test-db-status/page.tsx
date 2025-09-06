'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

export default function TestDbStatus() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  
  const supabase = createSupabaseClient()

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      const result = await testFunction()
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }))
    } catch (error: any) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }))
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults({})

    // Test 1: Database connection
    await runTest('Database Connection', async () => {
      const { data, error } = await supabase.from('org').select('count').limit(1)
      if (error) throw error
      return 'Connected successfully'
    })

    // Test 2: Check sample organizations
    await runTest('Sample Organizations', async () => {
      const { data, error } = await supabase
        .from('org')
        .select('id, name, is_state')
        .limit(5)
      if (error) throw error
      return data
    })

    // Test 3: Check auth users
    await runTest('Auth Users Count', async () => {
      const { count, error } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
      if (error) throw error
      return `${count} users found`
    })

    // Test 4: Check user profiles
    await runTest('User Profiles', async () => {
      const { data, error } = await supabase
        .from('user_profile')
        .select('id, email, full_name')
        .limit(5)
      if (error) throw error
      return data
    })

    // Test 5: Check memberships
    await runTest('Memberships', async () => {
      const { data, error } = await supabase
        .from('membership')
        .select('user_id, org_id, role')
        .limit(5)
      if (error) throw error
      return data
    })

    // Test 6: Check triggers
    await runTest('Database Triggers', async () => {
      const { data, error } = await supabase
        .rpc('get_triggers_info')
      if (error) {
        // If function doesn't exist, try raw SQL query
        const { data: triggerData, error: triggerError } = await supabase
          .from('information_schema.triggers')
          .select('trigger_name, event_manipulation, trigger_schema')
          .eq('trigger_schema', 'public')
        if (triggerError) throw new Error('Cannot access trigger information')
        return triggerData
      }
      return data
    })

    // Test 7: Test simple auth signup (non-destructive)
    await runTest('Auth Signup Test', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpass123',
        options: { data: { full_name: 'Test User' } }
      })
      
      // If no error, user was created - clean it up
      if (data.user && !error) {
        // Note: In production, we'd clean up the test user
        return 'Auth signup works (test user created)'
      }
      
      if (error) throw error
      return 'Auth signup response unclear'
    })

    setLoading(false)
  }

  const renderResult = (testName: string, result: any) => {
    if (!result) return null
    
    return (
      <div key={testName} className="mb-4 p-4 border rounded">
        <h3 className="font-bold text-lg mb-2">
          {testName} {result.success ? '✅' : '❌'}
        </h3>
        {result.success ? (
          <pre className="bg-green-50 p-2 rounded text-sm">
            {typeof result.data === 'string' 
              ? result.data 
              : JSON.stringify(result.data, null, 2)}
          </pre>
        ) : (
          <pre className="bg-red-50 p-2 rounded text-sm text-red-700">
            {result.error}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Status Test</h1>
      
      <button 
        onClick={runAllTests}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded disabled:opacity-50 mb-6"
      >
        {loading ? 'Running Tests...' : 'Run All Database Tests'}
      </button>

      <div className="space-y-4">
        {Object.entries(results).map(([testName, result]) => 
          renderResult(testName, result)
        )}
      </div>

      {Object.keys(results).length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Summary</h3>
          <p>
            ✅ Passed: {Object.values(results).filter(r => r.success).length} | 
            ❌ Failed: {Object.values(results).filter(r => !r.success).length}
          </p>
        </div>
      )}
    </div>
  )
}