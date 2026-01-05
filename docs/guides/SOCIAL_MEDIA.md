# Техническая спецификация: Автопубликация статей в социальные сети

## 📌 Обзор

Функциональность автоматической публикации статей в Instagram и Telegram при создании/редактировании статьи в CMS AIMAK.

---

## 🎯 Цели

1. **Автоматизация** - одним кликом публиковать статью в несколько соцсетей
2. **Шаблонизация** - автоматическое форматирование контента под требования платформы
3. **Надежность** - обработка ошибок и логирование всех операций
4. **Гибкость** - возможность выбора платформ для публикации

---

## 🏛️ Архитектура решения

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ArticleForm Component                                       │
│  ├─ Checkbox: "Автопубликация в соцсети"                    │
│  ├─ Platform Selectors: [Instagram] [Telegram]              │
│  └─ Preview Templates Button                                │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP POST /articles
                 │ {autoPublish: true, platforms: [...]}
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────┤
│  ArticlesController                                          │
│  └─ create() / update()                                      │
│                                                               │
│  ArticlesService                                             │
│  ├─ createArticle()                                          │
│  ├─ updateArticle()                                          │
│  └─ triggerAutoPublish() ──────────┐                        │
│                                      │                        │
│  ┌──────────────────────────────────▼──────────────────┐    │
│  │      SocialMediaService (NEW)                        │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  publishToAll(article, platforms[])                  │    │
│  │  ├─ generatePostContent(article, platform)           │    │
│  │  ├─ publishToTelegram(content)                       │    │
│  │  ├─ publishToInstagram(content)                      │    │
│  │  └─ logPublicationResult()                           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      TelegramService (NEW)                           │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  sendMessage(chatId, text)                           │    │
│  │  sendPhoto(chatId, photo, caption)                   │    │
│  │  formatPost(article) → TelegramPost                  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      InstagramService (NEW)                          │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  createMediaContainer(imageUrl, caption)             │    │
│  │  publishMedia(containerId)                           │    │
│  │  formatPost(article) → InstagramPost                 │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │      TemplatesService (NEW)                          │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  getTelegramTemplate(article) → string               │    │
│  │  getInstagramTemplate(article) → string              │    │
│  │  stripHtml(content) → plainText                      │    │
│  │  truncateText(text, maxLength) → truncated          │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ External API Calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐    ┌──────────────────────┐      │
│  │   Telegram Bot API    │    │  Instagram Graph API │      │
│  │  api.telegram.org     │    │  graph.facebook.com  │      │
│  └──────────────────────┘    └──────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                 │
                 │ Store Results
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL + Prisma)                  │
├─────────────────────────────────────────────────────────────┤
│  SocialMediaConfig                                           │
│  ├─ platform: enum (TELEGRAM, INSTAGRAM)                    │
│  ├─ apiKey / botToken                                        │
│  ├─ chatId / pageId                                          │
│  └─ enabled: boolean                                         │
│                                                               │
│  SocialMediaPublication                                      │
│  ├─ articleId → Article                                      │
│  ├─ platform: enum                                           │
│  ├─ status: enum (PENDING, SUCCESS, FAILED)                 │
│  ├─ externalId (post ID в соцсети)                          │
│  ├─ error: string?                                           │
│  └─ publishedAt: DateTime                                    │
│                                                               │
│  Article (UPDATED)                                           │
│  ├─ autoPublishEnabled: boolean                              │
│  └─ publications: SocialMediaPublication[]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Структура данных

### 1. Prisma Schema Changes

```prisma
// Новая модель для настроек соцсетей
model SocialMediaConfig {
  id        String   @id @default(cuid())
  platform  SocialMediaPlatform
  enabled   Boolean  @default(false)

  // Telegram
  botToken  String?  // Telegram Bot Token
  chatId    String?  // Telegram Chat ID или Channel username

  // Instagram
  accessToken String? // Instagram Graph API Access Token
  pageId      String? // Instagram Business Account ID

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([platform])
}

// Новая модель для логирования публикаций
model SocialMediaPublication {
  id         String   @id @default(cuid())
  articleId  String
  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  platform   SocialMediaPlatform
  status     PublicationStatus @default(PENDING)
  externalId String?  // ID поста в соцсети (message_id для Telegram, media_id для Instagram)
  error      String?  // Сообщение об ошибке, если status = FAILED

  publishedAt DateTime @default(now())
  createdAt   DateTime @default(now())

  @@index([articleId])
  @@index([platform])
}

// Обновление модели Article
model Article {
  // ... existing fields ...

  autoPublishEnabled Boolean @default(false)
  publications       SocialMediaPublication[]

  // ... existing fields ...
}

// Enum для платформ
enum SocialMediaPlatform {
  TELEGRAM
  INSTAGRAM
}

// Enum для статуса публикации
enum PublicationStatus {
  PENDING
  SUCCESS
  FAILED
}
```

