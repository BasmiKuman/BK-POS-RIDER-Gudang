#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get all migration files in order
const migrationsDir = join(__dirname, 'supabase', 'migrations');
const migrationFiles = readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort(); // Sort by filename (timestamp-based)

console.log('🔍 Collecting migration files...\n');

let completeSql = '';
completeSql += '-- ============================================================================\n';
completeSql += '-- COMPLETE DATABASE SETUP FOR NEW SUPABASE PROJECT\n';
completeSql += '-- ============================================================================\n';
completeSql += `-- Generated: ${new Date().toISOString()}\n`;
completeSql += `-- Total Migration Files: ${migrationFiles.length}\n`;
completeSql += '-- ============================================================================\n';
completeSql += '-- \n';
completeSql += '-- INSTRUCTIONS:\n';
completeSql += '-- 1. Login to your Supabase Dashboard\n';
completeSql += '-- 2. Go to SQL Editor\n';
completeSql += '-- 3. Create a new query\n';
completeSql += '-- 4. Copy and paste ALL the SQL below\n';
completeSql += '-- 5. Click "Run" to execute\n';
completeSql += '-- \n';
completeSql += '-- ============================================================================\n\n';

migrationFiles.forEach((file, index) => {
  console.log(`📄 ${index + 1}. ${file}`);
  
  const filePath = join(migrationsDir, file);
  const sql = readFileSync(filePath, 'utf-8');
  
  completeSql += '\n\n';
  completeSql += '-- ============================================================================\n';
  completeSql += `-- Migration ${index + 1}/${migrationFiles.length}: ${file}\n`;
  completeSql += '-- ============================================================================\n\n';
  completeSql += sql;
  completeSql += '\n';
});

completeSql += '\n\n';
completeSql += '-- ============================================================================\n';
completeSql += '-- END OF ALL MIGRATIONS\n';
completeSql += '-- ============================================================================\n';
completeSql += '-- \n';
completeSql += '-- ✅ All tables, functions, triggers, and policies have been created!\n';
completeSql += '-- \n';
completeSql += '-- Next steps:\n';
completeSql += '-- 1. Verify all tables are created in Table Editor\n';
completeSql += '-- 2. Check RLS policies are enabled\n';
completeSql += '-- 3. Test the application connection\n';
completeSql += '-- \n';
completeSql += '-- ============================================================================\n';

// Write to file
const outputFile = join(__dirname, 'COMPLETE-DATABASE-SETUP.sql');
writeFileSync(outputFile, completeSql);

console.log('\n✅ Complete migration SQL generated!\n');
console.log('📝 File saved to:', outputFile);
console.log('\n📋 Next steps:');
console.log('   1. Open file: COMPLETE-DATABASE-SETUP.sql');
console.log('   2. Copy all contents');
console.log('   3. Go to Supabase Dashboard → SQL Editor');
console.log('   4. Paste and run the SQL\n');
console.log('🔗 Supabase SQL Editor: https://supabase.com/dashboard/project/nqkziafaofdejhuqwtul/sql/new\n');
