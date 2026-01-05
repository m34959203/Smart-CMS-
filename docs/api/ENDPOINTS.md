# API Эндпоинты

Полный список всех REST API эндпоинтов.

## Аутентификация (`/api/auth`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/auth/register` | Регистрация пользователя | Публичный |
| POST | `/auth/login` | Вход в систему | Публичный |
| GET | `/auth/me` | Получить текущего пользователя | Авторизованный |
| POST | `/auth/refresh` | Обновить токен | Авторизованный |

### Примеры

**Регистрация:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "Иван",
  "lastName": "Иванов"
}
```

**Вход:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Статьи (`/api/articles`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/articles` | Список статей | Публичный |
| GET | `/articles/:id` | Статья по ID | Публичный |
| GET | `/articles/slug/:slug` | Статья по slug | Публичный |
| POST | `/articles` | Создать статью | EDITOR/ADMIN |
| PATCH | `/articles/:id` | Обновить статью | EDITOR/ADMIN |
| DELETE | `/articles/:id` | Удалить статью | EDITOR/ADMIN |
| POST | `/articles/delete-many` | Удалить несколько | ADMIN |
| POST | `/articles/analyze` | AI анализ статьи | EDITOR/ADMIN |
| POST | `/articles/spell-check` | Проверка орфографии | EDITOR/ADMIN |
| POST | `/articles/categorize-all` | AI категоризация всех | ADMIN |

### Query параметры для списка

```
GET /api/articles?page=1&limit=10&categoryId=xxx&status=PUBLISHED&search=текст
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| page | number | Номер страницы (default: 1) |
| limit | number | Записей на странице (default: 10) |
| categoryId | string | Фильтр по категории |
| status | string | DRAFT, REVIEW, PUBLISHED, ARCHIVED |
| search | string | Поиск по заголовку/контенту |
| authorId | string | Фильтр по автору |
| isBreaking | boolean | Срочные новости |
| isFeatured | boolean | Избранные |

### Создание статьи (двуязычная)

```bash
POST /api/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "titleKz": "Заголовок на казахском",
  "contentKz": "<p>Контент на казахском...</p>",
  "excerptKz": "Краткое описание",

  "titleRu": "Заголовок на русском",
  "contentRu": "<p>Контент на русском...</p>",
  "excerptRu": "Краткое описание",

  "categoryId": "uuid-category",
  "tagIds": ["uuid-tag1", "uuid-tag2"],
  "coverImage": "https://...",
  "status": "DRAFT",

  "isBreaking": false,
  "isFeatured": false,
  "isPinned": false,
  "allowComments": true,

  "autoPublishEnabled": true,
  "autoPublishPlatforms": ["TELEGRAM", "INSTAGRAM"]
}
```

---

## Категории (`/api/categories`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/categories` | Список категорий | Публичный |
| GET | `/categories/:id` | Категория по ID | Публичный |
| POST | `/categories` | Создать категорию | ADMIN |
| PATCH | `/categories/:id` | Обновить категорию | ADMIN |
| DELETE | `/categories/:id` | Удалить категорию | ADMIN |

### Создание категории

```bash
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "politics",
  "nameKz": "Саясат",
  "nameRu": "Политика",
  "descriptionKz": "Саяси жаңалықтар",
  "descriptionRu": "Политические новости",
  "parentId": null,
  "sortOrder": 1
}
```

---

## Теги (`/api/tags`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/tags` | Список тегов | Публичный |
| GET | `/tags/:id` | Тег по ID | Публичный |
| POST | `/tags` | Создать тег | EDITOR/ADMIN |
| PATCH | `/tags/:id` | Обновить тег | ADMIN |
| DELETE | `/tags/:id` | Удалить тег | ADMIN |
| POST | `/tags/generate` | AI генерация тегов | EDITOR/ADMIN |
| POST | `/tags/generate-from-articles` | Генерация для всех статей | ADMIN |

### AI генерация тегов

```bash
POST /api/tags/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Текст статьи для анализа...",
  "language": "kz"
}

Response:
{
  "tags": [
    { "nameKz": "Тег 1", "nameRu": "Тег 1" },
    { "nameKz": "Тег 2", "nameRu": "Тег 2" }
  ]
}
```

---

