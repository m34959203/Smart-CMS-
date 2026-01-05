#!/usr/bin/env node

/**
 * Pre-migration script to handle failed migrations
 * This script runs before prisma migrate deploy to resolve any failed migrations
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function preMigrate() {
  console.log('🔍 Checking for failed migrations...');

  // If prisma migrate resolve fails, try direct SQL approach
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found, skipping database cleanup');
    console.log('ℹ️  Migration may still fail - manual intervention may be required');
    return;
  }

  try {
    // Use psql to directly delete ONLY failed migration records (where finished_at IS NULL)
    // This safely cleans up any migrations that started but didn't complete
    // Successfully completed migrations (with finished_at) are preserved
    const deleteCommand = `psql "${process.env.DATABASE_URL}" -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;"`;

    const result = await execAsync(deleteCommand);

    if (result.stdout.includes('DELETE 0')) {
      console.log('✅ No failed migrations found - database is clean');
    } else {
      console.log('✅ Failed migration records removed from database');
    }
  } catch (dbError) {
    console.log('⚠️  Could not check for failed migrations');
    console.log('ℹ️  Error:', dbError.message);
    console.log('ℹ️  Proceeding with migration anyway...');
  }
}

preMigrate()
  .then(() => {
    console.log('✅ Pre-migration check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pre-migration check failed:', error);
    process.exit(1);
  });
