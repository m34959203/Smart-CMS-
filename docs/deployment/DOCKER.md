# Docker развертывание

Руководство по развертыванию с использованием Docker.

## Структура

```
AIMAK/
├── docker-compose.yml      # Основная конфигурация
├── apps/
│   ├── api/
│   │   └── Dockerfile     # Docker образ API
│   └── web/
│       └── Dockerfile     # Docker образ Web
└── .dockerignore          # Игнорируемые файлы
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: aimak-postgres
    environment:
      POSTGRES_DB: aimak_db
      POSTGRES_USER: aimak_user
      POSTGRES_PASSWORD: aimak_password_2024
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - aimak-network
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    container_name: aimak-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - aimak-network
    restart: unless-stopped

  # API (NestJS)
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: aimak-api
    environment:
      - DATABASE_URL=postgresql://aimak_user:aimak_password_2024@postgres:5432/aimak_db?schema=public
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PORT=4000
      - NODE_ENV=production
    ports:
      - "4000:4000"
    volumes:
      - ./apps/api/uploads:/app/uploads
    depends_on:
      - postgres
      - redis
    networks:
      - aimak-network
    restart: unless-stopped

  # Web (Next.js)
  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: aimak-web
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000/api
    ports:
      - "3000:3000"
    depends_on:
      - api
    networks:
      - aimak-network
    restart: unless-stopped

networks:
  aimak-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## Dockerfile для API

```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine AS base

# Установка pnpm
RUN npm install -g pnpm

# Установка зависимостей
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Сборка
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Копирование необходимых файлов
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Создание директории для uploads
RUN mkdir -p uploads

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

## Dockerfile для Web

```dockerfile
# apps/web/Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

# Установка зависимостей
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Сборка
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## Команды

### Запуск в development

```bash
# Только базы данных
docker-compose up -d postgres redis

# С приложениями
docker-compose up -d
```

### Пересборка

```bash
# Пересборка одного сервиса
docker-compose build api

# Пересборка всех
docker-compose build --no-cache
```

### Логи

```bash
# Все сервисы
docker-compose logs -f

# Один сервис
docker-compose logs -f api
```

### Остановка

```bash
# Остановка
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

## Миграции в Docker

```bash
# Запуск миграций
docker-compose exec api npx prisma migrate deploy

# Prisma Studio
docker-compose exec api npx prisma studio
```

## Production с Nginx

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: aimak-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
    networks:
      - aimak-network
    restart: unless-stopped
```

## Мониторинг

```bash
# Статус контейнеров
docker-compose ps

# Ресурсы
docker stats

# Проверка здоровья
docker-compose exec api curl localhost:4000/api/health
```
