import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PM2Service } from './pm2.service';
import { SystemSettingsService } from './system-settings.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [PM2Service, SystemSettingsService],
  exports: [PM2Service, SystemSettingsService],
})
export class HealthModule {}
