# Smart CMS Documentation Index

> Полная документация системы Smart CMS by MDTechnology

---

## Quick Links

| Документ | Описание |
|----------|----------|
| [README](../README.md) | Главная страница проекта |
| [ARCHITECTURE](./ARCHITECTURE.md) | Архитектура системы |
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | Краткое описание проекта |
| [Astana Hub Application](./ASTANA_HUB_APPLICATION.md) | Материалы для заявки |

---

## Core Documentation

### Architecture & Overview

| Документ | Описание |
|----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Общая архитектура системы |
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | Краткое описание проекта |
| [SMART_CMS_TECHNICAL_ANALYSIS.md](./SMART_CMS_TECHNICAL_ANALYSIS.md) | Технический анализ |

### Business & Planning

| Документ | Описание |
|----------|----------|
| [ASTANA_HUB_APPLICATION.md](./ASTANA_HUB_APPLICATION.md) | Заявка в Astana Hub ScaleUp |
| [BUSINESS_PLAN_ANALYSIS.md](./BUSINESS_PLAN_ANALYSIS.md) | Анализ бизнес-плана |
| [FINANCIAL_MODEL.md](./FINANCIAL_MODEL.md) | Финансовая модель |
| [ROADMAP.md](./ROADMAP.md) | Дорожная карта 2025-2028 |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | План реализации |

### Product Features

| Документ | Описание |
|----------|----------|
| [EDITORIAL_TOOLS.md](./EDITORIAL_TOOLS.md) | Редакторские инструменты |
| [EDITORIAL_FEATURES_ROADMAP.md](./EDITORIAL_FEATURES_ROADMAP.md) | Roadmap редакторских функций |
| [NEWS_PARSER_SYSTEM.md](./NEWS_PARSER_SYSTEM.md) | Система парсинга новостей |
| [TIKTOK_INTEGRATION.md](./TIKTOK_INTEGRATION.md) | Интеграция TikTok |

---

## API Documentation

| Документ | Описание |
|----------|----------|
| [api/README.md](./api/README.md) | Обзор API |
| [api/ENDPOINTS.md](./api/ENDPOINTS.md) | Список всех endpoints |
| [api/AUTHENTICATION.md](./api/AUTHENTICATION.md) | Аутентификация JWT |

---

## Database Documentation

| Документ | Описание |
|----------|----------|
| [database/README.md](./database/README.md) | Обзор базы данных |
| [database/SCHEMA.md](./database/SCHEMA.md) | Схема БД и ER-диаграмма |
| [database/MODELS.md](./database/MODELS.md) | Описание моделей Prisma |

---

## Frontend Documentation

| Документ | Описание |
|----------|----------|
| [frontend/README.md](./frontend/README.md) | Обзор frontend |
| [frontend/COMPONENTS.md](./frontend/COMPONENTS.md) | Каталог компонентов |
| [frontend/HOOKS.md](./frontend/HOOKS.md) | Custom React hooks |

---

## Deployment Documentation

| Документ | Описание |
|----------|----------|
| [deployment/README.md](./deployment/README.md) | Обзор развертывания |
| [deployment/DOCKER.md](./deployment/DOCKER.md) | Docker контейнеризация |
| [deployment/ENVIRONMENT.md](./deployment/ENVIRONMENT.md) | Переменные окружения |

### Platform-specific

| Документ | Платформа |
|----------|-----------|
| [deployment/VPS_SETUP.md](./deployment/VPS_SETUP.md) | VPS (Ubuntu/Debian) |
| [deployment/PLESK.md](./deployment/PLESK.md) | Plesk Hosting |
| [deployment/PS_KZ.md](./deployment/PS_KZ.md) | PS.kz Hosting |
| [deployment/RENDER.md](./deployment/RENDER.md) | Render.com |
| [RAILWAY-DEPLOYMENT.md](./RAILWAY-DEPLOYMENT.md) | Railway.com |

### Configuration Files

