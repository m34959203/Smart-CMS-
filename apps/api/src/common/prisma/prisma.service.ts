import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as net from 'net';
import * as dns from 'dns';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries = 10;
  private readonly initialRetryDelay = 2000; // Start with 2 seconds
  private readonly maxRetryDelay = 30000; // Max 30 seconds between retries
  private dbHost: string = '';
  private dbPort: number = 5432;

  constructor() {
    // Get DATABASE_URL and add connection pool settings if not present
    let dbUrl = process.env.DATABASE_URL || '';

    // Log database connection info (mask password for security)
    const maskedUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ':****@') : 'NOT SET';
    console.log(`[PrismaService] DATABASE_URL: ${maskedUrl}`);

    // Extract host and port for TCP checks
    try {
      const url = new URL(dbUrl.replace(/^postgresql:/, 'postgres:'));
      const host = url.hostname;
      const port = parseInt(url.port || '5432', 10);
      console.log(`[PrismaService] Database host: ${host}`);
      console.log(`[PrismaService] Database port: ${port}`);

      // Store for later TCP checks
      // @ts-ignore - assigning before super
      this.dbHost = host;
      // @ts-ignore - assigning before super
      this.dbPort = port;

      // Check if Railway internal network
      if (host.endsWith('.railway.internal')) {
        console.log(`[PrismaService] Using Railway internal networking`);
      }
    } catch (e) {
      console.log(`[PrismaService] Could not parse DATABASE_URL`);
    }

    // Add connection pool settings optimized for Railway/serverless environments
    // - connection_limit: Lower limit to prevent pool exhaustion
    // - pool_timeout: Time to wait for available connection from pool
    // - connect_timeout: Longer timeout for cold starts and network delays
    // - socket_timeout: Timeout for socket operations
    if (dbUrl && !dbUrl.includes('connection_limit')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      // Railway-optimized settings:
      // - connection_limit=3: Very low to handle Railway's connection limits
      // - pool_timeout=20: Shorter pool timeout to fail fast
      // - connect_timeout=30: Allow time for internal DNS resolution
      // - socket_timeout=30: Socket operation timeout
      dbUrl = `${dbUrl}${separator}connection_limit=3&pool_timeout=20&connect_timeout=30&socket_timeout=30`;
      console.log(
        `[PrismaService] Added connection pool settings: connection_limit=3, pool_timeout=20, connect_timeout=30`,
      );
    }

    super({
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Check if the database host is reachable via TCP
   */
  private async checkTcpConnection(): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.dbHost) {
      return { success: true }; // Skip check if no host parsed
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
        }
      };

      socket.setTimeout(5000);

      socket.on('connect', () => {
        cleanup();
        resolve({ success: true });
      });

      socket.on('timeout', () => {
        cleanup();
        resolve({ success: false, error: 'TCP connection timeout' });
      });

      socket.on('error', (err: NodeJS.ErrnoException) => {
        cleanup();
        resolve({ success: false, error: err.code || err.message });
      });

      try {
        socket.connect(this.dbPort, this.dbHost);
      } catch (e) {
        cleanup();
        resolve({
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Check DNS resolution for the database host
   */
  private async checkDnsResolution(): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> {
    if (!this.dbHost) {
      return { success: true };
    }

    return new Promise((resolve) => {
      dns.lookup(this.dbHost, (err, address) => {
        if (err) {
          resolve({
            success: false,
            error: err.code || err.message,
          });
        } else {
          resolve({ success: true, address });
        }
      });
    });
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    // Exponential backoff: 2s, 4s, 8s, 16s, 30s, 30s, ...
    const delay = Math.min(
      this.initialRetryDelay * Math.pow(2, attempt - 1),
      this.maxRetryDelay,
    );
    return delay;
  }

  private async connectWithRetry(): Promise<void> {
    while (this.connectionRetries < this.maxRetries) {
      try {
        this.connectionRetries++;
        const retryDelay = this.getRetryDelay(this.connectionRetries);

        this.logger.log(
          `Attempting database connection (attempt ${this.connectionRetries}/${this.maxRetries})...`,
        );

        // Step 1: Check DNS resolution
        const dnsResult = await this.checkDnsResolution();
        if (!dnsResult.success) {
          this.logger.warn(`DNS resolution failed: ${dnsResult.error}`);
          if (this.connectionRetries < this.maxRetries) {
            this.logger.log(
              `Retrying in ${retryDelay / 1000} seconds (exponential backoff)...`,
            );
            await this.sleep(retryDelay);
            continue;
          }
        } else if (dnsResult.address) {
          this.logger.log(
            `DNS resolved: ${this.dbHost} -> ${dnsResult.address}`,
          );
        }

        // Step 2: Check TCP connectivity
        const tcpResult = await this.checkTcpConnection();
        if (!tcpResult.success) {
          this.logger.warn(`TCP connection check failed: ${tcpResult.error}`);
          if (this.connectionRetries < this.maxRetries) {
            this.logger.log(
              `Retrying in ${retryDelay / 1000} seconds (exponential backoff)...`,
            );
            await this.sleep(retryDelay);
            continue;
          }
        } else {
          this.logger.log(
            `TCP connection successful to ${this.dbHost}:${this.dbPort}`,
          );
        }

        // Step 3: Try Prisma connection
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Successfully connected to database via Prisma');
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const retryDelay = this.getRetryDelay(this.connectionRetries);

        this.logger.warn(
          `Database connection attempt ${this.connectionRetries} failed: ${errorMessage}`,
        );

        if (this.connectionRetries >= this.maxRetries) {
          this.logger.error(
            `Failed to connect to database after ${this.maxRetries} attempts.`,
          );
          this.logTroubleshootingInfo();
          // DON'T throw - let the app start anyway for health checks
          // Database operations will fail individually
          return;
        }

        this.logger.log(
          `Retrying in ${retryDelay / 1000} seconds (exponential backoff)...`,
        );
        await this.sleep(retryDelay);
      }
    }
  }

  private logTroubleshootingInfo(): void {
    this.logger.log('');
    this.logger.log('=== Database Connection Troubleshooting ===');

    if (this.dbHost.endsWith('.railway.internal')) {
      this.logger.log('Railway Internal Networking Issues:');
      this.logger.log(
        '1. Ensure the Postgres service is running in the same Railway project',
      );
      this.logger.log(
        '2. Check that both services are in the same Railway environment',
      );
      this.logger.log(
        '3. Verify the service reference variable (e.g., ${{Postgres.DATABASE_URL}})',
      );
      this.logger.log(
        '4. Try redeploying the database service first, then this service',
      );
      this.logger.log(
        '5. Consider using the public TCP proxy URL instead of internal URL',
      );
      this.logger.log(
        '   (Railway Dashboard > Postgres Service > Connect > Public Network)',
      );
    } else {
      this.logger.log('General Database Connection Issues:');
      this.logger.log('1. Verify DATABASE_URL is correctly formatted');
      this.logger.log('2. Check that the database server is running');
      this.logger.log('3. Verify network connectivity to the database host');
      this.logger.log('4. Check database credentials');
    }

    this.logger.log('');
    this.logger.log('App will continue but database features will be unavailable.');
    this.logger.log('===========================================');
    this.logger.log('');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error(
        'Error disconnecting from database',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
