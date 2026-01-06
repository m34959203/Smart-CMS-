import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectionRetries = 0;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000;

  constructor() {
    // Get DATABASE_URL and add connection pool settings if not present
    let dbUrl = process.env.DATABASE_URL || '';

    // Add connection pool settings to prevent pool exhaustion
    if (dbUrl && !dbUrl.includes('connection_limit')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl = `${dbUrl}${separator}connection_limit=20&pool_timeout=30&connect_timeout=30`;
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

  private async connectWithRetry(): Promise<void> {
    while (this.connectionRetries < this.maxRetries) {
      try {
        this.connectionRetries++;
        this.logger.log(`Attempting database connection (attempt ${this.connectionRetries}/${this.maxRetries})...`);

        await this.$connect();
        this.isConnected = true;
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Database connection attempt ${this.connectionRetries} failed: ${errorMessage}`);

        if (this.connectionRetries >= this.maxRetries) {
          this.logger.error(
            `Failed to connect to database after ${this.maxRetries} attempts. App will continue but database features will be unavailable.`,
          );
          // DON'T throw - let the app start anyway for health checks
          // Database operations will fail individually
          return;
        }

        this.logger.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.sleep(this.retryDelay);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
