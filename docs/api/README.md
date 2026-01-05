# API документация

## Обзор

REST API построен на NestJS 10 с использованием Express. Документация Swagger доступна по адресу `/api/docs`.

## Базовый URL

- **Development**: `http://localhost:4000/api`
- **Production**: `https://aimaqaqshamy.kz/api`

## Формат ответов

Все ответы возвращаются в формате JSON:

```json
{
  "data": { ... },
  "message": "Success",
  "statusCode": 200
}
```

Ошибки:
```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}
```

## Аутентификация

API использует JWT Bearer токены. Подробнее в [AUTHENTICATION.md](./AUTHENTICATION.md).

```bash
Authorization: Bearer <access_token>
```

## Модули API

| Модуль | Префикс | Описание |
|--------|---------|----------|
| Auth | `/auth` | Аутентификация |
| Users | `/users` | Управление пользователями |
| Articles | `/articles` | Статьи и контент |
| Categories | `/categories` | Категории |
| Tags | `/tags` | Теги |
| Media | `/media` | Загрузка файлов |
| Magazine | `/magazine-issues` | PDF журнал |
| Translation | `/translation` | AI перевод |
| Social Media | `/social-media` | Соцсети |
| Advertisements | `/advertisements` | Реклама |
| Health | `/health` | Мониторинг |

## Версионирование

Текущая версия: **v1** (без префикса версии в URL)

## Rate Limiting

- Публичные эндпоинты: 100 запросов/минута
- Авторизованные: 1000 запросов/минута

## Swagger UI

Интерактивная документация доступна по адресу:
- **Development**: http://localhost:4000/api/docs
- **Production**: https://aimaqaqshamy.kz/api/docs

## Содержание

- [Полный список эндпоинтов](./ENDPOINTS.md)
- [Аутентификация и авторизация](./AUTHENTICATION.md)
