# API Спецификация: Система Мониторинга Актуальных Тем

## Базовый URL

```
/api/news-feed
```

## Авторизация

Все эндпоинты требуют JWT-токен:
```
Authorization: Bearer <token>
```

---

## 1. Горячие Темы

### GET /api/news-feed/topics

Получить список горячих тем.

**Доступ:** EDITOR, ADMIN

**Query параметры:**

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| category | string | Фильтр по категории | - |
| limit | number | Количество | 20 |
| offset | number | Смещение | 0 |
| period | string | Период: 1h, 6h, 24h, 7d | 24h |
| sort | string | Сортировка: trend, time, mentions | trend |

**Ответ:**
```json
{
  "data": [
    {
      "id": "uuid",
      "titleKz": "Президенттің Жолдауы",
      "titleRu": "Послание Президента",
      "keywords": ["президент", "жолдау", "послание"],
      "category": "POLITICS",
      "mentionsCount": 47,
      "sourcesCount": 12,
      "trendScore": 8.5,
      "firstSeenAt": "2025-01-04T10:30:00Z",
      "lastSeenAt": "2025-01-04T14:45:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/news-feed/topics/:id

Получить детали темы со списком источников.

**Доступ:** EDITOR, ADMIN

**Ответ:**
```json
{
  "id": "uuid",
  "titleKz": "Президенттің Жолдауы",
  "titleRu": "Послание Президента",
  "keywords": ["президент", "жолдау", "послание"],
  "category": "POLITICS",
  "mentionsCount": 47,
  "sourcesCount": 12,
  "trendScore": 8.5,
  "firstSeenAt": "2025-01-04T10:30:00Z",
  "lastSeenAt": "2025-01-04T14:45:00Z",
  "peakedAt": "2025-01-04T12:00:00Z",
  "newsItems": [
    {
      "id": "uuid",
      "title": "Токаев объявил о новых реформах",
      "url": "https://tengrinews.kz/...",
      "publishedAt": "2025-01-04T10:32:00Z",
      "source": {
        "id": "uuid",
        "name": "Tengrinews",
        "slug": "tengrinews"
      }
    }
  ]
}
```

---

### POST /api/news-feed/topics/:id/create-article

Создать черновик статьи на основе темы.

**Доступ:** EDITOR, ADMIN

**Тело запроса:**
```json
{
  "language": "kz"  // kz или ru
}
```

**Ответ:**
```json
{
  "articleId": "uuid",
  "message": "Черновик создан",
  "redirectUrl": "/admin/articles/uuid"
}
```

**Логика:**
- Создаётся статья со статусом DRAFT
- Заголовок = название темы
- В excerptKz/excerptRu добавляется список источников
- Категория = категория темы

---

## 2. Новости (лента)

### GET /api/news-feed/latest

Получить последние новости из всех источников.

**Доступ:** EDITOR, ADMIN

**Query параметры:**

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| source | string | Фильтр по slug источника | - |
| language | string | kz, ru | - |
| limit | number | Количество | 50 |
| offset | number | Смещение | 0 |
| period | string | 1h, 6h, 24h | 24h |

**Ответ:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Заголовок новости",
      "url": "https://...",
      "publishedAt": "2025-01-04T14:30:00Z",
      "language": "ru",
      "source": {
        "id": "uuid",
        "name": "Tengrinews",
        "slug": "tengrinews"
      },
      "topic": {
        "id": "uuid",
        "titleRu": "Послание Президента"
      }
    }
  ],
  "total": 245
}
```

---

## 3. Источники

### GET /api/news-feed/sources

Получить список источников.

**Доступ:** ADMIN

