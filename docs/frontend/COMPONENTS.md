# React компоненты

Список всех компонентов приложения.

## UI компоненты (`/components/ui/`)

Базовые переиспользуемые UI элементы.

### button.tsx

Кнопка с вариантами стилей.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Сохранить</Button>
<Button variant="outline">Отмена</Button>
<Button variant="destructive">Удалить</Button>
<Button variant="ghost">Скрыть</Button>
<Button disabled loading>Загрузка...</Button>
```

### card.tsx

Карточка-контейнер.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Заголовок</CardTitle>
  </CardHeader>
  <CardContent>
    Контент карточки
  </CardContent>
</Card>
```

### input.tsx

Текстовое поле ввода.

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Введите текст"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### label.tsx

Лейбл для полей формы.

```tsx
import { Label } from '@/components/ui/label';

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### badge.tsx

Бейджи/теги.

```tsx
import { Badge } from '@/components/ui/badge';

<Badge>Новое</Badge>
<Badge variant="secondary">Черновик</Badge>
<Badge variant="destructive">Срочно</Badge>
```

### tabs.tsx

Вкладки.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="kz">
  <TabsList>
    <TabsTrigger value="kz">Қазақша</TabsTrigger>
    <TabsTrigger value="ru">Русский</TabsTrigger>
  </TabsList>
  <TabsContent value="kz">Контент KZ</TabsContent>
  <TabsContent value="ru">Контент RU</TabsContent>
</Tabs>
```

### select.tsx

Выпадающий список.

```tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

<Select value={category} onValueChange={setCategory}>
  <SelectTrigger>
    <SelectValue placeholder="Выберите категорию" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="politics">Саясат</SelectItem>
    <SelectItem value="economy">Экономика</SelectItem>
  </SelectContent>
</Select>
```

### switch.tsx

Переключатель.

```tsx
import { Switch } from '@/components/ui/switch';

<Switch
  checked={isPublished}
  onCheckedChange={setIsPublished}
/>
```

---

## Специализированные компоненты

### article-card.tsx

Карточка статьи для списков.

```tsx
import { ArticleCard } from '@/components/article-card';

<ArticleCard
  article={article}
  lang="kz"
  showCategory
  showDate
/>
```

**Props:**
- `article`: Article - объект статьи
- `lang`: 'kz' | 'ru' - язык отображения
- `showCategory?`: boolean - показывать категорию
- `showDate?`: boolean - показывать дату

### article-form.tsx

Форма создания/редактирования статьи.

```tsx
import { ArticleForm } from '@/components/article-form';

<ArticleForm
  article={existingArticle}  // для редактирования
  categories={categories}
  tags={tags}
  onSubmit={handleSubmit}
  isLoading={isSubmitting}
/>
```

**Props:**
- `article?`: Article - существующая статья
- `categories`: Category[] - список категорий
- `tags`: Tag[] - список тегов
- `onSubmit`: (data: CreateArticleDto) => void
- `isLoading`: boolean

### rich-text-editor.tsx

WYSIWYG редактор на TipTap.

```tsx
import { RichTextEditor } from '@/components/rich-text-editor';

<RichTextEditor
  content={content}
  onChange={setContent}
  placeholder="Начните писать..."
/>
```

**Props:**
- `content`: string - HTML контент
- `onChange`: (html: string) => void
- `placeholder?`: string
- `editable?`: boolean

**Функции редактора:**
- Форматирование текста (bold, italic, underline)
- Заголовки (H1-H6)
- Списки (маркированный, нумерованный)
- Ссылки
- Изображения с изменением размера
- Выравнивание текста
- Цитаты
- Код

### image-upload.tsx

Загрузка изображений.

```tsx
import { ImageUpload } from '@/components/image-upload';

<ImageUpload
  value={coverImage}
  onChange={setCoverImage}
  label="Обложка статьи"
/>
```

**Props:**
- `value`: string | null - URL изображения
- `onChange`: (url: string | null) => void
- `label?`: string

### pdf-viewer.tsx

Просмотр PDF файлов.

```tsx
import { PDFViewer } from '@/components/pdf-viewer';

<PDFViewer
  url="/uploads/magazine/issue-42.pdf"
  title="Июль 2024"
/>
```

**Props:**
- `url`: string - URL PDF файла
- `title?`: string - заголовок

### admin-nav.tsx

Боковая навигация админ-панели.

```tsx
import { AdminNav } from '@/components/admin-nav';

<AdminNav currentPath="/admin/articles" />
```

### search-bar.tsx

Поиск по статьям.

```tsx
import { SearchBar } from '@/components/search-bar';

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  placeholder="Поиск статей..."
/>
```

### pagination.tsx

Пагинация.

```tsx
import { Pagination } from '@/components/pagination';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

### category-tabs.tsx

Вкладки категорий.

```tsx
import { CategoryTabs } from '@/components/category-tabs';

<CategoryTabs
  categories={categories}
  activeCategory={selectedCategory}
  onChange={setSelectedCategory}
  lang="kz"
/>
```

### breaking-news-banner.tsx

Баннер срочных новостей.

```tsx
import { BreakingNewsBanner } from '@/components/breaking-news-banner';

<BreakingNewsBanner
  articles={breakingArticles}
  lang="kz"
/>
```

### social-media-preview.tsx

Предпросмотр публикации в соцсетях.

```tsx
import { SocialMediaPreview } from '@/components/social-media-preview';

<SocialMediaPreview
  platform="telegram"
  title={article.titleKz}
  excerpt={article.excerptKz}
  imageUrl={article.coverImage}
/>
```

### publication-history.tsx

История публикаций статьи в соцсетях.

```tsx
import { PublicationHistory } from '@/components/publication-history';

<PublicationHistory
  publications={article.publications}
/>
```

### ai-suggestions-panel.tsx

Панель AI-рекомендаций.

```tsx
import { AISuggestionsPanel } from '@/components/ai-suggestions-panel';

<AISuggestionsPanel
  articleId={article.id}
  onApplySuggestion={handleApply}
/>
```

### weather-widget.tsx

Виджет погоды.

```tsx
import { WeatherWidget } from '@/components/weather-widget';

<WeatherWidget city="Almaty" />
```

### advertisement.tsx

Рекламный блок.

```tsx
import { Advertisement } from '@/components/advertisement';

<Advertisement
  position="HOME_SIDEBAR"
  size="RECTANGLE_300x250"
/>
```

### tengri-header.tsx

Главный заголовок сайта.

```tsx
import { TengriHeader } from '@/components/tengri-header';

<TengriHeader
  lang="kz"
  categories={categories}
/>
```

### tengri-footer.tsx

Футер сайта.

```tsx
import { TengriFooter } from '@/components/tengri-footer';

<TengriFooter lang="kz" />
```

### loading-spinner.tsx

Индикатор загрузки.

```tsx
import { LoadingSpinner } from '@/components/loading-spinner';

<LoadingSpinner size="lg" />
```

### error-message.tsx

Сообщение об ошибке.

```tsx
import { ErrorMessage } from '@/components/error-message';

<ErrorMessage
  title="Ошибка загрузки"
  message="Не удалось загрузить данные"
  onRetry={refetch}
/>
```

### providers.tsx

Провайдеры React контекста.

```tsx
// В layout.tsx
import { Providers } from '@/components/providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

Включает:
- QueryClientProvider (React Query)
- Toaster (Sonner notifications)
