# Frontend документация

## Обзор

Frontend построен на Next.js 14 с использованием App Router и React 18.

## Технологии

| Технология | Версия | Назначение |
|------------|--------|------------|
| Next.js | 14.0.4 | Фреймворк |
| React | 18.2.0 | UI библиотека |
| TailwindCSS | 3.4.0 | Стилизация |
| Zustand | 4.4.7 | State management |
| React Query | 5.14.2 | Серверное состояние |
| TipTap | 2.1.13 | Rich text редактор |
| Axios | 1.6.2 | HTTP клиент |
| Zod | 3.22.4 | Валидация |
| React Hook Form | 7.49.2 | Формы |

## Структура проекта

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── [lang]/             # Мультиязычные маршруты
│   │   ├── [category]/     # Категория
│   │   │   └── [slug]/     # Статья
│   │   ├── about/          # О нас
│   │   ├── contacts/       # Контакты
│   │   ├── issues/         # Журнал
│   │   ├── login/          # Вход
│   │   └── register/       # Регистрация
│   │
│   ├── admin/              # Админ-панель
│   │   ├── articles/       # Управление статьями
│   │   ├── categories/     # Категории
│   │   ├── tags/           # Теги
│   │   ├── magazine-issues/# Журнал
│   │   ├── advertisements/ # Реклама
│   │   ├── settings/       # Настройки
│   │   └── system/         # Системная информация
│   │
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Главная страница
│   └── globals.css         # Глобальные стили
│
├── components/             # React компоненты
│   ├── ui/                 # UI библиотека
│   └── ...                 # Специализированные
│
├── hooks/                  # Custom React хуки
├── lib/                    # Утилиты
├── store/                  # Zustand stores
└── types/                  # TypeScript типы
```

## Запуск

```bash
# Development
cd apps/web
pnpm dev

# Production build
pnpm build
pnpm start
```

## Переменные окружения

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
NEXT_PUBLIC_APP_DESCRIPTION=City Newspaper
```

## Документация

- [Компоненты](./COMPONENTS.md)
- [React хуки](./HOOKS.md)

## Мультиязычность

Приложение поддерживает два языка:
- Казахский (kz) - основной
- Русский (ru)

Маршруты строятся по схеме: `/{lang}/{category}/{slug}`

Пример: `/kz/saiasat/zhana-zanalar` или `/ru/politika/novye-zakony`

## State Management

### Zustand (клиентское состояние)

```typescript
// store/auth-store.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null, token: null }),
}));
```

### React Query (серверное состояние)

```typescript
// hooks/use-articles.ts
import { useQuery, useMutation } from '@tanstack/react-query';

export function useArticles(params?: ArticleFilters) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.get('/articles', { params }),
  });
}

export function useCreateArticle() {
  return useMutation({
    mutationFn: (data: CreateArticleDto) =>
      api.post('/articles', data),
  });
}
```

## Стилизация

Используется TailwindCSS с кастомной конфигурацией:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'tilt': 'tilt 10s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
};
```
