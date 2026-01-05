# Модели данных

Подробное описание всех моделей Prisma.

## User (Пользователь)

Модель для хранения данных пользователей системы.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный идентификатор |
| email | String | Email (уникальный) |
| password | String | Хеш пароля (bcrypt) |
| firstName | String | Имя |
| lastName | String | Фамилия |
| avatarUrl | String? | URL аватара |
| bio | String? | Биография |
| role | Role | Роль (USER/EDITOR/ADMIN) |
| isActive | Boolean | Активен ли аккаунт |
| isVerified | Boolean | Подтвержден ли email |
| createdAt | DateTime | Дата создания |
| updatedAt | DateTime | Дата обновления |
| lastLoginAt | DateTime? | Последний вход |

### Связи

- `articles` - Статьи пользователя (1:N)
- `magazineIssues` - Загруженные журналы (1:N)

### Пример

```typescript
const user = await prisma.user.create({
  data: {
    email: 'editor@example.com',
    password: hashedPassword,
    firstName: 'Айбек',
    lastName: 'Смагулов',
    role: 'EDITOR'
  }
});
```

---

## Article (Статья)

Двуязычная модель статей с поддержкой AI-функций.

### Поля контента (KZ - обязательные)

| Поле | Тип | Описание |
|------|-----|----------|
| slugKz | String | URL-slug на казахском |
| titleKz | String | Заголовок на казахском |
| subtitleKz | String? | Подзаголовок |
| excerptKz | String? | Краткое описание |
| contentKz | String | HTML контент |

### Поля контента (RU - опциональные)

| Поле | Тип | Описание |
|------|-----|----------|
| slugRu | String? | URL-slug на русском |
| titleRu | String? | Заголовок на русском |
| subtitleRu | String? | Подзаголовок |
| excerptRu | String? | Краткое описание |
| contentRu | String? | HTML контент |

### Поля статуса

| Поле | Тип | Описание |
|------|-----|----------|
| status | ArticleStatus | DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED |
| published | Boolean | Опубликована ли |
| publishedAt | DateTime? | Дата публикации |
| scheduledAt | DateTime? | Запланированная публикация |

### Флаги

| Поле | Тип | Описание |
|------|-----|----------|
| isBreaking | Boolean | Срочные новости |
| isFeatured | Boolean | Избранное |
| isPinned | Boolean | Закреплено |
| allowComments | Boolean | Разрешены комментарии |

### Метрики

| Поле | Тип | Описание |
|------|-----|----------|
| views | Int | Просмотры |
| likes | Int | Лайки |
| shares | Int | Шаринги |

### AI поля

| Поле | Тип | Описание |
|------|-----|----------|
| aiGenerated | Boolean | Сгенерировано AI |
| aiProvider | String? | Провайдер AI |
| autoPublishEnabled | Boolean | Автопубликация |
| autoPublishPlatforms | Array | Платформы |

### Связи

- `author` - Автор (N:1 -> User)
- `category` - Категория (N:1 -> Category)
- `tags` - Теги (N:N -> Tag)
- `publications` - Публикации в соцсетях (1:N)

### Пример

```typescript
const article = await prisma.article.create({
  data: {
    slugKz: 'zhana-zanalar',
    titleKz: 'Жаңа заңдар қабылданды',
    contentKz: '<p>Мазмұны...</p>',

    slugRu: 'novye-zakony',
    titleRu: 'Приняты новые законы',
    contentRu: '<p>Содержание...</p>',

    categoryId: 'uuid-category',
    authorId: 'uuid-author',
    status: 'DRAFT',

    tags: {
      connect: [{ id: 'uuid-tag1' }, { id: 'uuid-tag2' }]
    }
  },
  include: {
    author: true,
    category: true,
    tags: true
  }
});
```

---

## Category (Категория)

Иерархическая двуязычная модель категорий.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| slug | String | URL-slug (уникальный) |
| nameKz | String | Название на казахском |
| nameRu | String | Название на русском |
| descriptionKz | String? | Описание KZ |
| descriptionRu | String? | Описание RU |
| parentId | UUID? | Родительская категория |
| sortOrder | Int | Порядок сортировки |
| isActive | Boolean | Активна ли |

### Связи

- `parent` - Родительская категория (N:1 -> Category)
- `children` - Дочерние категории (1:N -> Category)
- `articles` - Статьи категории (1:N)

### Пример с иерархией

```typescript
// Главная категория
const politics = await prisma.category.create({
  data: {
    slug: 'politics',
    nameKz: 'Саясат',
    nameRu: 'Политика',
    sortOrder: 1
  }
});

// Подкатегория
const elections = await prisma.category.create({
  data: {
    slug: 'elections',
    nameKz: 'Сайлау',
    nameRu: 'Выборы',
    parentId: politics.id,
    sortOrder: 1
  }
});
```

---

## Tag (Тег)

