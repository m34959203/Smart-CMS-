# Aimak Akshamy - Документация проекта

Полная документация системы управления контентом "Aimak Akshamy" - общественно-политического сетевого издания.

## Содержание

### Архитектура
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Общая архитектура системы

### API
- [api/README.md](./api/README.md) - Документация REST API
- [api/ENDPOINTS.md](./api/ENDPOINTS.md) - Полный список эндпоинтов
- [api/AUTHENTICATION.md](./api/AUTHENTICATION.md) - Аутентификация и авторизация

### База данных
- [database/README.md](./database/README.md) - Документация БД
- [database/SCHEMA.md](./database/SCHEMA.md) - Схема базы данных
- [database/MODELS.md](./database/MODELS.md) - Описание моделей

### Frontend
- [frontend/README.md](./frontend/README.md) - Документация фронтенда
- [frontend/COMPONENTS.md](./frontend/COMPONENTS.md) - Компоненты
- [frontend/HOOKS.md](./frontend/HOOKS.md) - React хуки

### Развертывание
- [deployment/README.md](./deployment/README.md) - Общие инструкции
- [deployment/DOCKER.md](./deployment/DOCKER.md) - Docker развертывание
- [deployment/PLESK.md](./deployment/PLESK.md) - Развертывание на Plesk
- [deployment/VPS_SETUP.md](./deployment/VPS_SETUP.md) - Настройка VPS
- [deployment/ENVIRONMENT.md](./deployment/ENVIRONMENT.md) - Переменные окружения
- [deployment/RENDER.md](./deployment/RENDER.md) - Развертывание на Render.com

### Руководства
- [guides/SOCIAL_MEDIA.md](./guides/SOCIAL_MEDIA.md) - Автопубликация в соцсетях
- [guides/ADVERTISING.md](./guides/ADVERTISING.md) - Система рекламы
- [guides/TRANSLATIONS.md](./guides/TRANSLATIONS.md) - Мультиязычность (KZ/RU)
- [guides/INSTAGRAM_SETUP.md](./guides/INSTAGRAM_SETUP.md) - Настройка Instagram
- [guides/INSTAGRAM_TOKEN.md](./guides/INSTAGRAM_TOKEN.md) - Получение Instagram токена
- [guides/FACEBOOK_APP_REVIEW.md](./guides/FACEBOOK_APP_REVIEW.md) - Facebook App Review
- [guides/LOCAL_TESTING.md](./guides/LOCAL_TESTING.md) - Локальное тестирование
- [guides/SSH_SETUP_WINDOWS.md](./guides/SSH_SETUP_WINDOWS.md) - SSH на Windows
- [guides/N8N_INTEGRATION.md](./guides/N8N_INTEGRATION.md) - Интеграция n8n

## Быстрый старт

```bash
# Клонирование
git clone <repository-url>
cd AIMAK

# Установка зависимостей
pnpm install

# Настройка окружения
./scripts/setup-env.sh

# Запуск БД
docker-compose up -d postgres redis

# Миграции
pnpm db:migrate

# Запуск
pnpm dev
```

## Ссылки

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Swagger**: http://localhost:4000/api/docs
- **Prisma Studio**: `pnpm db:studio`
