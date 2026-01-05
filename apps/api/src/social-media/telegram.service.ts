import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly API_URL = 'https://api.telegram.org/bot';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    // Create axios instance with custom configuration
    this.axiosInstance = axios.create({
      timeout: 60000, // 60 seconds
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        maxSockets: 50,
        maxFreeSockets: 10,
        rejectUnauthorized: true,
        family: 4, // Force IPv4 to avoid IPv6 connectivity issues
      }),
    });
  }

  /**
   * Отправить текстовое сообщение в Telegram
   */
  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown';
      disable_web_page_preview?: boolean;
    },
  ) {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Sending message to Telegram chat ${chatId} (attempt ${attempt}/${maxRetries})`);
        this.logger.debug(`API URL: ${this.API_URL}${botToken.substring(0, 10)}...`);

        const response = await this.axiosInstance.post(
          `${this.API_URL}${botToken}/sendMessage`,
          {
            chat_id: chatId,
            text,
            parse_mode: options?.parse_mode || 'HTML',
            disable_web_page_preview: options?.disable_web_page_preview || false,
          },
        );

        this.logger.log(
          `Message sent successfully. Message ID: ${response.data.result.message_id}`,
        );

        return {
          success: true,
          messageId: response.data.result.message_id,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage =
          error.response?.data?.description || error.message;
        this.logger.error(`Failed to send Telegram message (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt; // 2s, 4s
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    const errorMessage =
      lastError.response?.data?.description || lastError.message;
    throw new HttpException(
      `Telegram API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }

  /**
   * Отправить фото с подписью в Telegram
   */
  async sendPhoto(
    botToken: string,
    chatId: string,
    photoUrl: string,
    caption?: string,
  ) {
    const maxRetries = 2; // Fewer retries for photos since they're slower
    let lastError: any;

    // URL-encode the photo URL to handle Cyrillic characters
    const encodedPhotoUrl = encodeURI(photoUrl);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Sending photo to Telegram chat ${chatId} (attempt ${attempt}/${maxRetries})`);
        this.logger.debug(`Photo URL: ${encodedPhotoUrl}`);
        this.logger.debug(`API URL: ${this.API_URL}${botToken.substring(0, 10)}...`);

        const response = await this.axiosInstance.post(
          `${this.API_URL}${botToken}/sendPhoto`,
          {
            chat_id: chatId,
            photo: encodedPhotoUrl,
            caption,
            parse_mode: 'HTML',
          },
        );

        this.logger.log(
          `Photo sent successfully. Message ID: ${response.data.result.message_id}`,
        );

        return {
          success: true,
          messageId: response.data.result.message_id,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage =
          error.response?.data?.description || error.message;
        this.logger.error(`Failed to send Telegram photo (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = 3000; // 3s between photo retries
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    const errorMessage =
      lastError.response?.data?.description || lastError.message;
    throw new HttpException(
      `Telegram API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }
}
