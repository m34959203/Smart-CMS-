#!/usr/bin/env node

/**
 * Wait for database to be reachable before starting the application
 * This script performs TCP-level connectivity checks and DNS resolution tests
 * specifically designed for Railway internal networking
 */

const net = require('net');
const dns = require('dns');
const { URL } = require('url');

const MAX_RETRIES = 30; // 30 retries
const RETRY_DELAY = 2000; // 2 seconds between retries
const CONNECT_TIMEOUT = 5000; // 5 seconds timeout for each connection attempt

function log(message) {
  console.log(`[wait-for-db] ${new Date().toISOString()} - ${message}`);
}

function error(message) {
  console.error(`[wait-for-db] ${new Date().toISOString()} - ERROR: ${message}`);
}

function parseDbUrl(dbUrl) {
  try {
    // Handle postgresql:// URLs
    const url = new URL(dbUrl.replace(/^postgresql:/, 'postgres:'));
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1),
      user: url.username,
    };
  } catch (e) {
    error(`Failed to parse DATABASE_URL: ${e.message}`);
    return null;
  }
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

async function checkTcpConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
      }
    };

    socket.setTimeout(CONNECT_TIMEOUT);

    socket.on('connect', () => {
      cleanup();
      resolve({ success: true });
    });

    socket.on('timeout', () => {
      cleanup();
      resolve({ success: false, error: 'Connection timeout' });
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

async function waitForDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    log('DATABASE_URL not set, skipping database wait');
    return true;
  }

  const dbConfig = parseDbUrl(dbUrl);
  if (!dbConfig) {
    error('Could not parse DATABASE_URL');
    return false;
  }

  const { host, port } = dbConfig;
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');

  log(`Waiting for database at ${host}:${port}`);
  log(`DATABASE_URL: ${maskedUrl}`);

  // Check if this is a Railway internal domain
  const isRailwayInternal = host.endsWith('.railway.internal');
  if (isRailwayInternal) {
    log('Detected Railway internal networking - using extended wait times');
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    log(`Attempt ${attempt}/${MAX_RETRIES}...`);

    // Step 1: DNS Resolution
    const dnsResult = await checkDns(host);
    if (!dnsResult.success) {
      log(`  DNS resolution failed: ${dnsResult.error}`);
      if (attempt < MAX_RETRIES) {
        log(`  Waiting ${RETRY_DELAY / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
    } else {
      log(`  DNS resolved: ${host} -> ${dnsResult.address}`);
    }

    // Step 2: TCP Connection
    const tcpResult = await checkTcpConnection(dnsResult.address || host, port);
    if (!tcpResult.success) {
      log(`  TCP connection failed: ${tcpResult.error}`);
      if (attempt < MAX_RETRIES) {
        log(`  Waiting ${RETRY_DELAY / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
    } else {
      log(`  TCP connection successful to ${host}:${port}`);
      log('Database is reachable!');
      return true;
    }
  }

  error(`Database not reachable after ${MAX_RETRIES} attempts`);

  // Log additional diagnostics for Railway
  if (host.endsWith('.railway.internal')) {
    log('');
    log('Railway Internal Networking Troubleshooting:');
    log('1. Ensure the database service is in the same Railway project/environment');
    log('2. Check that the database service is running and healthy');
    log('3. Verify the service reference variable is correctly configured');
    log('4. Try using the public database URL (TCP proxy) instead of internal URL');
    log('');
  }

  return false;
}

// Main execution
waitForDatabase()
  .then((success) => {
    if (success) {
      log('Proceeding with application startup');
      process.exit(0);
    } else {
      // Don't fail - let the app try to start anyway
      // The PrismaService has its own retry logic
      log('Database not immediately available, but proceeding with startup');
      log('The application will retry database connection during initialization');
      process.exit(0);
    }
  })
  .catch((err) => {
    error(`Unexpected error: ${err.message}`);
    process.exit(0); // Don't block startup
  });
