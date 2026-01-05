import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { SocialMediaPlatform, PublicationStatus } from '@/types';

// Types
export interface SocialMediaConfig {
  id: string;
  platform: SocialMediaPlatform;
  enabled: boolean;
  defaultLanguage?: string; // 'kz' или 'ru'
  // Telegram
  botToken?: string;
  chatId?: string;
  // Instagram
  accessToken?: string;
  pageId?: string;
  // Instagram Webhooks
  webhookVerifyToken?: string;
  webhookEnabled?: boolean;
  webhookAppSecret?: string;
  // TikTok
  tiktokClientKey?: string;
  tiktokClientSecret?: string;
  tiktokAccessToken?: string;
  tiktokRefreshToken?: string;
  tiktokOpenId?: string;
  // Facebook
  facebookAccessToken?: string;
  facebookPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialMediaPublication {
  id: string;
  articleId: string;
  platform: SocialMediaPlatform;
  status: PublicationStatus;
  externalId?: string;
  error?: string;
  publishedAt: string;
  createdAt: string;
}

export interface PublishToSocialMediaDto {
  articleId: string;
  platforms: SocialMediaPlatform[];
}

export interface UpdateSocialMediaConfigDto {
  platform: SocialMediaPlatform;
  enabled: boolean;
  defaultLanguage?: string; // 'kz' или 'ru'
  // Telegram
  botToken?: string;
  chatId?: string;
  // Instagram
  accessToken?: string;
  pageId?: string;
  // Instagram Webhooks
  webhookVerifyToken?: string;
  webhookEnabled?: boolean;
  webhookAppSecret?: string;
  // TikTok
  tiktokClientKey?: string;
  tiktokClientSecret?: string;
  tiktokAccessToken?: string;
  tiktokRefreshToken?: string;
  tiktokOpenId?: string;
  // Facebook
  facebookAccessToken?: string;
  facebookPageId?: string;
}

/**
 * Hook для получения конфигурации платформы
 */
export function useSocialMediaConfig(platform: SocialMediaPlatform) {
  return useQuery<SocialMediaConfig>({
    queryKey: ['social-media-config', platform],
    queryFn: async () => {
      const response = await api.get(`/social-media/config/${platform}`);
      return response.data;
    },
  });
}

/**
 * Hook для получения всех конфигураций
 */
export function useAllSocialMediaConfigs() {
  return useQuery<SocialMediaConfig[]>({
    queryKey: ['social-media-configs'],
    queryFn: async () => {
      const response = await api.get('/social-media/config');
      return response.data;
    },
  });
}

/**
 * Hook для обновления конфигурации платформы
 */
export function useUpdateSocialMediaConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateSocialMediaConfigDto) => {
      const response = await api.put(
        `/social-media/config/${dto.platform}`,
        dto,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['social-media-config', variables.platform],
      });
      queryClient.invalidateQueries({ queryKey: ['social-media-configs'] });
    },
  });
}

/**
 * Hook для публикации статьи в соцсети
 */
export function usePublishToSocialMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: PublishToSocialMediaDto) => {
      const response = await api.post('/social-media/publish', dto);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['social-media-publications', variables.articleId],
      });
    },
  });
}

/**
 * Hook для получения истории публикаций статьи
 */
export function useSocialMediaPublications(articleId: string) {
  return useQuery<SocialMediaPublication[]>({
    queryKey: ['social-media-publications', articleId],
    queryFn: async () => {
      const response = await api.get(
        `/social-media/publications/${articleId}`,
      );
      return response.data;
    },
    enabled: !!articleId,
  });
}

/**
 * Helper для генерации превью поста
 */