## Пользователи (`/api/users`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/users` | Список пользователей | ADMIN |
| GET | `/users/:id` | Пользователь по ID | Авторизованный |
| PATCH | `/users/:id` | Обновить пользователя | Владелец/ADMIN |
| DELETE | `/users/:id` | Удалить пользователя | ADMIN |

---

## Медиа (`/api/media`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/media/upload` | Загрузить файл | EDITOR/ADMIN |
| GET | `/media/:id` | Информация о файле | Публичный |
| DELETE | `/media/:id` | Удалить файл | ADMIN |

### Загрузка файла

```bash
POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
altTextKz: "Альтернативный текст"
altTextRu: "Альтернативный текст"
```

---

## Журнал (`/api/magazine-issues`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/magazine-issues` | Список номеров | Публичный |
| GET | `/magazine-issues/:id` | Номер по ID | Публичный |
| POST | `/magazine-issues` | Создать номер | ADMIN |
| PATCH | `/magazine-issues/:id` | Обновить номер | ADMIN |
| DELETE | `/magazine-issues/:id` | Удалить номер | ADMIN |
| POST | `/magazine-issues/:id/view` | Увеличить просмотры | Публичный |
| POST | `/magazine-issues/:id/download` | Увеличить загрузки | Публичный |

### Создание номера журнала

```bash
POST /api/magazine-issues
Authorization: Bearer <token>
Content-Type: multipart/form-data

pdf: <binary PDF file>
issueNumber: 42
publishDate: "2024-01-15"
titleKz: "Шілде 2024"
titleRu: "Июль 2024"
```

---

## Перевод (`/api/translation`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/translation/text` | Перевести текст | EDITOR/ADMIN |
| POST | `/translation/article` | Перевести статью | EDITOR/ADMIN |

### Перевод текста

```bash
POST /api/translation/text
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Бүгін ауа райы жақсы",
  "from": "kz",
  "to": "ru"
}

Response:
{
  "translatedText": "Сегодня хорошая погода"
}
```

---

## Социальные сети (`/api/social-media`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/social-media/config` | Получить конфигурацию | ADMIN |
| PUT | `/social-media/config` | Обновить конфигурацию | ADMIN |
| POST | `/social-media/publish` | Опубликовать статью | EDITOR/ADMIN |
| GET | `/social-media/publications` | История публикаций | EDITOR/ADMIN |
| POST | `/social-media/test-connection` | Проверить подключение | ADMIN |

### Публикация в соцсети

```bash
POST /api/social-media/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "articleId": "uuid-article",
  "platforms": ["TELEGRAM", "INSTAGRAM"],
  "message": "Новая статья на сайте!",
  "includeImage": true
}
```

---

## Реклама (`/api/advertisements`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/advertisements` | Список объявлений | Публичный |
| GET | `/advertisements/:id` | Объявление по ID | Публичный |
| GET | `/advertisements/code/:code` | По коду позиции | Публичный |
| POST | `/advertisements` | Создать объявление | ADMIN |
| PATCH | `/advertisements/:id` | Обновить | ADMIN |
| DELETE | `/advertisements/:id` | Удалить | ADMIN |
| POST | `/advertisements/:id/click` | Зафиксировать клик | Публичный |

---

## Health Check (`/api/health`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/health` | Статус приложения | Публичный |
| GET | `/health/pm2` | Статус PM2 | ADMIN |
| POST | `/health/pm2/restart` | Перезапуск PM2 | ADMIN |

---

## Системные настройки (`/api/health/settings`)

| Метод | Эндпоинт | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/health/settings` | Получить настройки системы | ADMIN |
| PATCH | `/health/settings` | Обновить настройки системы | ADMIN |
| GET | `/health/settings/image-optimization` | Статус оптимизации изображений | Публичный |

### Получение настроек

```bash
GET /api/health/settings
Authorization: Bearer <token>

Response:
{
  "id": "default",
  "imageOptimizationEnabled": true,
  "maintenanceMode": false,
  "createdAt": "2024-12-27T00:00:00.000Z",
  "updatedAt": "2024-12-27T00:00:00.000Z"
}
```

### Обновление настроек

```bash
PATCH /api/health/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageOptimizationEnabled": false
}
```

### Проверка оптимизации изображений (публичный)

```bash
GET /api/health/settings/image-optimization

Response:
{
  "imageOptimizationEnabled": true
}
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещен |
| 404 | Ресурс не найден |
| 422 | Ошибка валидации |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |
