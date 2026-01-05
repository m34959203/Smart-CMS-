# Переменные окружения

Полный список переменных окружения для API и Web приложений.

## API (`apps/api/.env`)

### База данных

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `DATABASE_URL` | Да | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/aimak_db?schema=public` |
| `REDIS_HOST` | Да | Redis хост | `localhost` |
| `REDIS_PORT` | Да | Redis порт | `6379` |

### Приложение

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `PORT` | Да | Порт API | `4000` |
| `NODE_ENV` | Да | Окружение | `development` / `production` |
| `APP_URL` | Да | URL API | `http://localhost:4000` |
| `FRONTEND_URL` | Да | URL Frontend (для CORS) | `http://localhost:3000` |

### JWT аутентификация

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `JWT_SECRET` | Да | Секрет для access токенов (мин. 32 символа) | `your-super-secret-key-min-32-chars` |
| `JWT_EXPIRES_IN` | Да | Время жизни access токена | `15m` |
| `JWT_REFRESH_SECRET` | Да | Секрет для refresh токенов | `another-secret-key-32-chars` |
| `JWT_REFRESH_EXPIRES_IN` | Да | Время жизни refresh токена | `7d` |

### AI интеграция

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `OPENROUTER_API_KEY` | Да | API ключ OpenRouter | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Нет | Модель AI | `tngtech/deepseek-r1t2-chimera:free` |
| `GEMINI_API_KEY` | Нет | API ключ Google Gemini | `AIza...` |
| `GEMINI_MODEL` | Нет | Модель Gemini | `gemini-2.0-flash-exp` |

### Загрузка файлов

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `UPLOAD_DIR` | Да | Директория для файлов | `./uploads` |
| `MAX_FILE_SIZE` | Нет | Макс. размер файла (байты) | `5242880` (5MB) |

### Supabase (облачное хранилище)

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `SUPABASE_URL` | Нет | URL Supabase проекта | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Нет | Service role ключ | `eyJ...` |
| `SUPABASE_BUCKET` | Нет | Название bucket | `aimak-media` |

### Социальные сети

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `TELEGRAM_BOT_TOKEN` | Нет | Токен Telegram бота | `123456:ABC...` |
| `TELEGRAM_CHANNEL_ID` | Нет | ID канала Telegram | `@aimakakshamy` |
| `INSTAGRAM_ACCESS_TOKEN` | Нет | Токен Instagram | `IGQ...` |
| `INSTAGRAM_BUSINESS_ID` | Нет | ID бизнес аккаунта | `17841...` |

### Rate Limiting

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `RATE_LIMIT_PUBLIC` | Нет | Лимит для публичных запросов | `100` |
| `RATE_LIMIT_AUTHENTICATED` | Нет | Лимит для авторизованных | `1000` |

### Email (SMTP)

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `SMTP_HOST` | Нет | SMTP сервер | `smtp.gmail.com` |
| `SMTP_PORT` | Нет | SMTP порт | `587` |
| `SMTP_USER` | Нет | Email пользователя | `noreply@example.com` |
| `SMTP_PASSWORD` | Нет | Пароль приложения | `xxxx-xxxx-xxxx` |

---

## Web (`apps/web/.env`)

| Переменная | Обязательно | Описание | Пример |
|------------|-------------|----------|--------|
| `NEXT_PUBLIC_API_URL` | Да | URL API | `http://localhost:4000/api` |
| `NEXT_PUBLIC_APP_NAME` | Нет | Название приложения | `Aimak Akshamy` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Нет | Описание | `City Newspaper` |

---

## Примеры конфигураций

### Development

```env
# apps/api/.env
DATABASE_URL="postgresql://aimak_user:aimak_password_2024@localhost:5432/aimak_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=4000
NODE_ENV=development
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-jwt-secret-key-change-in-production-32chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
OPENROUTER_API_KEY=sk-or-v1-your-key
```

```env
# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
```

### Production

```env
# apps/api/.env
DATABASE_URL="postgresql://aimak_user:SECURE_PASSWORD@db-server:5432/aimak_db?schema=public"
REDIS_HOST=redis-server
REDIS_PORT=6379
PORT=4000
NODE_ENV=production
APP_URL=https://api.aimaqaqshamy.kz
FRONTEND_URL=https://aimaqaqshamy.kz
JWT_SECRET=RANDOM_64_CHAR_STRING_GENERATED_SECURELY
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=ANOTHER_RANDOM_64_CHAR_STRING
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=/var/www/aimak/uploads
MAX_FILE_SIZE=10485760
OPENROUTER_API_KEY=sk-or-v1-production-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
SUPABASE_BUCKET=aimak-media
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHANNEL_ID=@aimakakshamy
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_AUTHENTICATED=1000
```

```env
# apps/web/.env
NEXT_PUBLIC_API_URL=https://aimaqaqshamy.kz/api
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
NEXT_PUBLIC_APP_DESCRIPTION=Қоғамдық-саяси газет
```

---

## Генерация секретов

```bash
# Генерация JWT секрета
openssl rand -base64 48

# Или с Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## Проверка конфигурации

```bash
# API
cd apps/api
node -e "require('dotenv').config(); console.log(process.env)"

# Web
cd apps/web
node -e "require('dotenv').config(); console.log(process.env)"
```