export function generatePostPreview(
  article: any,
  platform: SocialMediaPlatform,
  language: 'kz' | 'ru' = 'ru',
): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;
  const frontendUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://aimak.kz';
  const articleUrl = `${frontendUrl}/${language}/articles/${slug}`;

  if (platform === SocialMediaPlatform.TELEGRAM) {
    let message = `📰 <b>${title}</b>\n\n`;

    if (excerpt) {
      const cleanExcerpt = stripHtml(excerpt);
      message += `${cleanExcerpt}\n\n`;
    }

    if (article.category) {
      const categoryName =
        language === 'kz' ? article.category.nameKz : article.category.nameRu;
      message += `🏷 <i>${categoryName}</i>\n\n`;
    }

    if (article.tags && article.tags.length > 0) {
      const tagNames = article.tags
        .slice(0, 5)
        .map((tag: any) => {
          const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
          return `#${tagName.replace(/\s+/g, '_')}`;
        })
        .join(' ');
      message += `${tagNames}\n\n`;
    }

    if (article.isBreaking) {
      message += `🔥 <b>СРОЧНАЯ НОВОСТЬ</b>\n\n`;
    }

    message += `📖 <a href="${articleUrl}">Читать полностью</a>`;

    return message;
  } else if (platform === SocialMediaPlatform.INSTAGRAM) {
    let caption = `${title}\n\n`;

    if (excerpt) {
      const cleanExcerpt = stripHtml(excerpt);
      const truncatedExcerpt =
        cleanExcerpt.length > 150
          ? cleanExcerpt.substring(0, 150) + '...'
          : cleanExcerpt;
      caption += `${truncatedExcerpt}\n\n`;
    }

    caption += `🔗 Читайте полностью по ссылке в bio или:\n${articleUrl}\n\n`;

    const hashtags: string[] = [];

    if (article.category) {
      const categoryName =
        language === 'kz' ? article.category.nameKz : article.category.nameRu;
      hashtags.push(`#${categoryName.replace(/\s+/g, '')}`);
    }

    if (article.tags && article.tags.length > 0) {
      article.tags.slice(0, 10).forEach((tag: any) => {
        const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
        const cleanTag = tagName
          .replace(/\s+/g, '')
          .replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '');
        if (cleanTag) {
          hashtags.push(`#${cleanTag}`);
        }
      });
    }

    hashtags.push(
      '#AIMAK',
      '#Сатпаев',
      '#Satpaev',
      '#Жаңалықтар',
      '#Новости',
      '#Казахстан',
      '#Kazakhstan',
    );

    if (article.isBreaking) {
      hashtags.push('#СрочнаяНовость', '#Breaking');
    }

    caption += hashtags.slice(0, 30).join(' ');

    return caption;
  } else if (platform === SocialMediaPlatform.TIKTOK) {
    // TikTok description with hashtags
    let description = '';

    if (excerpt) {
      const cleanExcerpt = stripHtml(excerpt);
      const truncatedExcerpt =
        cleanExcerpt.length > 200
          ? cleanExcerpt.substring(0, 200) + '...'
          : cleanExcerpt;
      description += `${truncatedExcerpt}\n\n`;
    }

    description += `🔗 ${articleUrl}\n\n`;

    // Hashtags for TikTok (3-5 recommended)
    const hashtags: string[] = [];

    if (article.category) {
      const categoryName =
        language === 'kz' ? article.category.nameKz : article.category.nameRu;
      const cleanCategory = categoryName.replace(/\s+/g, '').replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '').toLowerCase();
      if (cleanCategory) {
        hashtags.push(`#${cleanCategory}`);
      }
    }

    if (article.tags && article.tags.length > 0) {
      article.tags.slice(0, 3).forEach((tag: any) => {
        const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
        const cleanTag = tagName.replace(/\s+/g, '').replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '').toLowerCase();
        if (cleanTag && !hashtags.includes(`#${cleanTag}`)) {
          hashtags.push(`#${cleanTag}`);
        }
      });
    }

    hashtags.push('#AIMAK', '#Сатпаев');
    if (language === 'kz') {
      hashtags.push('#жаналықтар');
    } else {
      hashtags.push('#новости');
    }
    hashtags.push('#Казахстан');

    if (article.isBreaking) {
      hashtags.unshift('#breaking');
      hashtags.unshift(language === 'kz' ? '#шұғыл' : '#срочно');
    }

    description += hashtags.slice(0, 5).join(' ');

    return description;
  } else if (platform === SocialMediaPlatform.FACEBOOK) {
    // Facebook post with link
    let message = '';

    if (article.isBreaking) {
      message += '🔴 ';
      message += language === 'kz' ? 'ШҰҒЫЛ ЖАҢАЛЫҚ\n\n' : 'СРОЧНАЯ НОВОСТЬ\n\n';
    }

    message += `📰 ${title}\n\n`;

    if (excerpt) {
      const cleanExcerpt = stripHtml(excerpt);
      const truncatedExcerpt =
        cleanExcerpt.length > 300
          ? cleanExcerpt.substring(0, 300) + '...'
          : cleanExcerpt;
      message += `${truncatedExcerpt}\n\n`;
    }

    if (article.category) {
      const categoryName =
        language === 'kz' ? article.category.nameKz : article.category.nameRu;
      message += `📁 ${categoryName}\n\n`;
    }

    const cta = language === 'kz'
      ? '👉 Толық мақаланы оқу үшін сілтемені басыңыз'
      : '👉 Нажмите на ссылку, чтобы прочитать полную статью';
    message += `${cta}\n\n`;

    message += `🔗 ${articleUrl}\n\n`;

    // Hashtags for Facebook (1-3 recommended)
    const hashtags: string[] = ['#AIMAK', '#Сатпаев'];

    if (article.category) {
      const categoryName =
        language === 'kz' ? article.category.nameKz : article.category.nameRu;
      const cleanCategory = categoryName.replace(/\s+/g, '').replace(/[^\wА-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g, '').toLowerCase();
      if (cleanCategory && !hashtags.some(h => h.toLowerCase() === `#${cleanCategory}`)) {
        hashtags.push(`#${cleanCategory}`);
      }
    }

    message += hashtags.slice(0, 3).join(' ');

    return message;
  }

  return '';
}

/**
 * Удаление HTML тегов
 */
function stripHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  } else {
    // Client-side
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}
