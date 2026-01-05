import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: 'default',
          imageOptimizationEnabled: true,
          maintenanceMode: false,
        },
      });
      this.logger.log('Created default system settings');
    }

    return settings;
  }

  async updateSettings(data: {
    imageOptimizationEnabled?: boolean;
    maintenanceMode?: boolean;
  }) {
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        ...data,
      },
      update: data,
    });

    this.logger.log(`System settings updated: ${JSON.stringify(data)}`);
    return settings;
  }

  async isImageOptimizationEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.imageOptimizationEnabled;
  }
}
