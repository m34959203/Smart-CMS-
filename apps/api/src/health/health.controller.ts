import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { PM2Service } from './pm2.service';
import { SystemSettingsService } from './system-settings.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly pm2Service: PM2Service,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('pm2/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PM2 process status (Admin only)' })
  async getPM2Status() {
    return this.pm2Service.getStatus();
  }

  @Post('pm2/restart/:processName')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restart a PM2 process (Admin only)' })
  async restartProcess(@Param('processName') processName: string) {
    return this.pm2Service.restartProcess(processName);
  }

  @Post('pm2/stop/:processName')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop a PM2 process (Admin only)' })
  async stopProcess(@Param('processName') processName: string) {
    return this.pm2Service.stopProcess(processName);
  }

  @Post('pm2/start/:processName')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a PM2 process (Admin only)' })
  async startProcess(@Param('processName') processName: string) {
    return this.pm2Service.startProcess(processName);
  }

  @Get('pm2/logs/:processName')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get PM2 process logs (Admin only)' })
  async getLogs(
    @Param('processName') processName: string,
    @Query('lines') lines?: string,
  ) {
    const lineCount = lines ? parseInt(lines, 10) : 50;
    return this.pm2Service.getLogs(processName, lineCount);
  }

  // System Settings endpoints
  @Get('settings')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system settings (Admin only)' })
  async getSystemSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  async updateSystemSettings(
    @Body() data: { imageOptimizationEnabled?: boolean; maintenanceMode?: boolean },
  ) {
    return this.systemSettingsService.updateSettings(data);
  }

  // Public endpoint for frontend to check image optimization setting
  @Get('settings/image-optimization')
  @Public()
  @ApiOperation({ summary: 'Check if image optimization is enabled' })
  async isImageOptimizationEnabled() {
    const enabled = await this.systemSettingsService.isImageOptimizationEnabled();
    return { imageOptimizationEnabled: enabled };
  }
}
