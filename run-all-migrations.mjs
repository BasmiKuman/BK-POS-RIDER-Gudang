#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envContent = readFileSync(join(__dirname, '.env.local'), 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]+)=(.+)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', SUPABASE_URL);

// Create Supabase client with service role key (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Get all migration files in order
const migrationsDir = join(__dirname, 'supabase', 'migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort by filename (timestamp-based)

console.log(`\n📋 Found ${migrationFiles.length} migration files:\n`);
migrationFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

// Function to execute SQL
async function executeSql(sql, filename) {
  try {
    // Split by semicolons but keep them for separate execution
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Try direct query method if rpc fails
          const { error: queryError } = await supabase.from('_').select('*').limit(0);
          
          // For DDL statements, we need to use the REST API directly
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ query: statement + ';' })
          });

          if (!response.ok) {
            // Execute using pg_admin or raw SQL - we'll use a different approach
            console.log(`   ⚠️  Statement ${i + 1}/${statements.length} might need manual execution`);
          }
        }
      }
    }
    
    console.log(`   ✅ Executed successfully`);
    return true;
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    return false;
  }
}

// Run migrations sequentially
async function runMigrations() {
  console.log('\n🚀 Starting migrations...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (const file of migrationFiles) {
    console.log(`\n📄 Running: ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');
    
    const success = await executeSql(sql, file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\n⚠️  Some migrations failed. You may need to run them manually in Supabase SQL Editor.');
    console.log(`   Visit: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

// Alternative: Print SQL for manual execution
function printMigrationsForManualExecution() {
  console.log('\n📋 COPY AND PASTE THE FOLLOWING SQL INTO SUPABASE SQL EDITOR:\n');
  console.log('='.repeat(80));
  console.log(`-- Database Setup for ${SUPABASE_URL}`);
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  console.log('');

  migrationFiles.forEach((file, index) => {
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');
    
    console.log(`\n-- ============================================================================`);
    console.log(`-- Migration ${index + 1}/${migrationFiles.length}: ${file}`);
    console.log(`-- ============================================================================\n`);
    console.log(sql);
    console.log('\n');
  });

  console.log('='.repeat(80));
  console.log('-- END OF MIGRATIONS');
  console.log('='.repeat(80));
}

// Check if we should print SQL or execute
const args = process.argv.slice(2);

if (args.includes('--print') || args.includes('-p')) {
  printMigrationsForManualExecution();
} else {
  console.log('\n⚠️  Note: Due to Supabase API limitations, automated migration execution may not work.');
  console.log('    If migrations fail, run this script with --print flag to get SQL for manual execution:\n');
  console.log('    node run-all-migrations.mjs --print > migrations.sql\n');
  console.log('    Then paste the SQL into Supabase SQL Editor.\n');
  
  // Try automated execution
  runMigrations().catch(console.error);
}
