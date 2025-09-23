#!/usr/bin/env node

/**
 * Simple migration runner for Supabase SQL migrations
 *
 * Usage: node migrate.js <migration-file>
 *
 * Requires environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Your service role key with database admin permissions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    process.exit(1);
  }

  if (!migrationFile) {
    console.error('❌ Usage: node migrate.js <migration-file>');
    console.error('   Example: node migrate.js sql-migrations/10_add_area_requirement_to_project.sql');
    process.exit(1);
  }

  const migrationPath = path.resolve(migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  console.log(`🚀 Running migration: ${path.basename(migrationFile)}`);
  console.log(`📂 Path: ${migrationPath}`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Split SQL content by statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc('exec', { sql: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error(`📄 Statement: ${statement.substring(0, 100)}...`);
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
const migrationFile = process.argv[2];
runMigration(migrationFile);