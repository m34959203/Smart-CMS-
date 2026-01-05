# Мультиязычность и переводы

Руководство по работе с двуязычным контентом (Казахский/Русский).

## Обзор

Проект полностью поддерживает два языка:
- **Казахский (kz)** - основной язык
- **Русский (ru)** - дополнительный язык

## Структура контента

### Двуязычные поля

Все контентные модели имеют поля с суффиксами:
- `*Kz` - казахский (обязательный)
- `*Ru` - русский (опциональный)

```typescript
interface Article {
  // Казахский (обязательный)
  slugKz: string;
  titleKz: string;
  contentKz: string;
  excerptKz?: string;

  // Русский (опциональный)
  slugRu?: string;
  titleRu?: string;
  contentRu?: string;
  excerptRu?: string;
}
```

### Модели с двуязычностью

| Модель | Поля KZ | Поля RU |
|--------|---------|---------|
| Article | title, content, excerpt, subtitle | title, content, excerpt, subtitle |
| Category | name, description | name, description |
| Tag | name | name |
| MagazineIssue | title | title |
| Advertisement | name | name |
| MediaFile | altText, caption | altText, caption |

## AI перевод

### Настройка

```env
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=tngtech/deepseek-r1t2-chimera:free

# Или Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash-exp
```

### API эндпоинты

#### Перевод текста

```bash
POST /api/translation/text
Authorization: Bearer <token>

{
  "text": "Бүгін ауа райы жақсы",
  "from": "kz",
  "to": "ru"
}

Response:
{
  "translatedText": "Сегодня хорошая погода"
}
```

#### Перевод статьи

```bash
POST /api/translation/article
Authorization: Bearer <token>

{
  "articleId": "uuid",
  "targetLanguage": "ru"
}
```

### React хуки

```typescript
import { useTranslateText, useTranslateArticle } from '@/hooks/use-translation';

// Перевод текста
const translateMutation = useTranslateText();

const handleTranslate = async () => {
  const result = await translateMutation.mutateAsync({
    text: titleKz,
    from: 'kz',
    to: 'ru'
  });
  setTitleRu(result.translatedText);
};

// Перевод статьи целиком
const translateArticleMutation = useTranslateArticle();

await translateArticleMutation.mutateAsync({
  articleId: article.id,
  targetLanguage: 'ru'
});
```

## Маршрутизация

### URL структура

```
/{lang}/{category}/{slug}

Примеры:
/kz/saiasat/zhana-zanalar
/ru/politika/novye-zakony
```

### Next.js App Router

```
app/
├── [lang]/                 # Динамический язык
│   ├── [category]/
│   │   └── [slug]/
│   │       └── page.tsx
│   └── layout.tsx
```

### Получение языка

```typescript
// В page.tsx
export default function ArticlePage({
  params
}: {
  params: { lang: 'kz' | 'ru'; category: string; slug: string }
}) {
  const { lang, category, slug } = params;

  // Используем соответствующие поля
  const title = lang === 'kz' ? article.titleKz : article.titleRu;
  const content = lang === 'kz' ? article.contentKz : article.contentRu;

  return (
    <article>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

## Локализация UI

### Файл переводов

```typescript
// lib/translations.ts
export const translations = {
  kz: {
    home: 'Басты бет',
    articles: 'Мақалалар',
    categories: 'Санаттар',
    search: 'Іздеу',
    login: 'Кіру',
    register: 'Тіркелу',
    readMore: 'Толығырақ',
    publishedAt: 'Жарияланған',
    author: 'Автор',
    tags: 'Тегтер',
    comments: 'Пікірлер',
    share: 'Бөлісу',
  },
  ru: {
    home: 'Главная',
    articles: 'Статьи',
    categories: 'Категории',
    search: 'Поиск',
    login: 'Войти',
    register: 'Регистрация',
    readMore: 'Подробнее',
    publishedAt: 'Опубликовано',
    author: 'Автор',
    tags: 'Теги',
    comments: 'Комментарии',
    share: 'Поделиться',
  },
};

export function t(key: string, lang: 'kz' | 'ru'): string {
  return translations[lang][key] || key;
}
```

### Использование

```typescript
import { t } from '@/lib/translations';

function Header({ lang }: { lang: 'kz' | 'ru' }) {
  return (
    <nav>
      <a href={`/${lang}`}>{t('home', lang)}</a>
      <a href={`/${lang}/articles`}>{t('articles', lang)}</a>
      <button>{t('search', lang)}</button>
    </nav>
  );
}
```

## Админ-панель

### Хук языка админки

```typescript
import { useAdminLang } from '@/hooks/use-admin-lang';

function AdminArticleForm() {
  const { lang, setLang } = useAdminLang();

  return (
    <div>
      <Tabs value={lang} onValueChange={setLang}>
        <TabsList>
          <TabsTrigger value="kz">Қазақша</TabsTrigger>
          <TabsTrigger value="ru">Русский</TabsTrigger>
        </TabsList>

        <TabsContent value="kz">
          <Input
            label="Заголовок (KZ)"
            value={titleKz}
            onChange={setTitleKz}
          />
        </TabsContent>

        <TabsContent value="ru">
          <Input
            label="Заголовок (RU)"
            value={titleRu}
            onChange={setTitleRu}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Автоперевод в форме

```typescript
function ArticleForm() {
  const translateMutation = useTranslateText();

  const handleAutoTranslate = async () => {
    // Перевод заголовка
    const titleResult = await translateMutation.mutateAsync({
      text: titleKz,
      from: 'kz',
      to: 'ru'
    });
    setTitleRu(titleResult.translatedText);

    // Перевод контента
    const contentResult = await translateMutation.mutateAsync({
      text: contentKz,
      from: 'kz',
      to: 'ru'
    });
    setContentRu(contentResult.translatedText);
  };

  return (
    <form>
      {/* Поля ввода */}
      <Button onClick={handleAutoTranslate} type="button">
        🤖 Автоперевод на русский
      </Button>
    </form>
  );
}
```

## SEO

### Meta теги

```typescript
// app/[lang]/[category]/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const article = await getArticle(params.slug);
  const lang = params.lang;

  return {
    title: lang === 'kz' ? article.titleKz : article.titleRu,
    description: lang === 'kz' ? article.excerptKz : article.excerptRu,
    alternates: {
      languages: {
        'kz': `/kz/${params.category}/${article.slugKz}`,
        'ru': `/ru/${params.category}/${article.slugRu}`,
      },
    },
  };
}
```

### hreflang теги

```html
<link rel="alternate" hreflang="kk" href="https://aimaqaqshamy.kz/kz/saiasat/zhana-zanalar" />
<link rel="alternate" hreflang="ru" href="https://aimaqaqshamy.kz/ru/politika/novye-zakony" />
<link rel="alternate" hreflang="x-default" href="https://aimaqaqshamy.kz/kz/saiasat/zhana-zanalar" />
```

## Best Practices

1. **Казахский — обязательный**: Всегда заполняйте казахские поля
2. **Русский — опциональный**: Русский перевод можно добавить позже
3. **AI помощник**: Используйте автоперевод для ускорения работы
4. **Проверка**: Всегда проверяйте AI-переводы вручную
5. **URL slugs**: Создавайте осмысленные slugs на обоих языках
6. **Консистентность**: Используйте одинаковые термины в переводах