Двуязычные теги для статей.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| slug | String | URL-slug |
| nameKz | String | Название KZ |
| nameRu | String | Название RU |
| usageCount | Int | Количество использований |

### Связи

- `articles` - Статьи с этим тегом (N:N)

### Пример

```typescript
const tag = await prisma.tag.create({
  data: {
    slug: 'economy',
    nameKz: 'Экономика',
    nameRu: 'Экономика'
  }
});

// Автоинкремент usageCount
await prisma.tag.update({
  where: { id: tag.id },
  data: { usageCount: { increment: 1 } }
});
```

---

## Comment (Комментарий)

Вложенные комментарии с модерацией.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| articleId | UUID | Статья |
| userId | UUID? | Пользователь (null для гостей) |
| parentId | UUID? | Родительский комментарий |
| content | String | Текст комментария |
| guestName | String? | Имя гостя |
| guestEmail | String? | Email гостя |
| isApproved | Boolean | Одобрен модератором |
| isDeleted | Boolean | Удален (soft delete) |
| likes | Int | Лайки |

### Связи

- `article` - Статья (N:1)
- `user` - Автор (N:1)
- `parent` - Родительский комментарий (N:1)
- `replies` - Ответы (1:N)

---

## MagazineIssue (Номер журнала)

PDF-номера журнала.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| issueNumber | Int | Номер выпуска (уникальный) |
| publishDate | DateTime | Дата публикации |
| titleKz | String | Название KZ |
| titleRu | String | Название RU |
| pdfFilename | String | Имя файла PDF |
| pdfUrl | String | URL PDF |
| fileSize | Int | Размер в байтах |
| pagesCount | Int? | Количество страниц |
| coverImageUrl | String? | URL обложки |
| viewsCount | Int | Просмотры |
| downloadsCount | Int | Загрузки |
| isPublished | Boolean | Опубликован |
| isPinned | Boolean | Закреплен |

---

## Advertisement (Реклама)

Управление рекламными блоками.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| code | String | Код позиции (уникальный) |
| nameKz | String | Название KZ |
| nameRu | String | Название RU |
| type | AdType | CUSTOM/YANDEX_DIRECT/GOOGLE_ADSENSE |
| position | AdPosition | Позиция на странице |
| size | AdSize | Размер баннера |
| customHtml | String? | HTML для своей рекламы |
| imageUrl | String? | URL изображения |
| clickUrl | String? | URL для перехода |
| yandexBlockId | String? | ID блока Яндекса |
| googleSlotId | String? | ID слота Google |
| isActive | Boolean | Активна |
| startDate | DateTime? | Начало показа |
| endDate | DateTime? | Конец показа |
| viewsCount | Int | Показы |
| clicksCount | Int | Клики |

---

## SocialMediaPublication (Публикация в соцсетях)

Отслеживание публикаций статей в соцсетях.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| articleId | UUID | Статья |
| platform | SocialMediaPlatform | TELEGRAM/INSTAGRAM |
| status | PublicationStatus | PENDING/SUCCESS/FAILED |
| externalId | String? | ID поста в соцсети |
| url | String? | URL поста |
| message | String | Текст поста |
| mediaUrl | String? | URL медиа |
| publishedAt | DateTime? | Дата публикации |
| error | String? | Текст ошибки |

---

## MediaFile (Медиафайл)

Хранение информации о загруженных файлах.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Идентификатор |
| filename | String | Имя на сервере |
| originalFilename | String | Оригинальное имя |
| mimeType | String | MIME тип |
| size | Int | Размер в байтах |
| width | Int? | Ширина (для изображений) |
| height | Int? | Высота |
| url | String | URL файла |
| thumbnailUrl | String? | URL миниатюры |
| altTextKz | String? | Alt текст KZ |
| altTextRu | String? | Alt текст RU |
| captionKz | String? | Подпись KZ |
| captionRu | String? | Подпись RU |

---

## SystemSettings (Системные настройки)

Глобальные настройки системы.

### Поля

| Поле | Тип | Описание |
|------|-----|----------|
| id | String | Идентификатор (default: "default") |
| imageOptimizationEnabled | Boolean | Включена ли оптимизация изображений |
| maintenanceMode | Boolean | Режим обслуживания |
| createdAt | DateTime | Дата создания |
| updatedAt | DateTime | Дата обновления |

### Описание

Модель хранит глобальные настройки системы. Используется единственная запись с `id = "default"`.

**Оптимизация изображений:**
- При включении Next.js обрабатывает изображения на сервере (увеличивает нагрузку CPU)
- При отключении изображения отдаются без обработки (снижает нагрузку)

### Пример

```typescript
// Получить настройки
const settings = await prisma.systemSettings.findUnique({
  where: { id: 'default' }
});

// Обновить настройки
await prisma.systemSettings.upsert({
  where: { id: 'default' },
  create: {
    id: 'default',
    imageOptimizationEnabled: false,
    maintenanceMode: false
  },
  update: {
    imageOptimizationEnabled: false
  }
});
```
