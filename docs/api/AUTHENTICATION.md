# Аутентификация и авторизация

## Обзор

Система использует JWT (JSON Web Tokens) для аутентификации с поддержкой refresh токенов.

## Роли пользователей

| Роль | Права |
|------|-------|
| **USER** | Просмотр контента, комментирование |
| **EDITOR** | + Создание/редактирование статей, загрузка файлов |
| **ADMIN** | + Управление категориями, пользователями, настройками |

## JWT токены

### Access Token
- Время жизни: 15 минут (по умолчанию)
- Используется для авторизации запросов
- Передается в заголовке `Authorization`

### Refresh Token
- Время жизни: 7 дней (по умолчанию)
- Используется для обновления access токена
- Хранится в httpOnly cookie

## Процесс аутентификации

```
┌────────────┐         ┌────────────┐         ┌────────────┐
│   Client   │         │    API     │         │  Database  │
└─────┬──────┘         └─────┬──────┘         └─────┬──────┘
      │                      │                      │
      │  1. POST /auth/login │                      │
      │  { email, password } │                      │
      │─────────────────────>│                      │
      │                      │  2. Validate user    │
      │                      │─────────────────────>│
      │                      │<─────────────────────│
      │                      │                      │
      │  3. { accessToken,   │                      │
      │       user }         │                      │
      │<─────────────────────│                      │
      │                      │                      │
      │  4. GET /api/articles│                      │
      │  Authorization: Bearer token                │
      │─────────────────────>│                      │
      │                      │  5. Validate token   │
      │                      │  6. Fetch data       │
      │                      │─────────────────────>│
      │  7. { articles }     │<─────────────────────│
      │<─────────────────────│                      │
```

## Регистрация

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "Имя",
  "lastName": "Фамилия"
}
```

**Валидация:**
- Email: валидный формат, уникальный
- Password: минимум 6 символов
- firstName, lastName: обязательные поля

**Ответ:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "role": "USER",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Вход

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Ответ:**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Использование токена

Добавьте токен в заголовок Authorization:

```bash
GET /api/articles
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Получение текущего пользователя

```bash
GET /api/auth/me
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Имя",
  "lastName": "Фамилия",
  "role": "EDITOR",
  "avatarUrl": null,
  "bio": null,
  "isActive": true,
  "isVerified": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "lastLoginAt": "2024-01-20T08:30:00Z"
}
```

## Защита эндпоинтов

### Публичные эндпоинты

Декоратор `@Public()` делает эндпоинт доступным без токена:

```typescript
@Public()
@Get('articles')
findAll() { ... }
```

### Проверка ролей

Декоратор `@Roles()` ограничивает доступ:

```typescript
@Roles(Role.ADMIN)
@Delete('articles/:id')
remove(@Param('id') id: string) { ... }
```

### Получение текущего пользователя

Декоратор `@CurrentUser()` инжектит пользователя:

```typescript
@Post('articles')
create(
  @CurrentUser() user: User,
  @Body() dto: CreateArticleDto
) {
  return this.service.create(dto, user.id);
}
```

## Настройка в .env

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another-super-secret-key
JWT_REFRESH_EXPIRES_IN=7d
```

## Безопасность

### Хеширование паролей

Пароли хешируются с использованием bcrypt (10 раундов):

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### Валидация токена

JWT токен содержит:
- `sub`: ID пользователя
- `email`: Email пользователя
- `role`: Роль пользователя
- `iat`: Время создания
- `exp`: Время истечения

### CORS

Настройка в `main.ts`:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## Ошибки аутентификации

| Код | Сообщение | Причина |
|-----|-----------|---------|
| 401 | Unauthorized | Токен отсутствует или недействителен |
| 401 | Invalid credentials | Неверный email или пароль |
| 401 | Token expired | Токен истек |
| 403 | Forbidden | Недостаточно прав |

## Пример клиента (TypeScript)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Логин
async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', data.accessToken);
  return data.user;
}

// Защищенный запрос
async function getArticles() {
  const { data } = await api.get('/articles');
  return data;
}
```
