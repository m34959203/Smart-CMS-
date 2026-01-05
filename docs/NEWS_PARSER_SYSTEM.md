# Система Мониторинга Актуальных Тем

> Автоматический сбор и анализ новостей для редакции — система показывает, о чём писать сегодня.

---

## Концепция

```
┌─────────────────────────────────────────────────────────────────┐
│                    ПАНЕЛЬ РЕДАКТОРА                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔥 ГОРЯЧИЕ ТЕМЫ СЕГОДНЯ                          Обновлено: 5 мин │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  1. 🏛️ Послание Президента народу Казахстана                    │
│     📊 Упоминаний: 47  │  Источников: 12  │  Тренд: ↑↑↑         │
│     [Создать статью] [Подробнее]                                │
│                                                                  │
│  2. ⚽ Сборная Казахстана вышла в плей-офф                       │
│     📊 Упоминаний: 32  │  Источников: 8   │  Тренд: ↑↑          │
│     [Создать статью] [Подробнее]                                │
│                                                                  │
│  3. 🌡️ Похолодание до -30° в северных регионах                  │
│     📊 Упоминаний: 28  │  Источников: 6   │  Тренд: ↑           │
│     [Создать статью] [Подробнее]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Источники Данных

### Новостные Сайты Казахстана

| Источник | Язык | Тип | Приоритет |
|----------|------|-----|-----------|
| Tengrinews.kz | KZ/RU | Общие новости | ⭐⭐⭐ |
| Inform.kz | KZ/RU | Госновости | ⭐⭐⭐ |
| Zakon.kz | RU | Право/политика | ⭐⭐ |
| NUR.kz | KZ/RU | Общие | ⭐⭐ |
| Kapital.kz | RU | Бизнес | ⭐⭐ |
| Liter.kz | KZ | Казахский контент | ⭐⭐⭐ |
| Kazinform.kz | KZ/RU | Гос. агентство | ⭐⭐⭐ |
| 24.kz | KZ/RU | ТВ-канал | ⭐⭐ |
| Orda.kz | RU | Аналитика | ⭐⭐ |
| Vlast.kz | RU | Политика | ⭐⭐ |

### Социальные Сети

| Платформа | Что парсим |
|-----------|------------|
| Telegram | Каналы казахстанских СМИ |
| Facebook | Страницы госорганов, СМИ |
| Instagram | Хештеги #казахстан #астана |

### Официальные Источники

| Источник | Данные |
|----------|--------|
| Akorda.kz | Новости президента |
| Government.kz | Решения правительства |
| Parlam.kz | Законопроекты |
| Stat.gov.kz | Статистика |

---

## Архитектура Системы

```
┌─────────────────────────────────────────────────────────────────┐
│                         ПАРСЕР                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Tengri   │   │ Inform   │   │ Telegram │   │ Facebook │     │
│  │ Parser   │   │ Parser   │   │ Parser   │   │ Parser   │     │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘     │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  RAW ARTICLES   │                          │
│                    │   (PostgreSQL)  │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │   AI ANALYZER   │                          │
│                    │  - Кластеризация│                          │
│                    │  - Тренды       │                          │
│                    │  - Категории    │                          │
│                    └────────┬────────┘                          │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │  HOT TOPICS     │                          │
│                    │   (Результат)   │                          │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Модели Данных

```prisma
// Сырые новости из источников
model NewsItem {
  id          String   @id @default(uuid())
  sourceId    String   // ID источника
  source      NewsSource @relation(fields: [sourceId], references: [id])
  externalId  String   // ID в источнике (для дедупликации)
  url         String   @unique
  title       String
  content     String?
  excerpt     String?
  imageUrl    String?
  publishedAt DateTime
  scrapedAt   DateTime @default(now())
  language    String   // kz, ru

  // AI-анализ
  topicId     String?
  topic       HotTopic? @relation(fields: [topicId], references: [id])
  keywords    String[] // Извлечённые ключевые слова
  sentiment   Float?   // -1 до 1

  @@unique([sourceId, externalId])
  @@index([publishedAt])
  @@index([topicId])
}

// Источники новостей
model NewsSource {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  url         String
  rssUrl      String?  // RSS лента
  parseConfig Json     // Селекторы для парсинга
  language    String   // kz, ru, both
  category    String   // news, politics, business, sport
  priority    Int      @default(1) // 1-3
  isActive    Boolean  @default(true)
  lastParsed  DateTime?
  newsItems   NewsItem[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Горячие темы (кластеры новостей)
model HotTopic {
  id          String   @id @default(uuid())
  titleKz     String
  titleRu     String
  summary     String?  // AI-саммари темы
  keywords    String[]
  category    String   // politics, economy, society, sport, culture

  // Метрики
  mentionsCount Int    @default(0)
  sourcesCount  Int    @default(0)
  trendScore    Float  @default(0) // Скорость роста

  // Связи
  newsItems   NewsItem[]

  // Статус
  isActive    Boolean  @default(true)
  startedAt   DateTime @default(now())
  peakedAt    DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive, trendScore])
  @@index([category])
}

// Телеграм-каналы для мониторинга
model TelegramChannel {
  id          String   @id @default(uuid())
  username    String   @unique // @channelname
  title       String
  category    String
  isActive    Boolean  @default(true)
  lastParsed  DateTime?
}
```

