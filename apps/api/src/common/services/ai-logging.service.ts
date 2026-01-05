/**
 * Deep Logging Service for AI Operations
 * Tracks every step of AI API calls for debugging
 */

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface AICallLog {
  id: string;
  timestamp: string;
  service: string;
  method: string;
  status: 'initiated' | 'validating' | 'sending' | 'success' | 'error';
  details: Record<string, any>;
  error?: string;
  duration?: number;
}

@Injectable()
export class AILoggingService {
  private readonly logger = new Logger('AILogging');
  private logs: AICallLog[] = [];
  private static readonly MAX_LOGS = 500; // Prevent memory leak

  logCall(service: string, method: string, details: any) {
    const id = `${service}-${method}-${Date.now()}`;
    const log: AICallLog = {
      id,
      timestamp: new Date().toISOString(),
      service,
      method,
      status: 'initiated',
      details,
    };

    // Remove old logs if limit exceeded (keep newest)
    if (this.logs.length >= AILoggingService.MAX_LOGS) {
      this.logs = this.logs.slice(-Math.floor(AILoggingService.MAX_LOGS / 2));
    }
    this.logs.push(log);
    console.log('\n' + '='.repeat(80));
    console.log(`📋 [AI CALL INITIATED] ${id}`);
    console.log(`Service: ${service}`);
    console.log(`Method: ${method}`);
    console.log(`Timestamp: ${log.timestamp}`);
    console.log(`Details:`, JSON.stringify(details, null, 2));
    console.log('='.repeat(80) + '\n');

    return id;
  }

  logValidation(id: string, validation: Record<string, any>) {
    const log = this.findLog(id);
    if (log) {
      log.status = 'validating';
      console.log(`\n🔍 [VALIDATION] ${id}`);
      console.log('Checks:', JSON.stringify(validation, null, 2));
    }
  }

  logSending(id: string, config: Record<string, any>) {
    const log = this.findLog(id);
    if (log) {
      log.status = 'sending';
      const safeConfig = { ...config };
      // Hide sensitive data
      if (safeConfig.headers?.Authorization) {
        safeConfig.headers.Authorization = '***' + safeConfig.headers.Authorization.slice(-10);
      }
      if (safeConfig.data?.text) {
        safeConfig.data.text = safeConfig.data.text.substring(0, 100) + '...';
      }

      console.log(`\n📤 [SENDING REQUEST] ${id}`);
      console.log('URL:', config.url);
      console.log('Method:', config.method);
      console.log('Headers (masked):', JSON.stringify(safeConfig.headers, null, 2));
      console.log('Body keys:', config.data ? Object.keys(config.data) : 'none');
    }
  }

  logSuccess(id: string, response: any, duration: number) {
    const log = this.findLog(id);
    if (log) {
      log.status = 'success';
      log.duration = duration;
      log.details.response = {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
      };

      console.log(`\n✅ [SUCCESS] ${id}`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response keys:', Object.keys(response.data || {}));
    }
  }

  logError(id: string, error: any, duration: number) {
    const log = this.findLog(id);
    if (log) {
      log.status = 'error';
      log.duration = duration;
      log.error = error.message;

      let errorInfo: any = {
        message: error.message,
        code: error.code,
      };

      if (axios.isAxiosError(error)) {
        const authHeader = error.config?.headers?.Authorization;
        const authString = typeof authHeader === 'string' ? authHeader : String(authHeader || '');

        errorInfo = {
          ...errorInfo,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          responseData: error.response?.data,
          requestHeaders: error.config?.headers ?
            { ...error.config.headers, Authorization: '***' + authString.slice(-10) } :
            undefined,
        };
      }

      console.error(`\n❌ [ERROR] ${id}`);
      console.error(`Duration: ${duration}ms`);
      console.error('Error Details:', JSON.stringify(errorInfo, null, 2));
      console.error('Stack:', error.stack);
    }
  }

  logConfigCheck(configName: string, config: Record<string, any>) {
    console.log(`\n⚙️  [CONFIG CHECK] ${configName}`);
    const safeConfig = { ...config };
    if (safeConfig.apiKey) {
      safeConfig.apiKey = '***' + safeConfig.apiKey.slice(-10);
    }
    console.log('Config:', JSON.stringify(safeConfig, null, 2));
  }

  getAllLogs(): AICallLog[] {
    return this.logs;
  }

  private findLog(id: string): AICallLog | undefined {
    return this.logs.find(log => log.id === id);
  }
}
