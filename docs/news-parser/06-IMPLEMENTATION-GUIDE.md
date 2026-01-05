# Руководство по Реализации: Система Мониторинга Актуальных Тем

## Структура Модуля

```
apps/api/src/
└── news-parser/
    ├── news-parser.module.ts           # Главный модуль
    ├── news-parser.controller.ts       # API контроллер
    ├── news-parser.scheduler.ts        # Планировщик задач
    │
    ├── services/
    │   ├── news-parser.service.ts      # Основной сервис
    │   ├── topic-clustering.service.ts # Кластеризация тем
    │   ├── keyword-extractor.service.ts# Извлечение ключевых слов
    │   └── article-generator.service.ts# Создание черновиков
    │
    ├── parsers/
    │   ├── base.parser.ts              # Базовый класс
    │   ├── rss.parser.ts               # RSS парсер
    │   └── html.parser.ts              # HTML парсер
    │
    ├── dto/
    │   ├── create-source.dto.ts
    │   ├── update-source.dto.ts
    │   ├── topic-query.dto.ts
    │   └── create-article-from-topic.dto.ts
    │
    └── interfaces/
        ├── news-item.interface.ts
        ├── parse-config.interface.ts
        └── topic.interface.ts

apps/web/src/
└── app/admin/news-feed/
    ├── page.tsx                        # Список тем
    ├── latest/page.tsx                 # Лента новостей
    ├── topics/[id]/page.tsx            # Детали темы
    └── sources/page.tsx                # Управление источниками (admin)

apps/web/src/
├── components/
│   └── news-feed/
│       ├── topic-card.tsx
│       ├── topic-details.tsx
│       ├── news-item.tsx
│       ├── source-table.tsx
│       └── trend-badge.tsx
│
└── hooks/
    ├── use-hot-topics.ts
    ├── use-latest-news.ts
    ├── use-news-sources.ts
    └── use-create-article-from-topic.ts
```

---

## Этап 1: Модели Данных (День 1)

### Задачи

1. Добавить модели в `schema.prisma`
2. Создать миграцию
3. Добавить seed-данные для источников

### Команды

```bash
# Добавить модели из 02-DATABASE-SCHEMA.prisma в schema.prisma
# Затем:

cd apps/api
pnpm prisma migrate dev --name add_news_parser_models
pnpm prisma generate
```

### Seed-скрипт

```typescript
// apps/api/prisma/seeds/news-sources.seed.ts

import { PrismaClient } from '@prisma/client';
import sourcesConfig from '../../docs/news-parser/04-SOURCES-CONFIG.json';

const prisma = new PrismaClient();

async function seedNewsSources() {
  console.log('Seeding news sources...');

  for (const source of sourcesConfig.sources) {
    await prisma.newsSource.upsert({
      where: { slug: source.slug },
      update: {},
      create: {
        name: source.name,
        slug: source.slug,
        url: source.url,
        rssUrl: source.rssUrl || null,
        parserType: source.parserType as any,
        parseConfig: source.parseConfig || null,
        language: source.language as any,
        category: source.category,
        priority: source.priority,
        isActive: true,
      },
    });
    console.log(`  ✓ ${source.name}`);
  }

  // Создать настройки по умолчанию
  await prisma.newsParserSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isEnabled: true,
    },
  });

  console.log('News sources seeded!');
}

seedNewsSources();
```

---

## Этап 2: Парсеры (Дни 2-3)

### Базовый Парсер

```typescript
// apps/api/src/news-parser/parsers/base.parser.ts

import { NewsSource } from '@prisma/client';

export interface ParsedNewsItem {
  externalId: string;
  url: string;
  title: string;
  publishedAt: Date;
  language: string;
}

export abstract class BaseParser {
  protected source: NewsSource;
  protected userAgent: string;
  protected timeout: number;

  constructor(source: NewsSource, options?: { userAgent?: string; timeout?: number }) {
    this.source = source;
    this.userAgent = options?.userAgent || 'SmartCMS/1.0';
    this.timeout = options?.timeout || 10000;
  }

  abstract parse(): Promise<ParsedNewsItem[]>;

  protected detectLanguage(text: string): string {
    // Простое определение по наличию казахских букв
    const kazakh = /[әіңғүұқөһ]/i;
    return kazakh.test(text) ? 'kz' : 'ru';
  }

  protected resolveUrl(base: string, path: string): string {
    if (path.startsWith('http')) return path;
    const baseUrl = new URL(base);
    return new URL(path, baseUrl.origin).toString();
  }
}
```

