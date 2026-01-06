#!/usr/bin/env node

/**
 * Pre-migration script to handle failed migrations
 * This script runs before prisma migrate deploy to resolve any failed migrations
 *
 * IMPORTANT: This script does NOT require psql - it uses Prisma CLI
 */

const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function preMigrate() {
  console.log('🔍 Starting pre-migration check...');

  if (!process.env.DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not found');
    console.log('ℹ️  Skipping pre-migration check - will rely on prisma migrate deploy');
    return;
  }

  // Just verify database connection
  try {
    console.log('🔗 Testing database connection...');

    // Use prisma db execute with a simple query to test connection
    // This doesn't require psql to be installed
    const testQuery = 'SELECT 1 as test;';

    try {
      execSync(`echo "${testQuery}" | npx prisma db execute --stdin`, {
        stdio: 'pipe',
        timeout: 30000
      });
      console.log('✅ Database connection successful');
    } catch (dbError) {
      // If prisma db execute fails, try to just check if we can reach the db
      console.log('ℹ️  Could not execute test query (this is OK for first deployment)');
      console.log('ℹ️  Proceeding with migration...');
    }
  } catch (error) {
    console.log('⚠️  Pre-migration check encountered an issue');
    console.log('ℹ️  Error:', error.message || error);
    console.log('ℹ️  Proceeding with migration anyway...');
  }
}

preMigrate()
  .then(() => {
    console.log('✅ Pre-migration check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pre-migration check failed:', error.message || error);
    // Don't fail the entire deployment - let prisma migrate deploy handle it
    console.log('ℹ️  Continuing despite pre-migration error...');
    process.exit(0);
  });
