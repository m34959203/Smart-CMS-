# База данных

## Обзор

Проект использует PostgreSQL 15 как основную базу данных и Redis 7 для кэширования. ORM - Prisma 5.7.

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| PostgreSQL | 15 | Основная БД |
| Redis | 7 | Кэширование, очереди |
| Prisma | 5.7.1 | ORM |

## Подключение

### Development (Docker)

```bash
# Запуск контейнеров
docker-compose up -d postgres redis

# Подключение
DATABASE_URL="postgresql://aimak_user:aimak_password_2024@localhost:5432/aimak_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Production

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
REDIS_HOST=redis-host
REDIS_PORT=6379
```

## Prisma команды

```bash
# Применить миграции
pnpm db:migrate

# Создать новую миграцию
cd apps/api && npx prisma migrate dev --name migration_name

# Открыть Prisma Studio
pnpm db:studio

# Сгенерировать клиент
npx prisma generate

# Сбросить БД
npx prisma migrate reset

# Seed данные
pnpm db:seed
```

## Структура файлов

```
apps/api/prisma/
├── schema.prisma       # Главная схема
├── migrations/         # История миграций
│   └── 20240115_init/
│       └── migration.sql
└── seed.ts             # Начальные данные
```

## Документация

- [Схема базы данных](./SCHEMA.md)
- [Описание моделей](./MODELS.md)

## Диаграмма связей

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Article   │>────│  Category   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │ │
                          │ └────────────────────┐
                          │                      │
                    ┌─────┴─────┐          ┌─────┴─────┐
                    │    Tag    │          │  Comment  │
                    └───────────┘          └───────────┘

┌─────────────┐     ┌───────────────────┐
│ MagazineIss │     │ SocialMediaPubl.  │
└─────────────┘     └───────────────────┘

┌─────────────┐     ┌─────────────┐
│ MediaFile   │     │Advertisement│
└─────────────┘     └─────────────┘
```

## Резервное копирование

### PostgreSQL dump

```bash
# Экспорт
pg_dump -h localhost -U aimak_user -d aimak_db > backup.sql

# Импорт
psql -h localhost -U aimak_user -d aimak_db < backup.sql
```

### Docker volume backup

```bash
# Backup
docker run --rm -v aimak_postgres_data:/data -v $(pwd):/backup alpine tar cvf /backup/postgres_backup.tar /data

# Restore
docker run --rm -v aimak_postgres_data:/data -v $(pwd):/backup alpine tar xvf /backup/postgres_backup.tar -C /
```