### RSS Парсер

```typescript
// apps/api/src/news-parser/parsers/rss.parser.ts

import Parser from 'rss-parser';
import { BaseParser, ParsedNewsItem } from './base.parser';

export class RssParser extends BaseParser {
  private parser: Parser;

  constructor(source: any, options?: any) {
    super(source, options);
    this.parser = new Parser({
      timeout: this.timeout,
      headers: { 'User-Agent': this.userAgent },
    });
  }

  async parse(): Promise<ParsedNewsItem[]> {
    if (!this.source.rssUrl) {
      throw new Error(`RSS URL not configured for ${this.source.name}`);
    }

    const feed = await this.parser.parseURL(this.source.rssUrl);

    return feed.items.map((item) => ({
      externalId: item.guid || item.link || '',
      url: item.link || '',
      title: item.title?.trim() || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      language: this.detectLanguage(item.title || ''),
    }));
  }
}
```

### HTML Парсер

```typescript
// apps/api/src/news-parser/parsers/html.parser.ts

import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseParser, ParsedNewsItem } from './base.parser';
import { parse as parseDate } from 'date-fns';
import { ru, kk } from 'date-fns/locale';

interface ParseConfig {
  listUrl: string;
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  dateSelector?: string;
  dateFormat?: string;
}

export class HtmlParser extends BaseParser {
  private config: ParseConfig;

  constructor(source: any, options?: any) {
    super(source, options);
    this.config = source.parseConfig as ParseConfig;
  }

  async parse(): Promise<ParsedNewsItem[]> {
    if (!this.config) {
      throw new Error(`Parse config not configured for ${this.source.name}`);
    }

    const url = this.resolveUrl(this.source.url, this.config.listUrl);

    const { data } = await axios.get(url, {
      timeout: this.timeout,
      headers: { 'User-Agent': this.userAgent },
    });

    const $ = cheerio.load(data);
    const items: ParsedNewsItem[] = [];

    $(this.config.articleSelector).each((_, el) => {
      const $el = $(el);
      const linkEl = $el.find(this.config.linkSelector);
      const href = linkEl.attr('href');

      if (!href) return;

      const title = $el.find(this.config.titleSelector).text().trim();
      if (!title) return;

      const fullUrl = this.resolveUrl(this.source.url, href);

      let publishedAt = new Date();
      if (this.config.dateSelector && this.config.dateFormat) {
        const dateStr = $el.find(this.config.dateSelector).text().trim();
        try {
          publishedAt = parseDate(dateStr, this.config.dateFormat, new Date(), {
            locale: this.detectLanguage(title) === 'kz' ? kk : ru,
          });
        } catch (e) {
          // Используем текущую дату при ошибке
        }
      }

      items.push({
        externalId: fullUrl,
        url: fullUrl,
        title,
        publishedAt,
        language: this.detectLanguage(title),
      });
    });

    return items;
  }
}
```

---

## Этап 3: Основной Сервис (Дни 3-4)

