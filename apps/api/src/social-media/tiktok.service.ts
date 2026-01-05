import { Injectable, HttpException, Logger, OnModuleDestroy } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

export interface TiktokPublishResult {
  success: boolean;
  publishId: string;
  postId?: string;
}

export interface TiktokPostStatus {
  status: 'PROCESSING_UPLOAD' | 'PROCESSING_DOWNLOAD' | 'SEND_TO_USER_INBOX' | 'PUBLISH_COMPLETE' | 'FAILED';
  failReason?: string;
  publiclyAvailablePostId?: string[];
}

@Injectable()
export class TiktokService implements OnModuleDestroy {
  private readonly logger = new Logger(TiktokService.name);
  private readonly API_URL = 'https://open.tiktokapis.com/v2';
  private readonly axiosInstance: AxiosInstance;
  private readonly httpsAgent: https.Agent;

  constructor() {
    // Create HTTPS agent with more conservative settings to prevent connection buildup
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 5000, // Reduced from 10000
      maxSockets: 10, // Reduced from 50 to prevent connection exhaustion
      maxFreeSockets: 2, // Reduced from 10
      timeout: 30000, // Add socket timeout
      rejectUnauthorized: true,
      family: 4,
    });

    this.axiosInstance = axios.create({
      timeout: 30000, // Reduced from 60000 to fail faster
      httpsAgent: this.httpsAgent,
    });
  }

  /**
   * Cleanup HTTPS agent connections on module destroy
   */
  onModuleDestroy() {
    this.logger.log('Destroying TikTok service HTTPS agent');
    this.httpsAgent.destroy();
  }

  /**
   * Инициализация публикации фото-поста в TikTok
   * TikTok Content Posting API поддерживает публикацию фото с текстом
   */
  async initPhotoPost(
    accessToken: string,
    openId: string,
    photoUrls: string[],
    title: string,
    description: string,
    privacyLevel: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY' = 'PUBLIC_TO_EVERYONE',
  ): Promise<TiktokPublishResult> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Initializing TikTok photo post (attempt ${attempt}/${maxRetries})`);

        const response = await this.axiosInstance.post(
          `${this.API_URL}/post/publish/content/init/`,
          {
            post_info: {
              title: title.substring(0, 150), // TikTok limit
              description: description.substring(0, 2200), // TikTok limit
              privacy_level: privacyLevel,
              disable_duet: false,
              disable_comment: false,
              disable_stitch: false,
            },
            source_info: {
              source: 'PULL_FROM_URL',
              photo_cover_index: 0,
              photo_images: photoUrls.slice(0, 35), // Max 35 photos
            },
            post_mode: 'DIRECT_POST',
            media_type: 'PHOTO',
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
          },
        );

        if (response.data.error?.code !== 'ok' && response.data.error?.code) {
          throw new Error(response.data.error.message || 'TikTok API error');
        }

        const publishId = response.data.data?.publish_id;

        if (!publishId) {
          throw new Error('No publish_id returned from TikTok');
        }

        this.logger.log(`TikTok photo post initialized. Publish ID: ${publishId}`);

        return {
          success: true,
          publishId,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Failed to init TikTok post (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt;
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMessage = lastError.response?.data?.error?.message || lastError.message;
    throw new HttpException(
      `TikTok API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }

  /**
   * Получить статус публикации
   */
  async getPostStatus(
    accessToken: string,
    publishId: string,
  ): Promise<TiktokPostStatus> {
    try {
      this.logger.log(`Fetching TikTok post status for publish_id: ${publishId}`);

      const response = await this.axiosInstance.post(
        `${this.API_URL}/post/publish/status/fetch/`,
        {
          publish_id: publishId,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        },
      );

      const status = response.data.data?.status;
      const failReason = response.data.data?.fail_reason;
      const publiclyAvailablePostId = response.data.data?.publicly_available_post_id;

      this.logger.log(`TikTok post status: ${status}`);

      return {
        status,
        failReason,
        publiclyAvailablePostId,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to fetch TikTok post status: ${errorMessage}`);

      throw new HttpException(
        `TikTok API Error (status): ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * Полный процесс публикации с ожиданием завершения
   * Возвращает post_id когда публикация завершена
   */
  async publishPhoto(
    accessToken: string,
    openId: string,
    photoUrl: string,
    title: string,
    description: string,
  ): Promise<{ success: boolean; postId: string }> {
    // Шаг 1: Инициализация публикации
    const initResult = await this.initPhotoPost(
      accessToken,
      openId,
      [photoUrl],
      title,
      description,
    );

    // Шаг 2: Ожидание завершения обработки (polling)
    // TikTok рекомендует polling каждые 5-10 секунд
    // Reduced max wait time to prevent long-running connections
    const maxWaitTime = 60000; // 1 minute (reduced from 2 min)
    const pollInterval = 8000; // 8 seconds (increased to reduce requests)
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const status = await this.getPostStatus(accessToken, initResult.publishId);

      if (status.status === 'PUBLISH_COMPLETE') {
        const postId = status.publiclyAvailablePostId?.[0] || initResult.publishId;
        this.logger.log(`TikTok post published successfully. Post ID: ${postId}`);

        return {
          success: true,
          postId,
        };
      }

      if (status.status === 'FAILED') {
        throw new HttpException(
          `TikTok publish failed: ${status.failReason || 'Unknown error'}`,
          400,
        );
      }

      this.logger.log(`TikTok post still processing: ${status.status}`);
    }

    // Если истекло время ожидания, но публикация еще в процессе
    // Возвращаем publish_id - пост может быть опубликован позже
    this.logger.warn('TikTok post processing timeout, returning publish_id');
    return {
      success: true,
      postId: initResult.publishId,
    };
  }

  /**
   * Обновить access token используя refresh token
   * TikTok API требует x-www-form-urlencoded формат
   */
  async refreshAccessToken(
    clientKey: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    try {
      this.logger.log('Refreshing TikTok access token');

      // TikTok требует данные в формате URLSearchParams для x-www-form-urlencoded
      const formData = new URLSearchParams({
        client_key: clientKey.trim(),
        client_secret: clientSecret.trim(),
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await this.axiosInstance.post(
        `${this.API_URL}/oauth/token/`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data;

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      this.logger.log('TikTok access token refreshed successfully');

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error_description || error.message;
      this.logger.error(`Failed to refresh TikTok token: ${errorMessage}`);

      throw new HttpException(
        `TikTok Token Refresh Error: ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }
}
