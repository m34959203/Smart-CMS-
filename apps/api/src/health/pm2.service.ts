import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PM2Process {
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
  memoryFormatted: string;
  uptime: number;
  uptimeFormatted: string;
  restarts: number;
  createdAt: string;
}

export interface PM2StatusResponse {
  available: boolean;
  processes: PM2Process[];
  error?: string;
}

@Injectable()
export class PM2Service {
  private readonly logger = new Logger(PM2Service.name);

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  async getStatus(): Promise<PM2StatusResponse> {
    try {
      const { stdout } = await execAsync('pm2 jlist', { timeout: 10000 });
      const processes = JSON.parse(stdout);

      const formattedProcesses: PM2Process[] = processes.map((proc: any) => ({
        name: proc.name,
        pm_id: proc.pm_id,
        status: proc.pm2_env?.status || 'unknown',
        cpu: proc.monit?.cpu || 0,
        memory: proc.monit?.memory || 0,
        memoryFormatted: this.formatBytes(proc.monit?.memory || 0),
        uptime: proc.pm2_env?.pm_uptime
          ? Date.now() - proc.pm2_env.pm_uptime
          : 0,
        uptimeFormatted: this.formatUptime(
          proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
        ),
        restarts: proc.pm2_env?.restart_time || 0,
        createdAt: proc.pm2_env?.created_at
          ? new Date(proc.pm2_env.created_at).toISOString()
          : '',
      }));

      return {
        available: true,
        processes: formattedProcesses,
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.warn(`PM2 status check failed: ${message}`);
      return {
        available: false,
        processes: [],
        error: message || 'PM2 is not available or not running on this system',
      };
    }
  }

  async restartProcess(processName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`pm2 restart ${processName}`, { timeout: 30000 });
      return {
        success: true,
        message: `Process ${processName} restarted successfully`,
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to restart process ${processName}: ${message}`);
      return {
        success: false,
        message: message || 'Failed to restart process',
      };
    }
  }

  async stopProcess(processName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`pm2 stop ${processName}`, { timeout: 30000 });
      return {
        success: true,
        message: `Process ${processName} stopped successfully`,
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to stop process ${processName}: ${message}`);
      return {
        success: false,
        message: message || 'Failed to stop process',
      };
    }
  }

  async startProcess(processName: string): Promise<{ success: boolean; message: string }> {
    try {
      await execAsync(`pm2 start ${processName}`, { timeout: 30000 });
      return {
        success: true,
        message: `Process ${processName} started successfully`,
      };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      this.logger.error(`Failed to start process ${processName}: ${message}`);
      return {
        success: false,
        message: message || 'Failed to start process',
      };
    }
  }

  async getLogs(processName: string, lines: number = 50): Promise<{ logs: string; error?: string }> {
    try {
      const { stdout } = await execAsync(`pm2 logs ${processName} --lines ${lines} --nostream`, {
        timeout: 15000,
      });
      return { logs: stdout };
    } catch (error: unknown) {
      const message = this.getErrorMessage(error);
      return {
        logs: '',
        error: message || 'Failed to get logs',
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private formatUptime(ms: number): string {
    if (ms <= 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