**Ответ:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tengrinews",
      "slug": "tengrinews",
      "url": "https://tengrinews.kz",
      "rssUrl": "https://tengrinews.kz/rss",
      "parserType": "RSS",
      "language": "BOTH",
      "priority": 1,
      "isActive": true,
      "lastParsedAt": "2025-01-04T14:45:00Z",
      "lastParseStatus": "SUCCESS",
      "successCount": 1523,
      "errorCount": 0
    }
  ]
}
```

---

### POST /api/news-feed/sources

Добавить новый источник.

**Доступ:** ADMIN

**Тело запроса:**
```json
{
  "name": "НовыйИсточник",
  "slug": "novyi-istochnik",
  "url": "https://example.kz",
  "rssUrl": "https://example.kz/rss",
  "parserType": "RSS",
  "language": "BOTH",
  "category": "news",
  "priority": 2
}
```

---

### PATCH /api/news-feed/sources/:id

Обновить источник.

**Доступ:** ADMIN

---

### DELETE /api/news-feed/sources/:id

Удалить источник.

**Доступ:** ADMIN

---

### POST /api/news-feed/sources/:id/parse

Принудительно запустить парсинг источника.

**Доступ:** ADMIN

**Ответ:**
```json
{
  "status": "SUCCESS",
  "itemsCount": 25,
  "newItemsCount": 3,
  "durationMs": 1234
}
```

---

## 4. Статистика

### GET /api/news-feed/stats

Получить статистику системы.

**Доступ:** ADMIN

**Ответ:**
```json
{
  "sources": {
    "total": 15,
    "active": 14,
    "withErrors": 1
  },
  "newsItems": {
    "today": 342,
    "week": 2156,
    "total": 12453
  },
  "topics": {
    "active": 23,
    "today": 8
  },
  "parsing": {
    "lastRun": "2025-01-04T14:45:00Z",
    "successRate": 98.5,
    "avgDurationMs": 2340
  }
}
```

---

## 5. Настройки

### GET /api/news-feed/settings

Получить настройки парсера.

**Доступ:** ADMIN

**Ответ:**
```json
{
  "isEnabled": true,
  "priority1Interval": 15,
  "priority2Interval": 30,
  "priority3Interval": 60,
  "minSourcesForTopic": 3,
  "retentionDays": 7,
  "requestDelay": 1000,
  "requestTimeout": 10000
}
```

---

### PATCH /api/news-feed/settings

Обновить настройки парсера.

**Доступ:** ADMIN

**Тело запроса:**
```json
{
  "isEnabled": true,
  "priority1Interval": 10
}
```

---

## 6. Логи

### GET /api/news-feed/logs

Получить логи парсинга.

**Доступ:** ADMIN

**Query параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| sourceId | string | Фильтр по источнику |
| status | string | SUCCESS, ERROR |
| limit | number | Количество |
| offset | number | Смещение |

**Ответ:**
```json
{
  "data": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "status": "SUCCESS",
      "itemsCount": 25,
      "newItemsCount": 3,
      "durationMs": 1234,
      "createdAt": "2025-01-04T14:45:00Z"
    }
  ]
}
```

---

## DTO (Data Transfer Objects)

### CreateSourceDto

```typescript
export class CreateSourceDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @IsUrl()
  url: string;

  @IsUrl()
  @IsOptional()
  rssUrl?: string;

  @IsEnum(ParserType)
  @IsOptional()
  parserType?: ParserType;

  @IsObject()
  @IsOptional()
  parseConfig?: object;

  @IsEnum(SourceLanguage)
  @IsOptional()
  language?: SourceLanguage;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  priority?: number;
}
```

### TopicQueryDto

```typescript
export class TopicQueryDto {
  @IsEnum(TopicCategory)
  @IsOptional()
  category?: TopicCategory;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @IsIn(['1h', '6h', '24h', '7d'])
  @IsOptional()
  period?: string = '24h';

  @IsIn(['trend', 'time', 'mentions'])
  @IsOptional()
  sort?: string = 'trend';
}
```

### CreateArticleFromTopicDto

```typescript
export class CreateArticleFromTopicDto {
  @IsIn(['kz', 'ru'])
  @IsOptional()
  language?: string = 'kz';
}
```

---

## Коды Ответов

| Код | Описание |
|-----|----------|
| 200 | Успех |
| 201 | Создано |
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Нет доступа (не EDITOR/ADMIN) |
| 404 | Не найдено |
| 500 | Ошибка сервера |

---

## Webhooks (опционально)

### POST /api/news-feed/webhooks/new-topic

Вызывается при появлении новой горячей темы.

**Payload:**
```json
{
  "event": "new_topic",
  "topic": {
    "id": "uuid",
    "titleKz": "...",
    "titleRu": "...",
    "mentionsCount": 5,
    "sourcesCount": 3
  },
  "timestamp": "2025-01-04T14:45:00Z"
}
```

Можно использовать для уведомлений в Telegram редакции.
