import { Injectable, HttpException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

export interface FacebookPostResult {
  success: boolean;
  postId: string;
}

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);
  private readonly API_URL = 'https://graph.facebook.com/v21.0';
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 60000,
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        maxSockets: 50,
        maxFreeSockets: 10,
        rejectUnauthorized: true,
        family: 4,
      }),
    });
  }

  /**
   * Опубликовать текстовый пост на Facebook Page
   */
  async publishTextPost(
    accessToken: string,
    pageId: string,
    message: string,
    link?: string,
  ): Promise<FacebookPostResult> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Publishing text post to Facebook page ${pageId} (attempt ${attempt}/${maxRetries})`);

        const params: any = {
          access_token: accessToken,
          message,
        };

        if (link) {
          params.link = link;
        }

        const response = await this.axiosInstance.post(
          `${this.API_URL}/${pageId}/feed`,
          null,
          { params },
        );

        const postId = response.data.id;
        this.logger.log(`Facebook text post published successfully. Post ID: ${postId}`);

        return {
          success: true,
          postId,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Failed to publish Facebook text post (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt;
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMessage = lastError.response?.data?.error?.message || lastError.message;
    throw new HttpException(
      `Facebook API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }

  /**
   * Опубликовать фото с подписью на Facebook Page
   */
  async publishPhotoPost(
    accessToken: string,
    pageId: string,
    photoUrl: string,
    caption: string,
  ): Promise<FacebookPostResult> {
    const maxRetries = 2;
    let lastError: any;

    // URL-encode для кириллических символов
    const encodedPhotoUrl = encodeURI(photoUrl);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Publishing photo post to Facebook page ${pageId} (attempt ${attempt}/${maxRetries})`);
        this.logger.debug(`Photo URL: ${encodedPhotoUrl}`);

        const response = await this.axiosInstance.post(
          `${this.API_URL}/${pageId}/photos`,
          null,
          {
            params: {
              access_token: accessToken,
              url: encodedPhotoUrl,
              caption,
              published: true,
            },
          },
        );

        const postId = response.data.post_id || response.data.id;
        this.logger.log(`Facebook photo post published successfully. Post ID: ${postId}`);

        return {
          success: true,
          postId,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Failed to publish Facebook photo post (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        if (attempt < maxRetries) {
          const delayMs = 3000;
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMessage = lastError.response?.data?.error?.message || lastError.message;
    throw new HttpException(
      `Facebook API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }

  /**
   * Опубликовать пост со ссылкой и превью на Facebook Page
   */
  async publishLinkPost(
    accessToken: string,
    pageId: string,
    link: string,
    message?: string,
  ): Promise<FacebookPostResult> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`Publishing link post to Facebook page ${pageId} (attempt ${attempt}/${maxRetries})`);

        const params: any = {
          access_token: accessToken,
          link,
        };

        if (message) {
          params.message = message;
        }

        const response = await this.axiosInstance.post(
          `${this.API_URL}/${pageId}/feed`,
          null,
          { params },
        );

        const postId = response.data.id;
        this.logger.log(`Facebook link post published successfully. Post ID: ${postId}`);

        return {
          success: true,
          postId,
        };
      } catch (error: any) {
        lastError = error;
        const errorMessage = error.response?.data?.error?.message || error.message;
        this.logger.error(`Failed to publish Facebook link post (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        if (attempt < maxRetries) {
          const delayMs = 2000 * attempt;
          this.logger.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const errorMessage = lastError.response?.data?.error?.message || lastError.message;
    throw new HttpException(
      `Facebook API Error: ${errorMessage}`,
      lastError.response?.status || 500,
    );
  }

  /**
   * Полный процесс публикации поста
   * Если есть изображение - публикует фото, иначе - ссылку с текстом
   */
  async publishPost(
    accessToken: string,
    pageId: string,
    message: string,
    link?: string,
    photoUrl?: string,
  ): Promise<FacebookPostResult> {
    if (photoUrl) {
      // Публикуем фото с caption
      return this.publishPhotoPost(accessToken, pageId, photoUrl, message);
    } else if (link) {
      // Публикуем ссылку с сообщением
      return this.publishLinkPost(accessToken, pageId, link, message);
    } else {
      // Публикуем просто текст
      return this.publishTextPost(accessToken, pageId, message);
    }
  }

  /**
   * Получить информацию о странице (для проверки токена)
   */
  async getPageInfo(
    accessToken: string,
    pageId: string,
  ): Promise<{ id: string; name: string; followers: number }> {
    try {
      this.logger.log(`Fetching Facebook page info for page ${pageId}`);

      const response = await this.axiosInstance.get(
        `${this.API_URL}/${pageId}`,
        {
          params: {
            access_token: accessToken,
            fields: 'id,name,followers_count',
          },
        },
      );

      return {
        id: response.data.id,
        name: response.data.name,
        followers: response.data.followers_count || 0,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to fetch Facebook page info: ${errorMessage}`);

      throw new HttpException(
        `Facebook API Error: ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }

  /**
   * Получить долгосрочный токен страницы
   */
  async exchangeForLongLivedToken(
    appId: string,
    appSecret: string,
    shortLivedToken: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      this.logger.log('Exchanging for long-lived Facebook token');

      const response = await this.axiosInstance.get(
        `${this.API_URL}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: appId,
            client_secret: appSecret,
            fb_exchange_token: shortLivedToken,
          },
        },
      );

      this.logger.log('Facebook long-lived token obtained successfully');

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in || 5184000, // По умолчанию ~60 дней
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`Failed to exchange Facebook token: ${errorMessage}`);

      throw new HttpException(
        `Facebook Token Exchange Error: ${errorMessage}`,
        error.response?.status || 500,
      );
    }
  }
}
