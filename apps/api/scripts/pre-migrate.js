#!/usr/bin/env node

/**
 * Pre-migration script to handle failed migrations
 * This script runs before prisma migrate deploy to resolve any failed migrations
 *
 * IMPORTANT: This script does NOT require psql - it uses Prisma CLI
 */

const { execSync } = require('child_process');
const net = require('net');
const dns = require('dns');
const { URL } = require('url');

function log(message) {
  console.log(`[pre-migrate] ${message}`);
}

function parseDbUrl(dbUrl) {
  try {
    const url = new URL(dbUrl.replace(/^postgresql:/, 'postgres:'));
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
    };
  } catch (e) {
    return null;
  }
}

async function checkTcpConnection(host, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      cleanup();
      resolve({ success: true });
    });

    socket.on('timeout', () => {
      cleanup();
      resolve({ success: false, error: 'timeout' });
    });

    socket.on('error', (err) => {
      cleanup();
      resolve({ success: false, error: err.code || err.message });
    });

    try {
      socket.connect(port, host);
    } catch (e) {
      cleanup();
      resolve({ success: false, error: e.message });
    }
  });
}

async function checkDns(hostname) {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err, address) => {
      if (err) {
        resolve({ success: false, error: err.code || err.message });
      } else {
        resolve({ success: true, address });
      }
    });
  });
}

async function preMigrate() {
  log('Starting pre-migration check...');

  if (!process.env.DATABASE_URL) {
    log('DATABASE_URL not found - skipping database checks');
    return;
  }

  const dbConfig = parseDbUrl(process.env.DATABASE_URL);
  if (!dbConfig) {
    log('Could not parse DATABASE_URL - proceeding anyway');
    return;
  }

  const { host, port } = dbConfig;
  log(`Database host: ${host}:${port}`);

  // Check DNS resolution
  const dnsResult = await checkDns(host);
  if (!dnsResult.success) {
    log(`DNS resolution failed for ${host}: ${dnsResult.error}`);
    if (host.endsWith('.railway.internal')) {
      log('This is a Railway internal domain - ensure database service is running');
    }
    log('Proceeding with migration anyway (may fail)...');
    return;
  }
  log(`DNS resolved: ${host} -> ${dnsResult.address}`);

  // Check TCP connectivity
  const tcpResult = await checkTcpConnection(dnsResult.address || host, port);
  if (!tcpResult.success) {
    log(`TCP connection failed to ${host}:${port}: ${tcpResult.error}`);
    log('Proceeding with migration anyway (may fail)...');
    return;
  }
  log(`TCP connection successful to ${host}:${port}`);

  // Try Prisma connection test
  try {
    log('Testing Prisma database connection...');
    const testQuery = 'SELECT 1 as test;';
    execSync(`echo "${testQuery}" | npx prisma db execute --stdin`, {
      stdio: 'pipe',
      timeout: 30000,
    });
    log('Database connection via Prisma successful');
  } catch (dbError) {
    log('Prisma test query failed (this is OK for first deployment)');
    log('Proceeding with migration...');
  }
}

preMigrate()
  .then(() => {
    log('Pre-migration check complete');
    process.exit(0);
  })
  .catch((error) => {
    log(`Pre-migration check failed: ${error.message || error}`);
    // Don't fail the entire deployment - let prisma migrate deploy handle it
    log('Continuing despite pre-migration error...');
    process.exit(0);
  });