```typescript
// apps/api/src/news-parser/services/news-parser.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RssParser } from '../parsers/rss.parser';
import { HtmlParser } from '../parsers/html.parser';
import { KeywordExtractorService } from './keyword-extractor.service';
import { NewsSource, ParserType, ParseStatus } from '@prisma/client';

@Injectable()
export class NewsParserService {
  private readonly logger = new Logger(NewsParserService.name);

  constructor(
    private prisma: PrismaService,
    private keywordExtractor: KeywordExtractorService,
  ) {}

  async parseSource(source: NewsSource): Promise<{
    status: ParseStatus;
    itemsCount: number;
    newItemsCount: number;
    durationMs: number;
  }> {
    const startTime = Date.now();
    let status: ParseStatus = ParseStatus.SUCCESS;
    let itemsCount = 0;
    let newItemsCount = 0;
    let error: string | null = null;

    try {
      // Выбираем парсер
      const parser =
        source.parserType === ParserType.RSS
          ? new RssParser(source)
          : new HtmlParser(source);

      // Парсим
      const items = await parser.parse();
      itemsCount = items.length;

      // Сохраняем новые элементы
      for (const item of items) {
        const existing = await this.prisma.newsItem.findUnique({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: item.externalId,
            },
          },
        });

        if (!existing) {
          // Извлекаем ключевые слова
          const keywords = this.keywordExtractor.extractFromTitle(item.title);

          await this.prisma.newsItem.create({
            data: {
              sourceId: source.id,
              externalId: item.externalId,
              url: item.url,
              title: item.title,
              publishedAt: item.publishedAt,
              language: item.language,
              keywords,
            },
          });
          newItemsCount++;
        }
      }
    } catch (e) {
      status = ParseStatus.ERROR;
      error = e.message;
      this.logger.error(`Error parsing ${source.name}: ${e.message}`);
    }

    const durationMs = Date.now() - startTime;

    // Обновляем источник
    await this.prisma.newsSource.update({
      where: { id: source.id },
      data: {
        lastParsedAt: new Date(),
        lastParseStatus: status,
        lastParseError: error,
        successCount: status === ParseStatus.SUCCESS
          ? { increment: 1 }
          : undefined,
        errorCount: status === ParseStatus.ERROR
          ? { increment: 1 }
          : { set: 0 },
      },
    });

    // Логируем
    await this.prisma.parseLog.create({
      data: {
        sourceId: source.id,
        status,
        itemsCount,
        newItemsCount,
        durationMs,
        error,
      },
    });

    return { status, itemsCount, newItemsCount, durationMs };
  }

  async parseAllByPriority(priority: number): Promise<void> {
    const sources = await this.prisma.newsSource.findMany({
      where: { isActive: true, priority },
    });

    this.logger.log(`Parsing ${sources.length} sources with priority ${priority}`);

    for (const source of sources) {
      await this.parseSource(source);
      // Задержка между запросами
      await this.delay(1000);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

---

## Этап 4: Кластеризация Тем (Дни 4-5)

```typescript
// apps/api/src/news-parser/services/topic-clustering.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TopicCategory } from '@prisma/client';

@Injectable()
export class TopicClusteringService {
  private readonly logger = new Logger(TopicClusteringService.name);

  constructor(private prisma: PrismaService) {}

  async clusterRecentNews(): Promise<void> {
    // Получаем необработанные новости за последние 24 часа
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const news = await this.prisma.newsItem.findMany({
      where: {
        publishedAt: { gte: cutoff },
        isProcessed: false,
      },
      orderBy: { publishedAt: 'desc' },
    });

    this.logger.log(`Clustering ${news.length} news items`);

    // Группируем по ключевым словам
    const clusters = this.groupByKeywords(news);

    // Создаём/обновляем темы
    for (const cluster of clusters) {
      if (cluster.items.length >= 3) {
        await this.createOrUpdateTopic(cluster);
      }
    }

    // Помечаем как обработанные
    await this.prisma.newsItem.updateMany({
      where: { id: { in: news.map((n) => n.id) } },
      data: { isProcessed: true },
    });

    // Обновляем тренд-скоры
    await this.updateTrendScores();
  }

  private groupByKeywords(news: any[]): { keywords: string[]; items: any[] }[] {
    const clusters: Map<string, any[]> = new Map();

    for (const item of news) {
      // Берём первые 3 ключевых слова как ключ кластера
      const keywordsKey = item.keywords.slice(0, 3).sort().join('|');

      if (!clusters.has(keywordsKey)) {
        clusters.set(keywordsKey, []);
      }
      clusters.get(keywordsKey)!.push(item);
    }

    return Array.from(clusters.entries()).map(([key, items]) => ({
      keywords: key.split('|'),
      items,
    }));
  }

