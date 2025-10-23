#!/usr/bin/env node

/**
 * Script to apply the payment system migration to Supabase
 * Run this if the database schema is not up to date
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying payment system migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20241223_payment_system_upgrade.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some errors are expected (like "column already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate_object') ||
              error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already applied): ${error.message}`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Payment system migration completed successfully!');
    
    // Test the migration
    console.log('🧪 Testing migration...');
    
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, collection_date, collection_address')
      .limit(1);
    
    if (itemsError) {
      throw new Error(`Items table test failed: ${itemsError.message}`);
    }
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, payment_method, payment_status')
      .limit(1);
    
    if (transactionsError) {
      throw new Error(`Transactions table test failed: ${transactionsError.message}`);
    }
    
    console.log('✅ Migration test passed! Database schema is up to date.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Please check your Supabase credentials and try again.');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