### 2. DTOs

#### CreateArticleDto (UPDATED)
```typescript
export class CreateArticleDto {
  // ... existing fields ...

  // Новые поля
  autoPublishEnabled?: boolean;
  autoPublishPlatforms?: SocialMediaPlatform[]; // ['TELEGRAM', 'INSTAGRAM']
}
```

#### SocialMediaConfigDto
```typescript
export class UpdateSocialMediaConfigDto {
  platform: 'TELEGRAM' | 'INSTAGRAM';
  enabled: boolean;
  botToken?: string;
  chatId?: string;
  accessToken?: string;
  pageId?: string;
}
```

#### PublishToSocialMediaDto
```typescript
export class PublishToSocialMediaDto {
  articleId: string;
  platforms: SocialMediaPlatform[];
}
```

---

## 🔧 Реализация Backend

### 1. Telegram Integration

**Файл:** `apps/api/src/social-media/telegram.service.ts`

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly API_URL = 'https://api.telegram.org/bot';

  async sendMessage(
    botToken: string,
    chatId: string,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown';
      disable_web_page_preview?: boolean;
    }
  ) {
    try {
      const response = await axios.post(
        `${this.API_URL}${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: options?.parse_mode || 'HTML',
          disable_web_page_preview: options?.disable_web_page_preview || false,
        }
      );

      return {
        success: true,
        messageId: response.data.result.message_id,
      };
    } catch (error) {
      throw new HttpException(
        `Telegram API Error: ${error.response?.data?.description || error.message}`,
        error.response?.status || 500
      );
    }
  }

  async sendPhoto(
    botToken: string,
    chatId: string,
    photoUrl: string,
    caption?: string
  ) {
    try {
      const response = await axios.post(
        `${this.API_URL}${botToken}/sendPhoto`,
        {
          chat_id: chatId,
          photo: photoUrl,
          caption,
          parse_mode: 'HTML',
        }
      );

      return {
        success: true,
        messageId: response.data.result.message_id,
      };
    } catch (error) {
      throw new HttpException(
        `Telegram API Error: ${error.response?.data?.description || error.message}`,
        error.response?.status || 500
      );
    }
  }
}
```

**Шаблон для Telegram:**
```typescript
// apps/api/src/social-media/templates/telegram.template.ts
export function formatTelegramPost(article: Article, language: 'kz' | 'ru' = 'ru'): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;
  const url = `${process.env.FRONTEND_URL}/${language}/articles/${slug}`;

  let message = `📰 <b>${title}</b>\n\n`;

  if (excerpt) {
    message += `${excerpt}\n\n`;
  }

  // Добавляем категорию если есть
  if (article.category) {
    const categoryName = language === 'kz' ? article.category.nameKz : article.category.nameRu;
    message += `🏷 ${categoryName}\n\n`;
  }

  // Добавляем теги
  if (article.tags && article.tags.length > 0) {
    const tagNames = article.tags
      .map(tag => `#${(language === 'kz' ? tag.nameKz : tag.nameRu).replace(/\s+/g, '_')}`)
      .join(' ');
    message += `${tagNames}\n\n`;
  }

  message += `📖 <a href="${url}">Читать полностью</a>`;

  return message;
}
```

### 2. Instagram Integration

**Файл:** `apps/api/src/social-media/instagram.service.ts`

```typescript
import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class InstagramService {
  private readonly API_URL = 'https://graph.facebook.com/v18.0';

  async createMediaContainer(
    accessToken: string,
    pageId: string,
    imageUrl: string,
    caption: string
  ) {
    try {
      const response = await axios.post(
        `${this.API_URL}/${pageId}/media`,
        {
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }
      );

      return response.data.id; // creation_id
    } catch (error) {
      throw new HttpException(
        `Instagram API Error (create): ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || 500
      );
    }
  }

  async publishMedia(
    accessToken: string,
    pageId: string,
    creationId: string
  ) {
    try {
      const response = await axios.post(
        `${this.API_URL}/${pageId}/media_publish`,
        {
          creation_id: creationId,
          access_token: accessToken,
        }
      );

      return {
        success: true,
        mediaId: response.data.id,
      };
    } catch (error) {
      throw new HttpException(
        `Instagram API Error (publish): ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || 500
      );
    }
  }

  async publishPost(
    accessToken: string,
    pageId: string,
    imageUrl: string,
    caption: string
  ) {
    // Two-step process
    const creationId = await this.createMediaContainer(
      accessToken,
      pageId,
      imageUrl,
      caption
    );

    return await this.publishMedia(accessToken, pageId, creationId);
  }
}
```

**Шаблон для Instagram:**
```typescript
// apps/api/src/social-media/templates/instagram.template.ts
export function formatInstagramPost(article: Article, language: 'kz' | 'ru' = 'ru'): string {
  const title = language === 'kz' ? article.titleKz : article.titleRu;
  const excerpt = language === 'kz' ? article.excerptKz : article.excerptRu;
  const slug = language === 'kz' ? article.slugKz : article.slugRu;
  const url = `${process.env.FRONTEND_URL}/${language}/articles/${slug}`;

  let caption = `${title}\n\n`;

  if (excerpt) {
    // Instagram ограничивает до 2200 символов
    const truncatedExcerpt = excerpt.length > 150
      ? excerpt.substring(0, 150) + '...'
      : excerpt;
    caption += `${truncatedExcerpt}\n\n`;
  }

  // Добавляем ссылку
  caption += `🔗 Ссылка в bio или: ${url}\n\n`;

  // Добавляем хештеги (максимум 30)
  const hashtags: string[] = [];

  if (article.category) {
    const categoryName = language === 'kz' ? article.category.nameKz : article.category.nameRu;
    hashtags.push(`#${categoryName.replace(/\s+/g, '')}`);
  }

  if (article.tags && article.tags.length > 0) {
    article.tags.slice(0, 10).forEach(tag => {
      const tagName = language === 'kz' ? tag.nameKz : tag.nameRu;
      hashtags.push(`#${tagName.replace(/\s+/g, '')}`);
    });
  }

  // Базовые хештеги
  hashtags.push('#AIMAK', '#Сатпаев', '#Жаңалықтар', '#Новости');

  caption += hashtags.slice(0, 30).join(' ');

  return caption;
}
```

### 3. Social Media Service (Orchestrator)

**Файл:** `apps/api/src/social-media/social-media.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { InstagramService } from './instagram.service';
import { formatTelegramPost } from './templates/telegram.template';
import { formatInstagramPost } from './templates/instagram.template';
import { SocialMediaPlatform, PublicationStatus } from '@prisma/client';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
    private instagram: InstagramService,
  ) {}

  async publishArticle(
    articleId: string,
    platforms: SocialMediaPlatform[]
  ) {
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

    const results = [];

    for (const platform of platforms) {
      try {
        let result;

        if (platform === 'TELEGRAM') {
          result = await this.publishToTelegram(article);
        } else if (platform === 'INSTAGRAM') {
          result = await this.publishToInstagram(article);
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

        this.logger.log(`Successfully published to ${platform}: ${article.titleRu}`);
      } catch (error) {
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

        this.logger.error(`Failed to publish to ${platform}: ${error.message}`);
      }
    }

    return results;
  }

  private async publishToTelegram(article: any) {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: 'TELEGRAM' },
    });

    if (!config || !config.enabled) {
      throw new Error('Telegram is not configured or disabled');
    }

    const messageKz = formatTelegramPost(article, 'kz');
    const messageRu = formatTelegramPost(article, 'ru');

    let messageId: number;

    if (article.coverImage) {
      // Отправляем с фото
      const result = await this.telegram.sendPhoto(
        config.botToken,
        config.chatId,
        article.coverImage,
        messageRu, // Используем русский как основной
      );
      messageId = result.messageId;
    } else {
      // Отправляем только текст
      const result = await this.telegram.sendMessage(
        config.botToken,
        config.chatId,
        messageRu,
        { parse_mode: 'HTML' }
      );
      messageId = result.messageId;
    }

    return {
      externalId: messageId.toString(),
    };
  }

  private async publishToInstagram(article: any) {
    const config = await this.prisma.socialMediaConfig.findUnique({
      where: { platform: 'INSTAGRAM' },
    });

    if (!config || !config.enabled) {
      throw new Error('Instagram is not configured or disabled');
    }

    if (!article.coverImage) {
      throw new Error('Instagram requires cover image');
    }

    const caption = formatInstagramPost(article, 'ru');

    const result = await this.instagram.publishPost(
      config.accessToken,
      config.pageId,
      article.coverImage,
      caption
    );

    return {
      externalId: result.mediaId,
    };
  }

  async getConfig(platform: SocialMediaPlatform) {
    return this.prisma.socialMediaConfig.findUnique({
      where: { platform },
    });
  }

  async updateConfig(platform: SocialMediaPlatform, data: any) {
    return this.prisma.socialMediaConfig.upsert({
      where: { platform },
      create: { platform, ...data },
      update: data,
    });
  }

  async getPublications(articleId: string) {
    return this.prisma.socialMediaPublication.findMany({
      where: { articleId },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
```

---

## 🎨 Реализация Frontend

### 1. Обновление ArticleForm

**Файл:** `apps/web/src/components/article-form.tsx`

Добавить в форму:

```tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// В секции настроек (после allowComments)
<div className="space-y-4 border-t pt-4">
  <h3 className="text-lg font-medium">Автопубликация в соцсети</h3>

  <div className="flex items-center space-x-2">
    <Checkbox
      id="autoPublish"
      checked={form.watch('autoPublishEnabled')}
      onCheckedChange={(checked) => {
        form.setValue('autoPublishEnabled', !!checked);
      }}
    />
    <Label htmlFor="autoPublish" className="cursor-pointer">
      Автоматически публиковать в социальные сети
    </Label>
  </div>

  {form.watch('autoPublishEnabled') && (
    <div className="ml-6 space-y-2">
      <Label>Выберите платформы:</Label>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="telegram"
          checked={selectedPlatforms.includes('TELEGRAM')}
          onCheckedChange={(checked) => {
            setSelectedPlatforms(prev =>
              checked
                ? [...prev, 'TELEGRAM']
                : prev.filter(p => p !== 'TELEGRAM')
            );
          }}
        />
        <Label htmlFor="telegram" className="cursor-pointer flex items-center gap-2">
          <TelegramIcon className="w-4 h-4" />
          Telegram
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="instagram"
          checked={selectedPlatforms.includes('INSTAGRAM')}
          onCheckedChange={(checked) => {
            setSelectedPlatforms(prev =>
              checked
                ? [...prev, 'INSTAGRAM']
                : prev.filter(p => p !== 'INSTAGRAM')
            );
          }}
        />
        <Label htmlFor="instagram" className="cursor-pointer flex items-center gap-2">
          <InstagramIcon className="w-4 h-4" />
          Instagram
        </Label>
      </div>
    </div>
  )}
</div>
```

### 2. Страница настроек соцсетей

**Файл:** `apps/web/src/app/admin/settings/social-media/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSocialMediaConfig, useUpdateSocialMediaConfig } from '@/hooks/use-social-media';

export default function SocialMediaSettingsPage() {
  const [activeTab, setActiveTab] = useState<'telegram' | 'instagram'>('telegram');

  const { data: telegramConfig } = useSocialMediaConfig('TELEGRAM');
  const { data: instagramConfig } = useSocialMediaConfig('INSTAGRAM');
  const updateConfig = useUpdateSocialMediaConfig();

  // Telegram form
  const telegramForm = useForm({
    defaultValues: {
      enabled: telegramConfig?.enabled || false,
      botToken: telegramConfig?.botToken || '',
      chatId: telegramConfig?.chatId || '',
    },
  });

  // Instagram form
  const instagramForm = useForm({
    defaultValues: {
      enabled: instagramConfig?.enabled || false,
      accessToken: instagramConfig?.accessToken || '',
      pageId: instagramConfig?.pageId || '',
    },
  });

  const onSubmitTelegram = (data: any) => {
    updateConfig.mutate({
      platform: 'TELEGRAM',
      ...data,
    });
  };

  const onSubmitInstagram = (data: any) => {
    updateConfig.mutate({
      platform: 'INSTAGRAM',
      ...data,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Настройки социальных сетей</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            Telegram
          </h2>

          <form onSubmit={telegramForm.handleSubmit(onSubmitTelegram)} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="telegram-enabled">Включить публикацию</Label>
              <Switch
                id="telegram-enabled"
                checked={telegramForm.watch('enabled')}
                onCheckedChange={(checked) => telegramForm.setValue('enabled', checked)}
              />
            </div>

            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                {...telegramForm.register('botToken')}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Получить у @BotFather в Telegram
              </p>
            </div>

            <div>
              <Label htmlFor="chatId">Chat ID / Channel Username</Label>
              <Input
                id="chatId"
                placeholder="@yourchannel или -1001234567890"
                {...telegramForm.register('chatId')}
              />
              <p className="text-sm text-muted-foreground mt-1">
                ID чата или username канала
              </p>
            </div>

            <Button type="submit" disabled={updateConfig.isLoading}>
              Сохранить настройки Telegram
            </Button>
          </form>
        </Card>

        {/* Instagram Settings */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            Instagram
          </h2>

          <form onSubmit={instagramForm.handleSubmit(onSubmitInstagram)} className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="instagram-enabled">Включить публикацию</Label>
              <Switch
                id="instagram-enabled"
                checked={instagramForm.watch('enabled')}
                onCheckedChange={(checked) => instagramForm.setValue('enabled', checked)}
              />
            </div>

            <div>
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Instagram Graph API Access Token"
                {...instagramForm.register('accessToken')}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Получить через Meta for Developers
              </p>
            </div>

            <div>
              <Label htmlFor="pageId">Instagram Business Account ID</Label>
              <Input
                id="pageId"
                placeholder="1234567890"
                {...instagramForm.register('pageId')}
              />
            </div>

            <Button type="submit" disabled={updateConfig.isLoading}>
              Сохранить настройки Instagram
            </Button>
          </form>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="p-6 mt-6">
        <h3 className="text-xl font-semibold mb-4">Инструкции по настройке</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Telegram:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Создайте бота через @BotFather в Telegram</li>
              <li>Скопируйте Bot Token</li>
              <li>Добавьте бота в ваш канал как администратора</li>
              <li>Получите Chat ID канала (используйте @userinfobot)</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2">Instagram:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Создайте Facebook App на developers.facebook.com</li>
              <li>Подключите Instagram Business Account</li>
              <li>Получите долгосрочный Access Token</li>
              <li>Скопируйте Instagram Business Account ID</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

---

## 🔌 API Endpoints

### Новые endpoints

```typescript
// Social Media Config
GET    /social-media/config/:platform           # Получить конфиг платформы
PUT    /social-media/config/:platform           # Обновить конфиг платформы

// Publishing
POST   /social-media/publish                    # Опубликовать статью
  Body: { articleId: string, platforms: string[] }

// Publications History
GET    /social-media/publications/:articleId    # Получить историю публикаций статьи
```

---

## 🧪 Тестирование

### 1. Unit тесты

```typescript
// telegram.service.spec.ts
describe('TelegramService', () => {
  it('should send message successfully', async () => {
    // ...
  });

  it('should send photo with caption', async () => {
    // ...
  });

  it('should handle API errors', async () => {
    // ...
  });
});
```

### 2. E2E тесты

```typescript
describe('Social Media Auto-Publish (e2e)', () => {
  it('should publish article to Telegram when autoPublish is enabled', async () => {
    // ...
  });

  it('should publish article to Instagram when autoPublish is enabled', async () => {
    // ...
  });

  it('should log failed publications', async () => {
    // ...
  });
});
```

---

## 🔐 Безопасность

1. **Хранение токенов**: Все токены хранятся в БД в зашифрованном виде
2. **Валидация**: Проверка всех входящих данных через DTO
3. **Rate limiting**: Ограничение количества запросов к внешним API
4. **Error handling**: Graceful degradation при ошибках API

---

## 📝 Миграция БД

```bash
# Создание миграции
npx prisma migrate dev --name add_social_media_publishing

# Применение в продакшене
npx prisma migrate deploy
```

---

## 🚀 Deployment Checklist

- [ ] Создать Telegram бота и получить токен
- [ ] Создать Facebook App и настроить Instagram API
- [ ] Добавить переменные окружения
- [ ] Запустить миграции БД
- [ ] Настроить конфиг через админ-панель
- [ ] Протестировать публикацию на тестовых данных
- [ ] Мониторинг логов публикаций

---

## 📌 Переменные окружения

```env
# .env.local
FRONTEND_URL=https://aimak.kz

# Опционально (можно хранить в БД)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_PAGE_ID=
```

---

## 🎯 Roadmap (будущие улучшения)

1. **Отложенная публикация** - schedule публикации на определенное время
2. **Аналитика** - подсчет просмотров/лайков/репостов из соцсетей
3. **Превью** - предпросмотр поста перед публикацией
4. **Кастомные шаблоны** - возможность редактировать шаблоны постов
5. **Больше платформ** - Twitter/X, Facebook Pages, VK
6. **Webhook** - уведомления о комментариях/лайках из соцсетей
7. **AI генерация** - автоматическая генерация постов с помощью AI

---

## 📚 Документация API платформ

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api
- **Meta for Developers**: https://developers.facebook.com/
