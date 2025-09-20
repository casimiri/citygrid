const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://klmpidjokalszpnvraze.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsbXBpZGpva2Fsc3pwbnZyYXplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk5NjYxMCwiZXhwIjoyMDcyNTcyNjEwfQ.htLxQ_GdBYH7rgIjOkDl5BMqzZntKpKHfD76ULTuG-k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthConfiguration() {
  console.log('🔍 Checking database triggers and RLS policies...');

  try {
    // Check for triggers on auth.users table
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('event_object_table', 'users')
      .eq('event_object_schema', 'auth');

    if (triggerError) {
      console.log('❌ Could not check triggers:', triggerError.message);
    } else {
      console.log('📋 Triggers on auth.users:', triggers);
    }

    // Check RLS status on auth.users
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_auth_users_rls');

    if (rlsError) {
      console.log('❌ Could not check RLS (expected):', rlsError.message);
    }

    // Try a direct query to auth.users to test permissions
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(1);

    if (authError) {
      console.log('❌ Cannot query auth.users:', authError.message);
    } else {
      console.log('✅ Can access auth.users table');
    }

    // Check if we can access the users table via admin client
    console.log('\n🔧 Testing admin client configuration...');

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: adminData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email: 'admin-test@example.com',
      password: 'TestPassword123!',
      email_confirm: true
    });

    if (adminError) {
      console.error('❌ Admin createUser failed:', adminError);
    } else {
      console.log('✅ Admin createUser works:', adminData);

      // Clean up the test user
      await adminSupabase.auth.admin.deleteUser(adminData.user.id);
      console.log('🧹 Cleaned up test user');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAuthConfiguration();