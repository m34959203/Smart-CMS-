import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { InstagramService } from './instagram.service';
import { TiktokService } from './tiktok.service';
import { FacebookService } from './facebook.service';
import { formatTelegramPost } from './templates/telegram.template';
import { formatInstagramPost } from './templates/instagram.template';
import { formatTiktokPost } from './templates/tiktok.template';
import { formatFacebookPost, formatFacebookPhotoCaption, getArticleUrl } from './templates/facebook.template';
import {
  SocialMediaPlatform,
  PublicationStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
    private instagram: InstagramService,
    private tiktok: TiktokService,
    private facebook: FacebookService,
  ) {}

  /**
   * Опубликовать статью в выбранные социальные сети
   */
  async publishArticle(articleId: string, platforms: SocialMediaPlatform[], skipDuplicateCheck = false) {
    this.logger.log(
      `Publishing article ${articleId} to platforms: ${platforms.join(', ')}`,
    );

    // Получаем статью с категорией и тегами
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: true,
        tags: true,
      },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    // Проверяем, какие платформы уже имеют успешные публикации
    let platformsToPublish = platforms;
    if (!skipDuplicateCheck) {
      const existingPublications = await this.prisma.socialMediaPublication.findMany({
        where: {
          articleId,
          platform: { in: platforms },
          status: PublicationStatus.SUCCESS,
        },
      });

      const alreadyPublishedPlatforms = existingPublications.map(p => p.platform);
      platformsToPublish = platforms.filter(p => !alreadyPublishedPlatforms.includes(p));

      if (alreadyPublishedPlatforms.length > 0) {
        this.logger.log(
          `Skipping already published platforms: ${alreadyPublishedPlatforms.join(', ')}`,
        );
      }

      if (platformsToPublish.length === 0) {
        this.logger.log('All platforms already have successful publications, skipping');
        return platforms.map(platform => ({
          platform,
          success: true,
          skipped: true,
          message: 'Already published',
        }));
      }
    }

    const results = [];

    // Публикуем в каждую платформу (только те, которые ещё не были опубликованы)
    for (const platform of platformsToPublish) {
      try {
        let result: { externalId: string } | undefined;

        if (platform === SocialMediaPlatform.TELEGRAM) {
          result = await this.publishToTelegram(article);
        } else if (platform === SocialMediaPlatform.INSTAGRAM) {
          result = await this.publishToInstagram(article);
        } else if (platform === SocialMediaPlatform.TIKTOK) {
          result = await this.publishToTiktok(article);
        } else if (platform === SocialMediaPlatform.FACEBOOK) {
          result = await this.publishToFacebook(article);
        }

        if (!result) {
          throw new Error(`Unsupported platform: ${platform}`);
        }

        // Логируем успешную публикацию
        await this.prisma.socialMediaPublication.create({
          data: {
            articleId: article.id,
            platform,
            status: PublicationStatus.SUCCESS,
            externalId: result.externalId,
          },
        });

        results.push({
          platform,
          success: true,
          externalId: result.externalId,
        });

        this.logger.log(
          `Successfully published to ${platform}: ${article.titleRu}`,
        );
      } catch (error: any) {
        // Логируем ошибку
        await this.prisma.socialMediaPublication.create({
          data: {
            articleId: article.id,
            platform,
            status: PublicationStatus.FAILED,
            error: error.message,
          },
        });

        results.push({
          platform,
          success: false,
          error: error.message,
        });

        this.logger.error(
          `Failed to publish to ${platform}: ${error.message}`,
        );
      }
    }

    return results;
  }

  /**
   * Публикация в Telegram
   */
  private async publishToTelegram(article: any) {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.TELEGRAM },
    });

    if (!config || !config.enabled) {
      throw new Error('Telegram is not configured or disabled');
    }

    if (!config.botToken || !config.chatId) {
      throw new Error('Telegram bot token or chat ID is missing');
    }

    // Форматируем пост на выбранном языке (по умолчанию казахский)
    const language = (config.defaultLanguage || 'kz') as 'kz' | 'ru';
    const message = formatTelegramPost(article, language);

    let messageId: number;

    // Если есть обложка, отправляем с фото
    if (article.coverImage) {
      try {
        this.logger.log(`Attempting to send photo: ${article.coverImage}`);
        const result = await this.telegram.sendPhoto(
          config.botToken,
          config.chatId,
          article.coverImage,
          message,
        );
        messageId = result.messageId;
      } catch (error: any) {
        // Fallback: если фото не отправилось, отправляем только текст
        this.logger.warn(
          `Failed to send photo (${error.message}), falling back to text message`,
        );
        const result = await this.telegram.sendMessage(
          config.botToken,
          config.chatId,
          message,
          { parse_mode: 'HTML' },
        );
        messageId = result.messageId;
      }
    } else {
      // Отправляем только текст
      const result = await this.telegram.sendMessage(
        config.botToken,
        config.chatId,
        message,
        { parse_mode: 'HTML' },
      );
      messageId = result.messageId;
    }

    return {
      externalId: messageId.toString(),
    };
  }

  /**
   * Публикация в Instagram
   * Если статья содержит видео - публикуем как Reels
   * Иначе публикуем как обычный пост с изображением
   */
  private async publishToInstagram(article: any) {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.INSTAGRAM },
    });

    if (!config || !config.enabled) {
      throw new Error('Instagram is not configured or disabled');
    }

    if (!config.accessToken || !config.pageId) {
      throw new Error('Instagram access token or page ID is missing');
    }

    // Форматируем caption на выбранном языке (по умолчанию казахский)
    const language = (config.defaultLanguage || 'kz') as 'kz' | 'ru';
    const caption = formatInstagramPost(article, language);

    // Проверяем, есть ли видео в статье
    const videoUrl = article.videoUrl || article.video;

    if (videoUrl) {
      // Публикуем как Reels (видео)
      this.logger.log(`Publishing article as Instagram Reels (video found)`);
      const result = await this.instagram.publishReels(
        config.accessToken,
        config.pageId,
        videoUrl,
        caption,
      );
      return {
        externalId: result.mediaId,
      };
    }

    // Instagram требует обложку для обычного поста
    if (!article.coverImage) {
      throw new Error('Instagram requires cover image or video');
    }

    // Публикуем как обычный пост с изображением
    const result = await this.instagram.publishPost(
      config.accessToken,
      config.pageId,
      article.coverImage,
      caption,
    );

    return {
      externalId: result.mediaId,
    };
  }

  /**
   * Публикация в TikTok
   */
  private async publishToTiktok(article: any) {
    let config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.TIKTOK },
    });

    if (!config || !config.enabled) {
      throw new Error('TikTok is not configured or disabled');
    }

    if (!config.tiktokAccessToken || !config.tiktokOpenId) {
      throw new Error('TikTok access token or open ID is missing. Please authorize with TikTok first.');
    }

    // TikTok требует изображение для фото-поста
    if (!article.coverImage) {
      throw new Error('TikTok requires cover image for photo posts');
    }

    // Skip token refresh on every publish - it causes unnecessary API calls
    // Token refresh should be handled by the refresh-token endpoint when needed
    // Only log a warning if we suspect the token might be expired
    this.logger.log('Using existing TikTok access token for publishing');

    // Форматируем пост на выбранном языке
    const language = (config.defaultLanguage || 'kz') as 'kz' | 'ru';
    const { title, description } = formatTiktokPost(article, language);

    // Публикуем фото-пост
    const result = await this.tiktok.publishPhoto(
      config.tiktokAccessToken!,
      config.tiktokOpenId!,
      article.coverImage,
      title,
      description,
    );

    return {
      externalId: result.postId,
    };
  }

  /**
   * Публикация в Facebook
   */
  private async publishToFacebook(article: any) {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: SocialMediaPlatform.FACEBOOK },
    });

    if (!config || !config.enabled) {
      throw new Error('Facebook is not configured or disabled');
    }

    if (!config.facebookAccessToken || !config.facebookPageId) {
      throw new Error('Facebook access token or page ID is missing');
    }

    // Форматируем пост на выбранном языке
    const language = (config.defaultLanguage || 'kz') as 'kz' | 'ru';
    const articleUrl = getArticleUrl(article, language);

    let postId: string;

    // Если есть обложка, публикуем фото с caption
    if (article.coverImage) {
      const caption = formatFacebookPhotoCaption(article, language);
      const result = await this.facebook.publishPhotoPost(
        config.facebookAccessToken,
        config.facebookPageId,
        article.coverImage,
        caption,
      );
      postId = result.postId;
    } else {
      // Публикуем текст со ссылкой
      const message = formatFacebookPost(article, language);
      const result = await this.facebook.publishLinkPost(
        config.facebookAccessToken,
        config.facebookPageId,
        articleUrl,
        message,
      );
      postId = result.postId;
    }

    return {
      externalId: postId,
    };
  }

  /**
   * Получить конфигурацию платформы
   */
  async getConfig(platform: SocialMediaPlatform) {
    return this.prisma.socialMediaConfig.findUnique({
      where: { platform },
    });
  }

  /**
   * Обновить конфигурацию платформы
   */
  async updateConfig(
    platform: SocialMediaPlatform,
    data: Prisma.SocialMediaConfigUpdateInput,
  ) {
    return this.prisma.socialMediaConfig.upsert({
      where: { platform },
      create: {
        platform,
        ...data,
      } as Prisma.SocialMediaConfigCreateInput,
      update: data,
    });
  }

  /**
   * Получить историю публикаций статьи
   */
  async getPublications(articleId: string) {
    return this.prisma.socialMediaPublication.findMany({
      where: { articleId },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Получить все конфигурации
   */
  async getAllConfigs() {
    return this.prisma.socialMediaConfig.findMany();
  }
}