  private async createOrUpdateTopic(cluster: { keywords: string[]; items: any[] }) {
    // Ищем существующую активную тему с похожими ключевыми словами
    const existing = await this.prisma.hotTopic.findFirst({
      where: {
        isActive: true,
        keywords: { hasSome: cluster.keywords },
      },
    });

    const sourcesCount = new Set(cluster.items.map((i) => i.sourceId)).size;

    if (existing) {
      // Обновляем существующую тему
      await this.prisma.hotTopic.update({
        where: { id: existing.id },
        data: {
          mentionsCount: { increment: cluster.items.length },
          sourcesCount: Math.max(existing.sourcesCount, sourcesCount),
          lastSeenAt: new Date(),
          keywords: [...new Set([...existing.keywords, ...cluster.keywords])].slice(0, 10),
        },
      });

      // Привязываем новости к теме
      await this.prisma.newsItem.updateMany({
        where: { id: { in: cluster.items.map((i) => i.id) } },
        data: { topicId: existing.id },
      });
    } else {
      // Создаём новую тему
      const titleKz = this.generateTitle(cluster.keywords, 'kz');
      const titleRu = this.generateTitle(cluster.keywords, 'ru');
      const category = this.detectCategory(cluster.keywords);

      const topic = await this.prisma.hotTopic.create({
        data: {
          titleKz,
          titleRu,
          keywords: cluster.keywords,
          category,
          mentionsCount: cluster.items.length,
          sourcesCount,
        },
      });

      // Привязываем новости к теме
      await this.prisma.newsItem.updateMany({
        where: { id: { in: cluster.items.map((i) => i.id) } },
        data: { topicId: topic.id },
      });

      this.logger.log(`Created new topic: ${titleRu}`);
    }
  }

  private generateTitle(keywords: string[], lang: string): string {
    // Простая генерация заголовка из ключевых слов
    // В будущем можно использовать AI
    return keywords
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(', ');
  }

  private detectCategory(keywords: string[]): TopicCategory {
    const categoryKeywords: Record<TopicCategory, string[]> = {
      POLITICS: ['президент', 'правительство', 'закон', 'депутат', 'акимат', 'мәжіліс'],
      ECONOMY: ['экономика', 'курс', 'доллар', 'тенге', 'банк', 'бизнес', 'инфляция'],
      SOCIETY: ['общество', 'образование', 'здоровье', 'пенсия', 'социальный'],
      SPORT: ['футбол', 'хоккей', 'спорт', 'олимпиада', 'чемпионат', 'матч'],
      CULTURE: ['культура', 'музей', 'театр', 'концерт', 'кино', 'искусство'],
      WORLD: ['россия', 'сша', 'китай', 'украина', 'европа', 'война'],
      TECH: ['технологии', 'интернет', 'digital', 'it', 'стартап', 'ai'],
      INCIDENTS: ['авария', 'пожар', 'дтп', 'погибли', 'убийство', 'чп'],
    };

    for (const [category, catKeywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((kw) => catKeywords.some((ck) => kw.includes(ck)))) {
        return category as TopicCategory;
      }
    }

    return TopicCategory.SOCIETY;
  }

