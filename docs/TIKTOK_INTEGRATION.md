# TikTok Integration Documentation

## Обзор

Интеграция TikTok Content Posting API для автоматической публикации новостных статей в виде фото-постов.

## Статус интеграции

| Компонент | Статус |
|-----------|--------|
| OAuth 2.0 авторизация | ✅ Работает |
| PKCE Security | ✅ Реализован |
| Верификация домена | ✅ Пройдена |
| Content Posting API | ✅ Интегрирован |
| App Review | ⏳ На рассмотрении |
| Live Mode | ⏳ Ожидает одобрения |

## Архитектура

### Backend (NestJS)

```
apps/api/src/social-media/
├── tiktok-oauth.controller.ts  # OAuth endpoints
├── tiktok.service.ts           # TikTok API client
├── social-media.service.ts     # Общий сервис публикации
├── social-media.controller.ts  # API endpoints
└── templates/
    └── tiktok.template.ts      # Форматирование постов
```

### Frontend (Next.js)

```
apps/web/src/
├── app/admin/settings/social-media/page.tsx  # Настройки TikTok
├── components/article-form.tsx               # Форма публикации
├── components/social-media-preview.tsx       # Превью поста
└── hooks/use-social-media.ts                 # API хуки
```

## OAuth 2.0 Flow

### Endpoints

| Endpoint | Метод | Описание | Auth |
|----------|-------|----------|------|
| `/tiktok/auth` | GET | Инициация OAuth | JWT (Admin) |
| `/tiktok/callback` | GET | OAuth callback | Public |
| `/tiktok/auth-url` | GET | Получить URL авторизации | JWT (Admin) |
| `/tiktok/refresh-token` | GET | Обновить токен | JWT (Admin) |
| `/tiktok/status` | GET | Статус авторизации | Public |

### Процесс авторизации

```
1. Admin → /tiktok/auth-url
2. Генерация PKCE (code_verifier, code_challenge)
3. Сохранение code_verifier в БД
4. Redirect → TikTok OAuth
5. User авторизует приложение
6. TikTok → /tiktok/callback?code=xxx
7. Exchange code → access_token + refresh_token
8. Сохранение токенов в БД
9. Redirect → /admin/settings/social-media?tiktok_auth=success
```

### PKCE Implementation

```typescript
// Генерация code_verifier (32 random bytes)
const codeVerifier = crypto.randomBytes(32).toString('base64url');

// Генерация code_challenge (SHA256 hash)
const codeChallenge = crypto
  .createHash('sha256')
  .update(codeVerifier)
  .digest('base64url');

// В URL авторизации
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// При обмене кода на токен
body: { code_verifier: codeVerifier }
```

## Content Posting API

### Публикация фото-поста

```typescript
// 1. Инициализация публикации
POST https://open.tiktokapis.com/v2/post/publish/content/init/
{
  "post_info": {
    "title": "Заголовок (до 150 символов)",
    "description": "Описание (до 2200 символов)",
    "privacy_level": "PUBLIC_TO_EVERYONE"
  },
  "source_info": {
    "source": "PULL_FROM_URL",
    "photo_images": ["https://example.com/image.jpg"]
  },
  "post_mode": "DIRECT_POST",
  "media_type": "PHOTO"
}

// 2. Polling статуса
POST https://open.tiktokapis.com/v2/post/publish/status/fetch/
{
  "publish_id": "xxx"
}

// Статусы: PROCESSING_UPLOAD → PROCESSING_DOWNLOAD → PUBLISH_COMPLETE
```

### Ограничения API

- **Заголовок:** максимум 150 символов
- **Описание:** максимум 2200 символов
- **Фото:** максимум 35 изображений
- **Форматы:** JPEG, PNG
- **Polling:** каждые 5 секунд, максимум 2 минуты

## Конфигурация

### Database Schema (Prisma)

