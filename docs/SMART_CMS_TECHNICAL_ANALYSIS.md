# Технический Анализ Smart CMS (AIMAK)

## Резюме Проекта

| Параметр | Значение |
|----------|----------|
| **Тип** | Двуязычная CMS для редакций СМИ с AI |
| **Архитектура** | Монорепозиторий (pnpm workspaces) |
| **Backend** | NestJS 10 + Prisma + PostgreSQL |
| **Frontend** | Next.js 14 + React 18 + TailwindCSS |
| **AI** | OpenRouter API (перевод, категоризация, теги) |
| **Соцсети** | Telegram, Instagram, TikTok, Facebook |
| **Размер** | 26 МБ, 184 TypeScript файла |

---

## 1. Архитектура Системы

```
┌─────────────────────────────────────────────────────────────────┐
│                         SMART CMS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Next.js    │    │   NestJS     │    │  PostgreSQL  │       │
│  │   Frontend   │───▶│   Backend    │───▶│   Database   │       │
│  │   :3000      │    │   :4000      │    │   :5432      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                                    │
│         │                   │            ┌──────────────┐       │
│         │                   ├───────────▶│    Redis     │       │
│         │                   │            │   (Cache)    │       │
│         │                   │            └──────────────┘       │
│         │                   │                                    │
│         │                   │            ┌──────────────┐       │
│         │                   ├───────────▶│  OpenRouter  │       │
│         │                   │            │   (AI API)   │       │
│         │                   │            └──────────────┘       │
│         │                   │                                    │
│         │                   │            ┌──────────────┐       │
│         │                   └───────────▶│ Social APIs  │       │
│         │                                │ TG/IG/TT/FB  │       │
│         │                                └──────────────┘       │
│         │                                                        │
│         │                   ┌──────────────┐                    │
│         └──────────────────▶│   Supabase   │                    │
│                             │  (Storage)   │                    │
│                             └──────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Структура Проекта

```
AIMAK/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── advertisements/ # Рекламные блоки
│   │   │   ├── articles/       # Статьи + AI
│   │   │   ├── auth/           # JWT аутентификация
│   │   │   ├── categories/     # Категории (иерархия)
│   │   │   ├── common/         # Prisma, Supabase, Storage
│   │   │   ├── health/         # Health check + PM2
│   │   │   ├── magazine-issues/# PDF журналы
│   │   │   ├── media/          # Загрузка файлов
│   │   │   ├── social-media/   # Telegram/IG/TT/FB
│   │   │   ├── tags/           # Теги + AI генерация
│   │   │   ├── translation/    # AI перевод KZ↔RU
│   │   │   └── users/          # Пользователи
│   │   └── prisma/             # Схема БД + миграции
│   │
│   └── web/                    # Next.js Frontend
│       └── src/
│           ├── app/            # App Router
│           │   ├── [lang]/     # Мультиязычность
│           │   └── admin/      # Админ-панель
│           ├── components/     # React компоненты
│           ├── hooks/          # Custom хуки
│           ├── store/          # Zustand
│           └── lib/            # Утилиты
│
├── docs/                       # Документация
├── docker-compose.yml          # Docker конфиг
└── ecosystem.config.js         # PM2 production
```

---

## 3. Технологический Стек

### Backend

| Технология | Версия | Назначение |
|------------|--------|------------|
| NestJS | 10.3.0 | Фреймворк |
| Prisma | 5.7.1 | ORM |
| PostgreSQL | 15 | База данных |
| Redis | 7 | Кеширование |
| Passport.js | 4.0.1 | Аутентификация |
| Swagger | 7.1.17 | API документация |
| Multer | 1.4.5 | Загрузка файлов |
| Supabase | 2.84.0 | Облачное хранилище |
| axios | 1.13.2 | HTTP клиент |

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 14.0.4 | Фреймворк |
| React | 18.2.0 | UI библиотека |
| TailwindCSS | 3.4.0 | Стили |
| Zustand | 4.4.7 | State management |
| react-hook-form | 7.49.2 | Формы |
| Zod | 3.22.4 | Валидация |
| TipTap | 2.1.13 | WYSIWYG редактор |
| React Query | 5.14.2 | Data fetching |
| react-pdf | 10.2.0 | PDF просмотр |

---

## 4. База Данных (12 моделей)

### Основные модели

```prisma
model User {
  id, email, password (bcrypt)
  firstName, lastName, avatarUrl
  role: USER | EDITOR | ADMIN
  articles[], magazineIssues[]
}

model Article {
  // Двуязычный контент
  titleKz, titleRu
  contentKz, contentRu
  excerptKz, excerptRu

  // Статус публикации
  status: DRAFT | REVIEW | SCHEDULED | PUBLISHED | ARCHIVED

  // Флаги
  isBreaking, isFeatured, isPinned
  autoPublishEnabled

  // AI
  aiGenerated, aiProvider

  // Связи
  author, category, tags[], publications[]
}

model Category {
  nameKz, nameRu, slug
  parentId → children[] // Иерархия
}

model Tag {
  nameKz, nameRu, slug
  usageCount
  articles[]
}

model SocialMediaConfig {
  platform: TELEGRAM | INSTAGRAM | TIKTOK | FACEBOOK
  enabled, defaultLanguage
  // Креденшиалы для каждой платформы
}