---

## Парсеры

### RSS-парсер (для сайтов с RSS)

```typescript
// apps/api/src/news-parser/parsers/rss.parser.ts
import Parser from 'rss-parser';

@Injectable()
export class RssParser {
  private parser = new Parser();

  async parse(source: NewsSource): Promise<NewsItem[]> {
    const feed = await this.parser.parseURL(source.rssUrl);

    return feed.items.map(item => ({
      sourceId: source.id,
      externalId: item.guid || item.link,
      url: item.link,
      title: item.title,
      content: item.content || item.contentSnippet,
      excerpt: item.contentSnippet,
      imageUrl: this.extractImage(item),
      publishedAt: new Date(item.pubDate),
      language: source.language,
    }));
  }
}
```

### HTML-парсер (для сайтов без RSS)

```typescript
// apps/api/src/news-parser/parsers/html.parser.ts
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class HtmlParser {
  async parse(source: NewsSource): Promise<NewsItem[]> {
    const { data } = await axios.get(source.url);
    const $ = cheerio.load(data);
    const config = source.parseConfig as ParseConfig;

    const items: NewsItem[] = [];

    $(config.articleSelector).each((_, el) => {
      items.push({
        sourceId: source.id,
        externalId: $(el).find(config.linkSelector).attr('href'),
        url: this.resolveUrl(source.url, $(el).find(config.linkSelector).attr('href')),
        title: $(el).find(config.titleSelector).text().trim(),
        excerpt: $(el).find(config.excerptSelector).text().trim(),
        imageUrl: $(el).find(config.imageSelector).attr('src'),
        publishedAt: this.parseDate($(el).find(config.dateSelector).text()),
        language: source.language,
      });
    });

    return items;
  }
}
```

### Telegram-парсер

```typescript
// apps/api/src/news-parser/parsers/telegram.parser.ts
import { TelegramClient } from 'telegram';

@Injectable()
export class TelegramParser {
  private client: TelegramClient;

  async parseChannel(channel: TelegramChannel): Promise<NewsItem[]> {
    const messages = await this.client.getMessages(channel.username, {
      limit: 50,
      offsetDate: channel.lastParsed,
    });

    return messages
      .filter(msg => msg.message && msg.message.length > 100)
      .map(msg => ({
        sourceId: `telegram_${channel.id}`,
        externalId: String(msg.id),
        url: `https://t.me/${channel.username}/${msg.id}`,
        title: msg.message.split('\n')[0].substring(0, 200),
        content: msg.message,
        imageUrl: msg.media?.photo ? this.getPhotoUrl(msg.media) : null,
        publishedAt: new Date(msg.date * 1000),
        language: this.detectLanguage(msg.message),
      }));
  }
}
```

---

## AI-Анализатор Тем

```typescript
// apps/api/src/news-parser/services/topic-analyzer.service.ts

@Injectable()
export class TopicAnalyzerService {
  constructor(
    private prisma: PrismaService,
    private openrouter: OpenRouterService,
  ) {}

  async analyzeAndCluster(): Promise<void> {
    // 1. Получить новости за последние 24 часа
    const recentNews = await this.prisma.newsItem.findMany({
      where: {
        publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        topicId: null,
      },
      orderBy: { publishedAt: 'desc' },
    });

    // 2. Извлечь ключевые слова через AI
    const newsWithKeywords = await Promise.all(
      recentNews.map(async (news) => ({
        ...news,
        keywords: await this.extractKeywords(news.title, news.content),
      }))
    );

    // 3. Кластеризация по ключевым словам
    const clusters = this.clusterByKeywords(newsWithKeywords);

    // 4. Создать/обновить горячие темы
    for (const cluster of clusters) {
      if (cluster.items.length >= 3) { // Минимум 3 источника
        await this.createOrUpdateTopic(cluster);
      }
    }

    // 5. Обновить тренд-скоры
    await this.updateTrendScores();
  }

