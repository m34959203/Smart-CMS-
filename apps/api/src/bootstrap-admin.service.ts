import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);
  private readonly maxRetries = 5;
  private readonly retryDelay = 5000; // 5 seconds between retries

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Run bootstrap in background to not block app startup
    this.bootstrapWithRetry().catch(error => {
      this.logger.error('Bootstrap admin failed after all retries:', error.message);
    });
  }

  private async bootstrapWithRetry(): Promise<void> {
    // Wait a bit for Prisma to initialize its connection
    await this.sleep(2000);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check if database is connected
        if (!this.prisma.getConnectionStatus()) {
          this.logger.warn(`Database not connected yet (attempt ${attempt}/${this.maxRetries})`);
          if (attempt < this.maxRetries) {
            await this.sleep(this.retryDelay);
            continue;
          }
          this.logger.warn('Database connection not available, skipping admin bootstrap');
          return;
        }

        await this.createDefaultAdmin();
        return; // Success - exit the retry loop
      } catch (error: any) {
        const isConnectionError =
          error.code === 'P1001' || // Can't reach database server
          error.code === 'P1002' || // Database server timed out
          error.message?.includes('connection pool') ||
          error.message?.includes('Connection refused') ||
          error.message?.includes('ECONNREFUSED');

        if (isConnectionError && attempt < this.maxRetries) {
          this.logger.warn(`Database connection error (attempt ${attempt}/${this.maxRetries}): ${error.message}`);
          await this.sleep(this.retryDelay);
        } else {
          throw error;
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async createDefaultAdmin() {
    try {
      // Check if admins already exist
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount > 0) {
        this.logger.log('Admin user already exists, skipping bootstrap');
        return;
      }

      // Check if user with this email exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: 'admin@aimak.kz' },
      });

      if (existingUser) {
        // Promote existing user to admin
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { role: Role.ADMIN },
        });
        this.logger.log('Existing user admin@aimak.kz promoted to ADMIN');
      } else {
        // Create new admin
        const hashedPassword = await bcrypt.hash('YourPassword123!', 10);

        await this.prisma.user.create({
          data: {
            email: 'admin@aimak.kz',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: Role.ADMIN,
          },
        });

        this.logger.log('Default admin created successfully');
        this.logger.log('Email: admin@aimak.kz');
        this.logger.warn('IMPORTANT: Change the password after first login!');
      }
    } catch (error) {
      this.logger.error('Failed to create default admin:', error);
    }
  }
}
