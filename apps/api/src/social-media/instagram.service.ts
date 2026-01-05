import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);
  // Instagram tokens (IG...) use graph.instagram.com
  // Facebook Page tokens (EAA...) use graph.facebook.com
  private readonly INSTAGRAM_API_URL = 'https://graph.instagram.com';
  private readonly FACEBOOK_API_URL = 'https://graph.facebook.com/v21.0';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [2000, 4000, 8000]; // Exponential backoff: 2s, 4s, 8s
  private readonly CONTAINER_CHECK_INTERVAL = 3000; // Check every 3 seconds
  private readonly CONTAINER_CHECK_MAX_ATTEMPTS = 20; // Max 60 seconds wait

  /**
   * Кодирует URL для Instagram API
   * Facebook не может скачать файлы с кириллическими символами в URL
   */
  private encodeImageUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      // Кодируем только путь (pathname), сохраняя протокол и домен
      const encodedPathname = url.pathname
        .split('/')
        .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
        .join('/');
      return `${url.protocol}//${url.host}${encodedPathname}${url.search}`;
    } catch {
      // Если URL невалидный, возвращаем как есть
      return imageUrl;
    }
  }

  /**
   * Определяет правильный API URL на основе типа токена
   */
  private getApiUrl(accessToken: string): string {
    // Instagram tokens start with "IG", Facebook tokens start with "EAA"
    if (accessToken?.startsWith('IG')) {
      return this.INSTAGRAM_API_URL;
    }
    return this.FACEBOOK_API_URL;
  }

  /**
   * Проверяет, является ли ошибка транзиентной (временной)
   */
  private isTransientError(error: any): boolean {
    const errorData = error.response?.data?.error;
    // Instagram API returns is_transient: true for temporary errors
    // Code 2 is a common transient error code
    return errorData?.is_transient === true || errorData?.code === 2;
  }

  /**
   * Выполняет запрос с повторными попытками для транзиентных ошибок
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Only retry for transient errors
        if (!this.isTransientError(error)) {
          throw error;
        }

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS[attempt];
          this.logger.warn(
            `${operationName}: Transient error (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}). Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Проверить статус медиа-контейнера
   * Статусы: IN_PROGRESS, FINISHED, ERROR, EXPIRED
   */
  private async checkContainerStatus(
    accessToken: string,
    containerId: string,
  ): Promise<{ status: string; errorMessage?: string }> {
    const apiUrl = this.getApiUrl(accessToken);

    try {
      const response = await axios.get(`${apiUrl}/${containerId}`, {
        params: {
          fields: 'status_code,status',
          access_token: accessToken,
        },
      });

      return {
        status: response.data.status_code || response.data.status || 'UNKNOWN',
        errorMessage: response.data.status,
      };
    } catch (error: any) {
      this.logger.error(`Failed to check container status: ${error.message}`);
      return { status: 'ERROR', errorMessage: error.message };
    }
  }

  /**
   * Ожидать готовности контейнера (статус FINISHED)
   */
  private async waitForContainerReady(
    accessToken: string,
    containerId: string,
  ): Promise<void> {
    this.logger.log(`Waiting for container ${containerId} to be ready...`);

    for (let attempt = 0; attempt < this.CONTAINER_CHECK_MAX_ATTEMPTS; attempt++) {
      const { status, errorMessage } = await this.checkContainerStatus(
        accessToken,
        containerId,
      );

      this.logger.log(`Container status (attempt ${attempt + 1}): ${status}`);

      if (status === 'FINISHED') {
        this.logger.log(`Container ${containerId} is ready for publishing`);
        return;
      }

      if (status === 'ERROR' || status === 'EXPIRED') {
        throw new Error(
          `Container failed with status: ${status}. ${errorMessage || ''}`,
        );
      }

      if (status === 'IN_PROGRESS') {
        await new Promise((resolve) =>
          setTimeout(resolve, this.CONTAINER_CHECK_INTERVAL),
        );
        continue;
      }

      // Unknown status, wait and retry
      await new Promise((resolve) =>
        setTimeout(resolve, this.CONTAINER_CHECK_INTERVAL),
      );
    }

    throw new Error(
      `Container ${containerId} did not become ready within ${(this.CONTAINER_CHECK_MAX_ATTEMPTS * this.CONTAINER_CHECK_INTERVAL) / 1000} seconds`,
    );
  }

  /**
   * Создать медиа-контейнер (шаг 1 публикации)
   */
  async createMediaContainer(
    accessToken: string,
    pageId: string,
    imageUrl: string,
    caption: string,
  ): Promise<string> {
    try {
      // Debug logging
      this.logger.log(`=== Instagram Publishing Debug ===`);
      this.logger.log(`Page ID: ${pageId}`);
      this.logger.log(`Image URL: ${imageUrl}`);
      this.logger.log(`Token exists: ${!!accessToken}`);
      this.logger.log(`Token length: ${accessToken?.length || 0}`);
      this.logger.log(`Token start: ${accessToken?.substring(0, 20)}...`);
      this.logger.log(`Caption length: ${caption?.length || 0}`);

      if (!accessToken || accessToken.length < 50) {
        throw new Error(`Invalid access token: token is ${!accessToken ? 'empty' : 'too short'} (length: ${accessToken?.length || 0})`);
      }

      if (!pageId) {
        throw new Error('Instagram Business Account ID (pageId) is required');
      }

      if (!imageUrl) {
        throw new Error('Image URL is required for Instagram posts');
      }

      const apiUrl = this.getApiUrl(accessToken);
      this.logger.log(`Creating Instagram media container for page ${pageId}`);
      this.logger.log(`Using API URL: ${apiUrl}`);

      // Кодируем URL для поддержки кириллических символов в именах файлов
      const encodedImageUrl = this.encodeImageUrl(imageUrl);
      this.logger.log(`Encoded Image URL: ${encodedImageUrl}`);

      const response = await this.withRetry(
        () =>
          axios.post(`${apiUrl}/${pageId}/media`, null, {
            params: {
              image_url: encodedImageUrl,
              caption,
              access_token: accessToken,
            },
          }),
        'createMediaContainer',
      );

      const creationId = response.data.id;
      this.logger.log(`Media container created: ${creationId}`);

      return creationId;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code;
      const errorType = error.response?.data?.error?.type;

      this.logger.error(`Failed to create Instagram media container:`);
      this.logger.error(`  Error message: ${errorMessage}`);
      this.logger.error(`  Error code: ${errorCode}`);
      this.logger.error(`  Error type: ${errorType}`);
      this.logger.error(`  Full error: ${JSON.stringify(error.response?.data || error.message)}`);

      throw new HttpException(
        `Instagram API Error (create): ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * Опубликовать медиа-контейнер (шаг 2 публикации)
   */
  async publishMedia(
    accessToken: string,
    pageId: string,
    creationId: string,
  ): Promise<{ success: boolean; mediaId: string }> {
    try {
      const apiUrl = this.getApiUrl(accessToken);
      this.logger.log(`Publishing Instagram media container: ${creationId}`);
      this.logger.log(`Using API URL: ${apiUrl}`);

      const response = await this.withRetry(
        () =>
          axios.post(`${apiUrl}/${pageId}/media_publish`, null, {
            params: {
              creation_id: creationId,
              access_token: accessToken,
            },
          }),
        'publishMedia',
      );

      const mediaId = response.data.id;
      this.logger.log(`Media published successfully: ${mediaId}`);

      return {
        success: true,
        mediaId,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to publish Instagram media: ${errorMessage}`);

      throw new HttpException(
        `Instagram API Error (publish): ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * Полный процесс публикации поста (создание + ожидание + публикация)
   * Как в n8n: сначала создаём контейнер, ждём готовности, потом публикуем
   */
  async publishPost(
    accessToken: string,
    pageId: string,
    imageUrl: string,
    caption: string,
  ): Promise<{ success: boolean; mediaId: string }> {
    // Шаг 1: Создать медиа-контейнер
    this.logger.log('Step 1: Creating media container...');
    const creationId = await this.createMediaContainer(
      accessToken,
      pageId,
      imageUrl,
      caption,
    );

    // Шаг 2: Ожидать готовности контейнера (статус FINISHED)
    this.logger.log('Step 2: Waiting for container to be ready...');
    await this.waitForContainerReady(accessToken, creationId);

    // Шаг 3: Опубликовать контейнер
    this.logger.log('Step 3: Publishing media...');
    return await this.publishMedia(accessToken, pageId, creationId);
  }

  /**
   * Создать Reels контейнер (для видео)
   */
  async createReelsContainer(
    accessToken: string,
    pageId: string,
    videoUrl: string,
    caption: string,
  ): Promise<string> {
    try {
      this.logger.log(`=== Instagram Reels Publishing Debug ===`);
      this.logger.log(`Page ID: ${pageId}`);
      this.logger.log(`Video URL: ${videoUrl}`);

      if (!accessToken || accessToken.length < 50) {
        throw new Error('Invalid access token');
      }

      if (!pageId) {
        throw new Error('Instagram Business Account ID (pageId) is required');
      }

      if (!videoUrl) {
        throw new Error('Video URL is required for Instagram Reels');
      }

      const apiUrl = this.getApiUrl(accessToken);
      const encodedVideoUrl = this.encodeImageUrl(videoUrl);

      this.logger.log(`Creating Instagram Reels container for page ${pageId}`);
      this.logger.log(`Using API URL: ${apiUrl}`);
      this.logger.log(`Encoded Video URL: ${encodedVideoUrl}`);

      const response = await this.withRetry(
        () =>
          axios.post(`${apiUrl}/${pageId}/media`, null, {
            params: {
              media_type: 'REELS',
              video_url: encodedVideoUrl,
              caption,
              share_to_feed: true,
              access_token: accessToken,
            },
          }),
        'createReelsContainer',
      );

      const creationId = response.data.id;
      this.logger.log(`Reels container created: ${creationId}`);

      return creationId;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to create Instagram Reels container: ${errorMessage}`);
      this.logger.error(`Full error: ${JSON.stringify(error.response?.data || error.message)}`);

      throw new HttpException(
        `Instagram API Error (reels create): ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * Полный процесс публикации Reels (создание + ожидание + публикация)
   */
  async publishReels(
    accessToken: string,
    pageId: string,
    videoUrl: string,
    caption: string,
  ): Promise<{ success: boolean; mediaId: string }> {
    // Шаг 1: Создать Reels контейнер
    this.logger.log('Reels Step 1: Creating Reels container...');
    const creationId = await this.createReelsContainer(
      accessToken,
      pageId,
      videoUrl,
      caption,
    );

    // Шаг 2: Ожидать готовности контейнера (видео обрабатывается дольше)
    this.logger.log('Reels Step 2: Waiting for container to be ready (video processing)...');
    await this.waitForContainerReady(accessToken, creationId);

    // Шаг 3: Опубликовать контейнер
    this.logger.log('Reels Step 3: Publishing Reels...');
    return await this.publishMedia(accessToken, pageId, creationId);
  }
}