  private async extractKeywords(title: string, content: string): Promise<string[]> {
    const response = await this.openrouter.chat({
      model: 'qwen/qwen3-4b:free',
      messages: [{
        role: 'user',
        content: `Извлеки 5-7 ключевых слов из новости. Верни только слова через запятую.

Заголовок: ${title}
Текст: ${content?.substring(0, 500)}

Ключевые слова:`
      }],
      max_tokens: 100,
    });

    return response.split(',').map(k => k.trim().toLowerCase());
  }

  private async createOrUpdateTopic(cluster: NewsCluster): Promise<void> {
    // Генерация заголовка темы через AI
    const topicTitle = await this.generateTopicTitle(cluster.items);

    const topic = await this.prisma.hotTopic.upsert({
      where: { /* поиск похожей темы */ },
      create: {
        titleKz: topicTitle.kz,
        titleRu: topicTitle.ru,
        keywords: cluster.keywords,
        category: this.detectCategory(cluster.keywords),
        mentionsCount: cluster.items.length,
        sourcesCount: new Set(cluster.items.map(i => i.sourceId)).size,
      },
      update: {
        mentionsCount: { increment: cluster.items.length },
        // ...
      },
    });

    // Привязать новости к теме
    await this.prisma.newsItem.updateMany({
      where: { id: { in: cluster.items.map(i => i.id) } },
      data: { topicId: topic.id },
    });
  }
}
```

---

## API Эндпоинты

```typescript
// apps/api/src/news-parser/news-parser.controller.ts

@Controller('api/news-feed')
export class NewsFeedController {

  @Get('hot-topics')
  @UseGuards(JwtAuthGuard)
  async getHotTopics(
    @Query('category') category?: string,
    @Query('limit') limit = 10,
  ) {
    // Горячие темы за последние 24 часа
    return this.service.getHotTopics({ category, limit });
  }

  @Get('hot-topics/:id')
  @UseGuards(JwtAuthGuard)
  async getTopicDetails(@Param('id') id: string) {
    // Детали темы + все связанные новости
    return this.service.getTopicWithNews(id);
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  async getLatestNews(
    @Query('source') source?: string,
    @Query('limit') limit = 50,
  ) {
    // Последние новости из всех источников
    return this.service.getLatestNews({ source, limit });
  }

  @Post('hot-topics/:id/create-article')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EDITOR, Role.ADMIN)
  async createArticleFromTopic(@Param('id') id: string) {
    // Создать черновик статьи на основе темы
    return this.service.createArticleDraft(id);
  }
}
```

---

## Интерфейс Редактора

### Панель "Горячие Темы"

```tsx
// apps/web/src/app/admin/news-feed/page.tsx

export default function NewsFeedPage() {
  const { data: topics } = useHotTopics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">🔥 Актуальные темы</h1>

      {/* Фильтры */}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gray-100 rounded">Все</button>
        <button className="px-4 py-2">Политика</button>
        <button className="px-4 py-2">Экономика</button>
        <button className="px-4 py-2">Общество</button>
        <button className="px-4 py-2">Спорт</button>
      </div>

      {/* Список тем */}
      <div className="space-y-4">
        {topics?.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}

function TopicCard({ topic }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{topic.titleKz}</h3>
          <p className="text-sm text-gray-500 mt-1">{topic.titleRu}</p>
        </div>
        <TrendBadge score={topic.trendScore} />
      </div>

      <div className="flex gap-4 mt-3 text-sm text-gray-600">
        <span>📰 {topic.mentionsCount} упоминаний</span>
        <span>🌐 {topic.sourcesCount} источников</span>
        <span>🕐 {formatTime(topic.startedAt)}</span>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => createArticle(topic.id)}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ✏️ Создать статью
        </button>
        <button className="px-4 py-2 border rounded">
          Подробнее →
        </button>
      </div>
    </div>
  );
}
```

### Детали Темы

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏛️ Послание Президента народу Казахстана                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📊 Статистика                                                    │
│ ├── Упоминаний: 47                                              │
│ ├── Источников: 12                                              │
│ ├── Первое упоминание: 10:30                                    │
│ └── Пик активности: 14:00                                       │
│                                                                  │
│ 📰 Источники по теме:                                            │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ 🔵 Tengrinews.kz                                     10:32      │
│    "Токаев объявил о новых реформах в Послании"                 │
│    [Открыть] [Использовать как основу]                          │
│                                                                  │
│ 🔵 Inform.kz                                         10:45      │
│    "Полный текст Послания Президента 2025"                      │
│    [Открыть] [Использовать как основу]                          │
│                                                                  │
│ 🔵 24.kz                                             11:00      │
│    "Главные тезисы Послания Токаева"                            │
│    [Открыть] [Использовать как основу]                          │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│                                                                  │
│ [✏️ Создать статью на основе темы]                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Расписание Парсинга

```typescript
// apps/api/src/news-parser/news-parser.scheduler.ts