model SocialMediaPublication {
  articleId, platform
  status: PENDING | SUCCESS | FAILED
  externalId, error
}
```

---

## 5. API Эндпоинты

### Аутентификация
```
POST /api/auth/register     # Регистрация
POST /api/auth/login        # Вход
GET  /api/auth/me           # Текущий пользователь
```

### Статьи
```
GET    /api/articles        # Список (фильтры, пагинация)
GET    /api/articles/:id    # По ID
GET    /api/articles/slug/:slug
POST   /api/articles        # Создать (EDITOR+)
PATCH  /api/articles/:id    # Обновить (EDITOR+)
DELETE /api/articles/:id    # Удалить (ADMIN)
POST   /api/articles/:id/analyze    # AI анализ
```

### AI
```
POST /api/translation/translate-text     # Перевод текста
POST /api/translation/translate-article  # Перевод статьи
POST /api/tags/generate                  # Генерация тегов
```

### Социальные сети
```
POST /api/social-media/publish           # Опубликовать
GET  /api/social-media/config            # Конфигурации
PUT  /api/social-media/config/:platform  # Обновить
GET  /api/social-media/publications/:id  # История
```

### Полная документация
```
GET /api/docs                            # Swagger UI
```

---

## 6. AI Интеграции (OpenRouter)

### Функции

| Функция | Описание | Модель |
|---------|----------|--------|
| **Перевод** | KZ ↔ RU автоматически | deepseek-r1t2-chimera |
| **Категоризация** | AI выбирает категорию | qwen3-4b (fallback) |
| **Генерация тегов** | 3-5 тегов на двух языках | gemini-2.0-flash (fallback) |

### Retry логика
- 3 попытки с экспоненциальным backoff
- Автоматический fallback между моделями
- Логирование в таблицу `AIGeneration`

### Конфигурация
```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=tngtech/deepseek-r1t2-chimera:free
```

---

## 7. Интеграции с Социальными Сетями

### Telegram
- **Функции:** sendMessage, sendPhoto
- **Форматирование:** HTML
- **Fallback:** текст если фото не загрузилось

### Instagram
- **Публикация:** изображения, Reels (видео)
- **Webhooks:** комментарии, упоминания
- **API:** Graph API v21.0

### TikTok
- **OAuth:** авторизация через TikTok
- **Публикация:** фото-посты
- **Статус:** проверка IN_PROGRESS → PUBLISH_COMPLETE

### Facebook
- **Публикация:** текст, фото, ссылки
- **API:** Graph API v21.0

### Общий процесс
```
1. Получить статью
2. Проверить дубликаты
3. Форматировать контент (KZ/RU)
4. Параллельная отправка во все платформы
5. Логирование в SocialMediaPublication
```

---

## 8. Безопасность

| Компонент | Реализация |
|-----------|------------|
| Аутентификация | JWT (15 мин) + Refresh (7 дней) |
| Пароли | bcryptjs (salt=10) |
| Авторизация | RBAC: USER, EDITOR, ADMIN |
| Валидация | class-validator + Zod |
| CORS | Настраиваемые origins |
| Файлы | MIME проверка, лимиты размера |
| SQL | Prisma ORM (injection protection) |

---

## 9. Deployment

### Development
```bash
pnpm install
pnpm dev           # Запуск обоих приложений
```

### Production
```bash
pnpm build
pnpm start         # или через PM2
pm2 start ecosystem.config.js
```

### Docker
```yaml
services:
  postgres: postgres:15-alpine
  redis: redis:7-alpine
```

### Окружение
```env
# Обязательные
DATABASE_URL=postgresql://...
JWT_SECRET=...
OPENROUTER_API_KEY=...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Опциональные
SUPABASE_URL=...
REDIS_HOST=localhost
```

---

## 10. Метрики Кодовой Базы

| Метрика | Значение |
|---------|----------|
| TypeScript файлов | 184 |
| NestJS модулей | 15 |
| API контроллеров | 15 |
| Сервисов | 23+ |
| Frontend компонентов | 20+ |
| Custom хуков | 10 |
| Prisma моделей | 12 |
| Строк (articles.service) | 1016 |

---

## 11. Уникальные Особенности

| Особенность | Описание |
|-------------|----------|
| **Двуязычность** | Полная поддержка KZ/RU во всех сущностях |
| **AI перевод** | Автоматический перевод статей |
| **AI категоризация** | Умное определение категории |
| **AI теги** | Генерация релевантных тегов |
| **4 соцсети** | Telegram, Instagram, TikTok, Facebook |
| **Instagram Webhooks** | Real-time уведомления |
| **PDF журналы** | Онлайн просмотр с react-pdf |
| **Рекламная система** | Множественные позиции и типы |
| **PM2 мониторинг** | Управление процессами из админки |
| **TipTap редактор** | WYSIWYG с изображениями |

---

## 12. Рекомендации по Развитию

### Краткосрочные (1-3 мес)
- [ ] Увеличить тестовое покрытие (сейчас < 30%)
- [ ] Добавить rate limiting
- [ ] Настроить CI/CD pipeline
- [ ] Оптимизировать N+1 запросы в статьях

### Среднесрочные (3-6 мес)
- [ ] Добавить аналитику просмотров (PostHog/Plausible)
- [ ] Реализовать полнотекстовый поиск (PostgreSQL FTS)
- [ ] Добавить систему комментариев для читателей
- [ ] Внедрить A/B тестирование заголовков

### Долгосрочные (6-12 мес)
- [ ] Multi-tenant архитектура (несколько редакций)
- [ ] Mobile приложение (React Native)
- [ ] Рекомендательная система на AI
- [ ] Self-hosted AI модели (llama.cpp)

---

## 13. Заключение

**Smart CMS (AIMAK)** — это production-ready система управления контентом для СМИ Казахстана с уникальными возможностями:

- **Работает в production** на aimaqaqshamy.kz
- **Полная двуязычность** (казахский/русский)
- **AI-автоматизация** переводов и категоризации
- **Мультиплатформенная публикация** в 4 соцсети
- **Современный стек** (Next.js 14, NestJS 10)
- **Хорошая документация** (15+ документов)

Проект готов к масштабированию и коммерциализации.