  private async updateTrendScores(): Promise<void> {
    // Тренд = упоминаний за последний час / упоминаний за предыдущий час
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const topics = await this.prisma.hotTopic.findMany({
      where: { isActive: true },
      include: {
        newsItems: {
          where: { publishedAt: { gte: twoHoursAgo } },
        },
      },
    });

    for (const topic of topics) {
      const lastHour = topic.newsItems.filter(
        (n) => n.publishedAt >= oneHourAgo
      ).length;
      const prevHour = topic.newsItems.filter(
        (n) => n.publishedAt >= twoHoursAgo && n.publishedAt < oneHourAgo
      ).length;

      const trendScore = prevHour > 0 ? lastHour / prevHour : lastHour;

      await this.prisma.hotTopic.update({
        where: { id: topic.id },
        data: {
          trendScore,
          peakMentions: Math.max(topic.peakMentions, topic.mentionsCount),
          peakedAt: topic.mentionsCount > topic.peakMentions ? now : topic.peakedAt,
        },
      });
    }
  }
}
```

---

## Этап 5: Планировщик (День 5)

```typescript
// apps/api/src/news-parser/news-parser.scheduler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsParserService } from './services/news-parser.service';
import { TopicClusteringService } from './services/topic-clustering.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class NewsParserScheduler {
  private readonly logger = new Logger(NewsParserScheduler.name);

  constructor(
    private newsParser: NewsParserService,
    private topicClustering: TopicClusteringService,
    private prisma: PrismaService,
  ) {}

  // Каждые 15 минут - приоритет 1
  @Cron('*/15 * * * *')
  async parsePriority1() {
    const settings = await this.getSettings();
    if (!settings.isEnabled) return;

    this.logger.log('Starting priority 1 parsing...');
    await this.newsParser.parseAllByPriority(1);
  }

  // Каждые 30 минут - приоритет 2
  @Cron('*/30 * * * *')
  async parsePriority2() {
    const settings = await this.getSettings();
    if (!settings.isEnabled) return;

    this.logger.log('Starting priority 2 parsing...');
    await this.newsParser.parseAllByPriority(2);
  }

  // Каждый час - приоритет 3
  @Cron(CronExpression.EVERY_HOUR)
  async parsePriority3() {
    const settings = await this.getSettings();
    if (!settings.isEnabled) return;

    this.logger.log('Starting priority 3 parsing...');
    await this.newsParser.parseAllByPriority(3);
  }

  // Каждые 10 минут - кластеризация
  @Cron('*/10 * * * *')
  async clusterTopics() {
    const settings = await this.getSettings();
    if (!settings.isEnabled) return;

    this.logger.log('Starting topic clustering...');
    await this.topicClustering.clusterRecentNews();
  }

  // Каждый день в 3:00 - очистка старых данных
  @Cron('0 3 * * *')
  async cleanup() {
    const settings = await this.getSettings();
    const cutoff = new Date(
      Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000
    );

    this.logger.log(`Cleaning up data older than ${cutoff.toISOString()}`);

    // Удаляем старые новости
    await this.prisma.newsItem.deleteMany({
      where: { publishedAt: { lt: cutoff } },
    });

    // Архивируем старые темы
    await this.prisma.hotTopic.updateMany({
      where: {
        lastSeenAt: { lt: cutoff },
        isActive: true,
      },
      data: { isActive: false, isArchived: true },
    });

    // Удаляем старые логи
    await this.prisma.parseLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  }

  private async getSettings() {
    return this.prisma.newsParserSettings.findUnique({
      where: { id: 'default' },
    }) || { isEnabled: true, retentionDays: 7 };
  }
}
```

---

## Этап 6: Frontend (Дни 6-7)

### Хуки

```typescript
// apps/web/src/hooks/use-hot-topics.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useHotTopics(params?: {
  category?: string;
  period?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['hot-topics', params],
    queryFn: () => api.get('/news-feed/topics', { params }),
    refetchInterval: 5 * 60 * 1000, // Обновлять каждые 5 минут
  });
}

export function useTopicDetails(id: string) {
  return useQuery({
    queryKey: ['topic', id],
    queryFn: () => api.get(`/news-feed/topics/${id}`),
    enabled: !!id,
  });
}

export function useCreateArticleFromTopic() {
  return useMutation({
    mutationFn: ({ topicId, language }: { topicId: string; language: string }) =>
      api.post(`/news-feed/topics/${topicId}/create-article`, { language }),
  });
}
```

### Добавление в навигацию

```typescript
// apps/web/src/components/admin-nav.tsx

// Добавить в массив навигации:
{
  name: 'Лента новостей',
  nameKz: 'Жаңалықтар',
  href: '/admin/news-feed',
  icon: Flame, // из lucide-react
}
```

---

## Зависимости

### Backend

```bash
cd apps/api
pnpm add rss-parser cheerio @nestjs/schedule
pnpm add -D @types/cheerio
```

### Обновить app.module.ts

```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { NewsParserModule } from './news-parser/news-parser.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NewsParserModule,
    // ... остальные модули
  ],
})
export class AppModule {}
```

---

## Тестирование

```bash
# Запустить парсинг вручную
curl -X POST http://localhost:4000/api/news-feed/sources/SOURCE_ID/parse \
  -H "Authorization: Bearer TOKEN"

# Получить темы
curl http://localhost:4000/api/news-feed/topics \
  -H "Authorization: Bearer TOKEN"
```

---

## Чек-лист Готовности

- [ ] Модели добавлены в schema.prisma
- [ ] Миграция применена
- [ ] Источники добавлены через seed
- [ ] RSS-парсер работает
- [ ] HTML-парсер работает
- [ ] Кластеризация работает
- [ ] Планировщик запущен
- [ ] API эндпоинты работают
- [ ] Frontend страницы готовы
- [ ] Навигация обновлена
- [ ] Тесты написаны
