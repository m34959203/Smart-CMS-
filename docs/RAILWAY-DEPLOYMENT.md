# Развертывание на Railway.com

Это руководство описывает процесс развертывания Smart CMS (Aimak Akshamy) на платформе Railway.

## Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Предварительные требования](#предварительные-требования)
3. [Создание проекта на Railway](#создание-проекта-на-railway)
4. [Настройка базы данных PostgreSQL](#настройка-базы-данных-postgresql)
5. [Настройка Redis](#настройка-redis)
6. [Развертывание API сервиса](#развертывание-api-сервиса)
7. [Развертывание Web сервиса](#развертывание-web-сервиса)
8. [Настройка переменных окружения](#настройка-переменных-окружения)
9. [Настройка доменов](#настройка-доменов)
10. [Мониторинг и логи](#мониторинг-и-логи)
11. [Устранение неполадок](#устранение-неполадок)

---

## Обзор архитектуры

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway Project                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Web        │    │    API       │    │  PostgreSQL  │  │
│  │  (Next.js)   │───▶│  (NestJS)    │───▶│   Database   │  │
│  │  Port: 3000  │    │  Port: 4000  │    │  Port: 5432  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                             │                               │
│                             ▼                               │
│                      ┌──────────────┐                      │
│                      │    Redis     │                      │
│                      │    Cache     │                      │
│                      │  Port: 6379  │                      │
│                      └──────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Предварительные требования

1. Аккаунт на [Railway.com](https://railway.app)
2. Git репозиторий с проектом (GitHub, GitLab, или Bitbucket)
3. (Опционально) Supabase аккаунт для хранения медиафайлов
4. (Опционально) OpenRouter API ключ для AI функций

---

## Создание проекта на Railway

### Шаг 1: Создание нового проекта

1. Войдите в [Railway Dashboard](https://railway.app/dashboard)
2. Нажмите **"New Project"**
3. Выберите **"Empty Project"**

### Шаг 2: Подключение репозитория

1. В созданном проекте нажмите **"Add New Service"**
2. Выберите **"GitHub Repo"**
3. Авторизуйте Railway для доступа к вашему репозиторию
4. Выберите репозиторий `Smart-CMS-`

---

## Настройка базы данных PostgreSQL

### Шаг 1: Добавление PostgreSQL

1. В проекте нажмите **"Add New Service"**
2. Выберите **"Database"** → **"PostgreSQL"**
3. Railway автоматически создаст базу данных

### Шаг 2: Получение URL подключения

1. Нажмите на сервис PostgreSQL
2. Перейдите во вкладку **"Variables"**
3. Скопируйте значение `DATABASE_URL`

---

## Настройка Redis

### Шаг 1: Добавление Redis

1. В проекте нажмите **"Add New Service"**
2. Выберите **"Database"** → **"Redis"**
3. Railway автоматически создаст Redis инстанс

### Шаг 2: Получение URL подключения

1. Нажмите на сервис Redis
2. Перейдите во вкладку **"Variables"**
3. Скопируйте значение `REDIS_URL`

---

## Развертывание API сервиса

### Шаг 1: Создание сервиса

1. Нажмите **"Add New Service"** → **"GitHub Repo"**
2. Выберите тот же репозиторий
3. Назовите сервис `api`

### Шаг 2: Настройка сборки

1. Перейдите в **Settings** → **Build**
2. Установите:
   - **Root Directory**: `/` (корень репозитория)
   - **Watch Paths**: `apps/api/**`

3. Перейдите во вкладку **Variables** и добавьте:
   ```
   RAILWAY_DOCKERFILE_PATH=Dockerfile.api
   ```

### Шаг 3: Настройка деплоя

1. Перейдите в **Settings** → **Deploy**
2. Установите:
   - **Health Check Path**: `/api/health`
   - **Health Check Timeout**: `30`

### Шаг 4: Настройка переменных

Перейдите во вкладку **Variables** и добавьте:

```env
# Ссылка на базу данных (из PostgreSQL сервиса)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Ссылка на Redis (из Redis сервиса)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}

# Приложение
NODE_ENV=production
PORT=4000

# JWT (сгенерируйте безопасные ключи)
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=ваш-секретный-refresh-ключ-минимум-32-символа
JWT_REFRESH_EXPIRES_IN=7d

# CORS (укажите URL вашего web сервиса после деплоя)
FRONTEND_URL=https://your-web-service.up.railway.app
CORS_ORIGIN=https://your-web-service.up.railway.app

# URL API (укажите URL этого сервиса после деплоя)
APP_URL=https://your-api-service.up.railway.app

# Загрузка файлов
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

---

## Развертывание Web сервиса

### Шаг 1: Создание сервиса

1. Нажмите **"Add New Service"** → **"GitHub Repo"**
2. Выберите тот же репозиторий
3. Назовите сервис `web`

### Шаг 2: Настройка сборки

1. Перейдите в **Settings** → **Build**
2. Установите:
   - **Root Directory**: `/` (корень репозитория)
   - **Watch Paths**: `apps/web/**`

3. Перейдите во вкладку **Variables** и добавьте:
   ```
   RAILWAY_DOCKERFILE_PATH=Dockerfile.web
   ```

### Шаг 3: Настройка переменных

Перейдите во вкладку **Variables** и добавьте:

```env
# URL API сервиса
NEXT_PUBLIC_API_URL=https://your-api-service.up.railway.app/api

# Информация о приложении
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
NEXT_PUBLIC_APP_DESCRIPTION=City Newspaper
```

> **Важно**: Замените `your-api-service` на реальное имя вашего API сервиса в Railway.

---

## Настройка переменных окружения

### Использование Railway References

Railway позволяет ссылаться на переменные других сервисов:

```env
# Ссылка на PostgreSQL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Ссылка на Redis
REDIS_URL=${{Redis.REDIS_URL}}

# Ссылка на другой сервис
API_URL=${{api.RAILWAY_PUBLIC_DOMAIN}}
```

### Генерация секретных ключей

Для генерации безопасных JWT ключей используйте:

```bash
# Linux/macOS
openssl rand -base64 32

# Или через Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Дополнительные переменные (опционально)

```env
# Supabase Storage (рекомендуется для Railway)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
SUPABASE_BUCKET=aimak-media

# AI Features (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=tngtech/deepseek-r1t2-chimera:free

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@aimak.kz
```

---

## Настройка доменов

### Railway домены

По умолчанию Railway предоставляет домены вида:
- `your-service.up.railway.app`

### Пользовательские домены

1. Перейдите в сервис → **Settings** → **Networking**
2. Нажмите **"Add Custom Domain"**
3. Введите ваш домен (например, `api.aimak.kz`)
4. Добавьте CNAME запись в DNS:
   ```
   CNAME api.aimak.kz → your-service.up.railway.app
   ```

---

## Мониторинг и логи

### Просмотр логов

1. Нажмите на сервис
2. Перейдите во вкладку **"Logs"**
3. Используйте фильтры для поиска

### Метрики

1. Перейдите во вкладку **"Metrics"**
2. Просматривайте:
   - CPU usage
   - Memory usage
   - Network I/O

### Health Checks

API сервис имеет эндпоинт `/api/health` для проверки состояния.

---

## Устранение неполадок

### Проблема: Сборка не проходит

**Решение:**
1. Проверьте логи сборки
2. Убедитесь, что `Dockerfile` path указан правильно
3. Проверьте, что все зависимости установлены

### Проблема: Ошибка подключения к базе данных

**Решение:**
1. Проверьте, что PostgreSQL сервис запущен
2. Убедитесь, что `DATABASE_URL` правильно настроен
3. Проверьте, что миграции выполнились

### Проблема: CORS ошибки

**Решение:**
1. Убедитесь, что `FRONTEND_URL` и `CORS_ORIGIN` указывают на правильный домен
2. Проверьте, что URL включает протокол `https://`

### Проблема: Изображения не загружаются

**Решение:**
1. Для persistent storage используйте Supabase или другое облачное хранилище
2. Railway filesystem не сохраняется между деплоями

---

## Команды для локальной отладки

```bash
# Сборка Docker образа API
docker build -f Dockerfile.api -t smart-cms-api .

# Сборка Docker образа Web
docker build -f Dockerfile.web -t smart-cms-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api .

# Запуск контейнеров локально
docker run -p 4000:4000 --env-file apps/api/.env smart-cms-api
docker run -p 3000:3000 smart-cms-web
```

---

## Полезные ссылки

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Templates](https://railway.app/templates)
- [Prisma on Railway](https://docs.railway.app/guides/prisma)

---

## Примерная стоимость

Railway использует модель оплаты по использованию:

| Ресурс | Примерная стоимость |
|--------|---------------------|
| PostgreSQL (1GB) | ~$5/месяц |
| Redis (100MB) | ~$3/месяц |
| API Service | ~$5-10/месяц |
| Web Service | ~$5-10/месяц |
| **Итого** | **~$18-28/месяц** |

> Railway предоставляет $5 бесплатных кредитов ежемесячно для Hobby плана.