@Injectable()
export class NewsParserScheduler {

  // Каждые 15 минут - основные источники
  @Cron('*/15 * * * *')
  async parseMainSources() {
    const sources = await this.prisma.newsSource.findMany({
      where: { isActive: true, priority: 3 },
    });
    await this.parseAll(sources);
  }

  // Каждые 30 минут - второстепенные
  @Cron('*/30 * * * *')
  async parseSecondarySources() {
    const sources = await this.prisma.newsSource.findMany({
      where: { isActive: true, priority: 2 },
    });
    await this.parseAll(sources);
  }

  // Каждый час - Telegram каналы
  @Cron('0 * * * *')
  async parseTelegram() {
    await this.telegramParser.parseAllChannels();
  }

  // Каждые 10 минут - анализ и кластеризация
  @Cron('*/10 * * * *')
  async analyzeTopics() {
    await this.topicAnalyzer.analyzeAndCluster();
  }
}
```

---

## Создание Статьи из Темы

```typescript
// apps/api/src/news-parser/services/article-generator.service.ts

@Injectable()
export class ArticleGeneratorService {

  async createDraftFromTopic(topicId: string, userId: string) {
    const topic = await this.prisma.hotTopic.findUnique({
      where: { id: topicId },
      include: { newsItems: { take: 10, orderBy: { publishedAt: 'desc' } } },
    });

    // Собрать контекст из источников
    const context = topic.newsItems
      .map(n => `Источник: ${n.url}\n${n.title}\n${n.excerpt}`)
      .join('\n\n---\n\n');

    // AI генерирует черновик
    const draft = await this.openrouter.chat({
      model: 'qwen/qwen3-4b:free',
      messages: [{
        role: 'user',
        content: `Ты журналист казахстанского СМИ. На основе следующих источников напиши уникальную новостную статью на казахском языке.

Тема: ${topic.titleKz}

Источники:
${context}

Требования:
1. Напиши заголовок и текст статьи
2. Не копируй текст источников дословно
3. Укажи ключевые факты
4. Статья должна быть на казахском языке
5. Формат: сначала заголовок, потом текст

Статья:`
      }],
      max_tokens: 2000,
    });

    // Создать черновик в системе
    return this.articlesService.create({
      titleKz: this.extractTitle(draft),
      contentKz: this.extractContent(draft),
      status: 'DRAFT',
      // Примечание об источниках
      excerptKz: `Тема: ${topic.titleKz}. Источники: ${topic.newsItems.length}`,
    }, userId);
  }
}
```

---

## План Реализации

### Фаза 1: MVP (2 недели)

| Задача | Время |
|--------|-------|
| Модели данных (Prisma) | 2 часа |
| RSS-парсер | 4 часа |
| HTML-парсер (3 источника) | 1 день |
| Базовая кластеризация | 1 день |
| API эндпоинты | 4 часа |
| UI панель тем | 1 день |
| Создание черновика | 4 часа |

### Фаза 2: Расширение (2 недели)

| Задача | Время |
|--------|-------|
| +10 источников | 2 дня |
| Telegram-парсер | 2 дня |
| AI-улучшение кластеризации | 1 день |
| Тренд-скоры | 4 часа |
| Уведомления о горячих темах | 4 часа |

### Фаза 3: Продвинутые функции

| Задача | Время |
|--------|-------|
| Facebook/Instagram парсинг | 2 дня |
| Персонализация (по категориям редакции) | 1 день |
| Аналитика эффективности | 1 день |
| Автогенерация полных статей | 2 дня |

---

## Технические Требования

### Зависимости

```json
{
  "rss-parser": "^3.13.0",
  "cheerio": "^1.0.0-rc.12",
  "telegram": "^2.19.0",
  "@nestjs/schedule": "^4.0.0",
  "node-cron": "^3.0.3"
}
```

### Переменные окружения

```env
# Telegram API (для парсинга каналов)
TELEGRAM_API_ID=...
TELEGRAM_API_HASH=...

# Прокси (опционально, для обхода блокировок)
PROXY_URL=...
```

---

## Результат

| Было | Стало |
|------|-------|
| Журналист сам ищет темы | Система показывает горячие темы |
| Мониторинг 2-3 сайтов вручную | Автоматический мониторинг 20+ источников |
| Не знает, о чём пишут конкуренты | Видит все публикации по теме |
| Долго собирает информацию | AI-черновик за 30 секунд |
| Упускает срочные новости | Уведомления о горячих темах |