```prisma
model SocialMediaConfig {
  id                  String   @id @default(cuid())
  platform            SocialMediaPlatform @unique
  enabled             Boolean  @default(false)
  defaultLanguage     String   @default("kz")

  // TikTok specific
  tiktokClientKey     String?
  tiktokClientSecret  String?
  tiktokAccessToken   String?
  tiktokRefreshToken  String?
  tiktokOpenId        String?

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### TikTok Developer Console Settings

```
App Name: aimaqaqshamy
Category: News
Platforms: Web

Products:
- Login Kit
- Content Posting API (Direct Post: ON)
- Share Kit
- Webhooks

Scopes:
- user.info.basic
- video.publish
- video.upload

Redirect URI: https://aimaqaqshamy.kz/api/tiktok/callback
Webhook URL: https://aimaqaqshamy.kz/api/tiktok/webhook

Domain Verification: ✅ Verified (https://aimaqaqshamy.kz/)
```

### Файл верификации домена

```
Path: apps/web/public/tiktokhspn2X0NUB583MkkPIXoyUMYMJNxmv6t.txt
Content: tiktok-developers-site-verification=hspn2X0NUB583MkkPIXoyUMYMJNxmv6t
URL: https://aimaqaqshamy.kz/tiktokhspn2X0NUB583MkkPIXoyUMYMJNxmv6t.txt
```

## Форматирование постов

### Структура поста

```typescript
function formatTiktokPost(article, language) {
  return {
    title: truncate(article.title, 150),
    description: `
      ${article.excerpt}

      🔗 ${article.url}

      #AIMAK #Сатпаев #жаналықтар #Казахстан
      ${categoryHashtag} ${tagHashtags}
    `
  };
}
```

### Хэштеги

- Бренд: `#AIMAK`, `#Сатпаев`
- Язык KZ: `#жаналықтар`
- Язык RU: `#новости`
- Категория статьи
- Теги статьи (до 3)
- Срочные новости: `#breaking`, `#срочно`

## Исправления и улучшения

### 28.12.2024

1. **PKCE в initiateAuth()** - добавлена генерация code_challenge для безопасности OAuth
2. **@Public() на callback** - endpoint доступен без JWT (TikTok redirect)
3. **URLSearchParams в refreshToken** - правильный формат для x-www-form-urlencoded
4. **Убрана маскировка Client Key** - type="text" вместо "password" для отладки
5. **Файл верификации домена** - для Content Posting API pull_by_url

## Sandbox vs Production

### Sandbox Mode (текущий)

- ✅ OAuth авторизация работает
- ✅ API вызовы проходят
- ❌ Посты НЕ публикуются публично
- ❌ Только для Target Users (до 10 аккаунтов)

### Production Mode (после App Review)

- ✅ Публичная публикация постов
- ✅ Любой пользователь может авторизоваться
- ✅ Полный функционал Content Posting API

## Troubleshooting

### Ошибка "Something went wrong - client_key"

**Причина:** Аккаунт не добавлен в Target Users (Sandbox mode)

**Решение:**
1. TikTok Developer Console → Sandbox settings → Target Users
2. Add account → ввести TikTok username
3. Apply changes

### Ошибка 401 на callback

**Причина:** Endpoint защищён JWT guard

**Решение:** Добавить `@Public()` декоратор к handleCallback()

### Публикация зависает

**Причина:** Домен не верифицирован для pull_by_url

**Решение:**
1. Content Posting API → Verify domains
2. Создать файл верификации в public/
3. Нажать Verify

### Пост не появляется в TikTok

**Причина:** Sandbox mode не поддерживает публичные посты

**Решение:** Подать на App Review → дождаться одобрения → Live Mode

## API Reference

### TikTok API URLs

```
Authorization: https://www.tiktok.com/v2/auth/authorize
Token: https://open.tiktokapis.com/v2/oauth/token/
API Base: https://open.tiktokapis.com/v2
```

### Headers

```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json; charset=UTF-8'
}
```

## Контакты и ресурсы

- [TikTok Developer Portal](https://developers.tiktok.com)
- [Content Posting API Docs](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [OAuth Docs](https://developers.tiktok.com/doc/login-kit-manage-user-access-tokens)
- [App Review Guidelines](https://developers.tiktok.com/doc/our-guidelines-developer-guidelines)
