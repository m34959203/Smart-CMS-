# React хуки

Кастомные React хуки для работы с API и состоянием.

## use-auth.ts

Управление аутентификацией.

```typescript
import { useAuth } from '@/hooks/use-auth';

function Component() {
  const {
    user,           // текущий пользователь
    isLoading,      // загрузка
    isAuthenticated,// авторизован ли
    login,          // функция входа
    register,       // функция регистрации
    logout,         // выход
    refetch,        // обновить данные пользователя
  } = useAuth();

  const handleLogin = async () => {
    await login({ email, password });
  };
}
```

### Методы

| Метод | Параметры | Описание |
|-------|-----------|----------|
| `login` | `{ email, password }` | Вход в систему |
| `register` | `{ email, password, firstName, lastName }` | Регистрация |
| `logout` | - | Выход |
| `refetch` | - | Обновить данные |

---

## use-articles.ts

Работа со статьями.

```typescript
import { useArticles, useArticle, useCreateArticle, useUpdateArticle, useDeleteArticle } from '@/hooks/use-articles';

// Список статей с фильтрацией
const { data, isLoading, error } = useArticles({
  page: 1,
  limit: 10,
  categoryId: 'uuid',
  status: 'PUBLISHED',
  search: 'поиск'
});

// Одна статья по ID
const { data: article } = useArticle(id);

// Статья по slug
const { data: article } = useArticleBySlug(slug);

// Создание
const createMutation = useCreateArticle();
await createMutation.mutateAsync(articleData);

// Обновление
const updateMutation = useUpdateArticle();
await updateMutation.mutateAsync({ id, ...updateData });

// Удаление
const deleteMutation = useDeleteArticle();
await deleteMutation.mutateAsync(id);
```

### useArticles параметры

| Параметр | Тип | Описание |
|----------|-----|----------|
| `page` | number | Страница |
| `limit` | number | Записей на странице |
| `categoryId` | string | ID категории |
| `status` | ArticleStatus | Статус |
| `search` | string | Поисковый запрос |
| `authorId` | string | ID автора |
| `isBreaking` | boolean | Срочные новости |
| `isFeatured` | boolean | Избранные |

---

## use-categories.ts

Работа с категориями.

```typescript
import { useCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/use-categories';

// Все категории
const { data: categories } = useCategories();

// Одна категория
const { data: category } = useCategory(id);

// CRUD операции
const createMutation = useCreateCategory();
const updateMutation = useUpdateCategory();
const deleteMutation = useDeleteCategory();
```

---

## use-tags.ts

Работа с тегами.

```typescript
import { useTags, useTag, useCreateTag, useGenerateTags } from '@/hooks/use-tags';

// Все теги
const { data: tags } = useTags();

// Генерация тегов AI
const generateMutation = useGenerateTags();
const suggestedTags = await generateMutation.mutateAsync({
  content: articleContent,
  language: 'kz'
});
```

---

## use-media.ts

Загрузка файлов.

```typescript
import { useUploadMedia } from '@/hooks/use-media';

const uploadMutation = useUploadMedia();

const handleUpload = async (file: File) => {
  const result = await uploadMutation.mutateAsync(file);
  console.log(result.url); // URL загруженного файла
};

// Прогресс загрузки
const { progress, isLoading } = uploadMutation;
```

---

## use-magazine-issues.ts

Работа с журналом.

```typescript
import { useMagazineIssues, useMagazineIssue, useCreateMagazineIssue } from '@/hooks/use-magazine-issues';

// Список номеров
const { data: issues } = useMagazineIssues();

// Один номер
const { data: issue } = useMagazineIssue(id);

// Создание с PDF
const createMutation = useCreateMagazineIssue();
await createMutation.mutateAsync({
  pdf: pdfFile,
  issueNumber: 42,
  titleKz: 'Шілде 2024',
  titleRu: 'Июль 2024',
  publishDate: new Date()
});

// Увеличить счетчик просмотров/загрузок
useIncrementViews(id);
useIncrementDownloads(id);
```

---

## use-translation.ts

AI перевод.

```typescript
import { useTranslateText, useTranslateArticle } from '@/hooks/use-translation';

// Перевод текста
const translateMutation = useTranslateText();
const translated = await translateMutation.mutateAsync({
  text: 'Бүгін ауа райы жақсы',
  from: 'kz',
  to: 'ru'
});

// Перевод статьи целиком
const translateArticleMutation = useTranslateArticle();
await translateArticleMutation.mutateAsync({
  articleId: 'uuid',
  targetLanguage: 'ru'
});
```

---

## use-social-media.ts

Интеграция с соцсетями.

```typescript
import { useSocialMediaConfig, usePublishToSocialMedia, usePublicationHistory } from '@/hooks/use-social-media';

// Конфигурация
const { data: config } = useSocialMediaConfig();

// Публикация
const publishMutation = usePublishToSocialMedia();
await publishMutation.mutateAsync({
  articleId: 'uuid',
  platforms: ['TELEGRAM', 'INSTAGRAM'],
  message: 'Новая статья!',
  includeImage: true
});

// История публикаций
const { data: publications } = usePublicationHistory(articleId);
```

---

## use-admin-lang.ts

Язык админ-панели.

```typescript
import { useAdminLang } from '@/hooks/use-admin-lang';

const { lang, setLang, t } = useAdminLang();

// Переключение языка
setLang('ru');

// Получение перевода
const label = t('articles.title'); // "Статьи" или "Мақалалар"
```

---

## Пример полного компонента

```typescript
import { useArticles, useCreateArticle } from '@/hooks/use-articles';
import { useCategories } from '@/hooks/use-categories';
import { useTags, useGenerateTags } from '@/hooks/use-tags';
import { useTranslateText } from '@/hooks/use-translation';

export function ArticleEditor() {
  const { data: articles, isLoading } = useArticles({ status: 'DRAFT' });
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  const createMutation = useCreateArticle();
  const generateTagsMutation = useGenerateTags();
  const translateMutation = useTranslateText();

  const handleSubmit = async (data: CreateArticleDto) => {
    // Генерация тегов
    const suggestedTags = await generateTagsMutation.mutateAsync({
      content: data.contentKz,
      language: 'kz'
    });

    // Перевод на русский
    const translatedTitle = await translateMutation.mutateAsync({
      text: data.titleKz,
      from: 'kz',
      to: 'ru'
    });

    // Создание статьи
    await createMutation.mutateAsync({
      ...data,
      titleRu: translatedTitle,
      tagIds: suggestedTags.map(t => t.id)
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <ArticleForm
      categories={categories}
      tags={tags}
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
    />
  );
}
```