| Файл | Описание |
|------|----------|
| [deployment/nginx/vps.conf](./deployment/nginx/vps.conf) | Nginx для VPS |
| [deployment/nginx/plesk.conf](./deployment/nginx/plesk.conf) | Nginx для Plesk |
| [deployment/env-examples/](./deployment/env-examples/) | Примеры .env файлов |

---

## Guides (Руководства)

### Social Media Integration

| Документ | Описание |
|----------|----------|
| [guides/SOCIAL_MEDIA.md](./guides/SOCIAL_MEDIA.md) | Общее руководство |
| [guides/INSTAGRAM_SETUP.md](./guides/INSTAGRAM_SETUP.md) | Настройка Instagram |
| [guides/INSTAGRAM_TOKEN.md](./guides/INSTAGRAM_TOKEN.md) | Получение токена Instagram |
| [guides/FACEBOOK_APP_REVIEW.md](./guides/FACEBOOK_APP_REVIEW.md) | Ревью Facebook приложения |

### Other Integrations

| Документ | Описание |
|----------|----------|
| [guides/ADVERTISING.md](./guides/ADVERTISING.md) | Рекламная система |
| [guides/TRANSLATIONS.md](./guides/TRANSLATIONS.md) | AI-переводы KZ↔RU |
| [guides/N8N_INTEGRATION.md](./guides/N8N_INTEGRATION.md) | Интеграция n8n |

### Development & Setup

| Документ | Описание |
|----------|----------|
| [guides/LOCAL_TESTING.md](./guides/LOCAL_TESTING.md) | Локальное тестирование |
| [guides/DOMAIN_FIX.md](./guides/DOMAIN_FIX.md) | Настройка домена |
| [guides/SSH_SETUP_WINDOWS.md](./guides/SSH_SETUP_WINDOWS.md) | SSH на Windows |

---

## News Parser System

| Документ | Описание |
|----------|----------|
| [news-parser/01-TECHNICAL-SPECIFICATION.md](./news-parser/01-TECHNICAL-SPECIFICATION.md) | Техническая спецификация |
| [news-parser/03-API-SPECIFICATION.md](./news-parser/03-API-SPECIFICATION.md) | API спецификация |
| [news-parser/05-UI-SPECIFICATION.md](./news-parser/05-UI-SPECIFICATION.md) | UI спецификация |
| [news-parser/06-IMPLEMENTATION-GUIDE.md](./news-parser/06-IMPLEMENTATION-GUIDE.md) | Руководство по реализации |

---

## Scripts Documentation

Скрипты находятся в папке `/scripts/`:

| Папка | Описание |
|-------|----------|
| `scripts/deploy/` | Скрипты развертывания |
| `scripts/setup/` | Скрипты настройки |
| `scripts/maintenance/` | Скрипты обслуживания |
| `scripts/import/` | Скрипты импорта данных |
| `scripts/scraper/` | Скрипты парсинга |

---

## File Structure

```
docs/
├── INDEX.md                    # Этот файл
├── README.md                   # Обзор документации
├── ARCHITECTURE.md             # Архитектура
├── ASTANA_HUB_APPLICATION.md   # Заявка Astana Hub
├── BUSINESS_PLAN_ANALYSIS.md   # Бизнес-план
├── FINANCIAL_MODEL.md          # Финансовая модель
├── ROADMAP.md                  # Дорожная карта
├── ...
├── api/                        # API документация
├── database/                   # БД документация
├── deployment/                 # Развертывание
│   ├── nginx/                  # Nginx конфиги
│   └── env-examples/           # Примеры .env
├── frontend/                   # Frontend документация
├── guides/                     # Руководства
└── news-parser/                # Парсер новостей
```

---

## Quick Start

1. **Локальная разработка:** [guides/LOCAL_TESTING.md](./guides/LOCAL_TESTING.md)
2. **Docker:** [deployment/DOCKER.md](./deployment/DOCKER.md)
3. **Production:** [deployment/VPS_SETUP.md](./deployment/VPS_SETUP.md)

---

*Документация обновлена: Январь 2026*
