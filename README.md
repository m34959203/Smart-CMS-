# Aimak Akshamy

Двуязычная (казахский/русский) система управления контентом для общественно-политического сетевого издания.

## Технологии

| Компонент | Технология |
|-----------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS, Zustand, React Query |
| Backend | NestJS 10, Prisma, PostgreSQL 15, Redis 7 |
| AI | OpenRouter API (переводы, категоризация, теги) |
| Editor | TipTap (WYSIWYG) |
| Auth | JWT + Passport.js |

## Быстрый старт

```bash
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

## Доступ

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api |
| Swagger | http://localhost:4000/api/docs |
| Prisma Studio | `pnpm db:studio` |

## Структура проекта

```
AIMAK/
├── apps/
│   ├── api/           # NestJS Backend
│   │   ├── src/       # Исходный код
│   │   └── prisma/    # Схема БД
│   └── web/           # Next.js Frontend
│       └── src/       # Исходный код
├── docs/              # Документация
├── scripts/           # Утилиты
└── docker-compose.yml # Docker
```

## Документация

Полная документация в папке [docs/](./docs/README.md):

- **[Архитектура](./docs/ARCHITECTURE.md)** - общая архитектура системы
- **[API](./docs/api/README.md)** - REST API документация
- **[База данных](./docs/database/README.md)** - схема и модели
- **[Frontend](./docs/frontend/README.md)** - компоненты и хуки
- **[Развертывание](./docs/deployment/README.md)** - Docker, VPS, Plesk

### Руководства

- [Мультиязычность](./docs/guides/TRANSLATIONS.md)
- [Социальные сети](./docs/guides/SOCIAL_MEDIA.md)
- [Рекламная система](./docs/guides/ADVERTISING.md)
- [Instagram интеграция](./docs/guides/INSTAGRAM_SETUP.md)

## Основные возможности

- Двуязычный контент (KZ/RU)
- AI-перевод и категоризация
- Публикация в Telegram/Instagram
- PDF-журнал с онлайн просмотром
- Система рекламных блоков
- Ролевая модель (USER/EDITOR/ADMIN)
- WYSIWYG редактор с изображениями

## Скрипты

```bash
pnpm dev          # Development
pnpm build        # Production сборка
pnpm start        # Production запуск
pnpm db:migrate   # Миграции БД
pnpm db:studio    # Prisma Studio
pnpm lint         # Проверка кода
```

## Лицензия

MIT License

---

[Документация на русском](./README_RU.md)
