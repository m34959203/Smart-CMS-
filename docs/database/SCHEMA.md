# Схема базы данных

## ER-диаграмма

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USERS & AUTH                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ User                                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id           UUID PK                                                    │ │
│  │ email        VARCHAR UNIQUE                                             │ │
│  │ password     VARCHAR (bcrypt)                                           │ │
│  │ firstName    VARCHAR                                                    │ │
│  │ lastName     VARCHAR                                                    │ │
│  │ avatarUrl    VARCHAR?                                                   │ │
│  │ bio          TEXT?                                                      │ │
│  │ role         ENUM (USER, EDITOR, ADMIN)                                 │ │
│  │ isActive     BOOLEAN default(true)                                      │ │
│  │ isVerified   BOOLEAN default(false)                                     │ │
│  │ createdAt    TIMESTAMP                                                  │ │
│  │ updatedAt    TIMESTAMP                                                  │ │
│  │ lastLoginAt  TIMESTAMP?                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                               CONTENT                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Article (Двуязычная)                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id                UUID PK                                               │ │
│  │ slugKz            VARCHAR UNIQUE      # казахский slug                  │ │
│  │ slugRu            VARCHAR UNIQUE?     # русский slug                    │ │
│  │ titleKz           VARCHAR             # заголовок KZ                    │ │
│  │ titleRu           VARCHAR?            # заголовок RU                    │ │
│  │ subtitleKz        VARCHAR?                                              │ │
│  │ subtitleRu        VARCHAR?                                              │ │
│  │ excerptKz         TEXT?               # краткое описание                │ │
│  │ excerptRu         TEXT?                                                 │ │
│  │ contentKz         TEXT                # основной контент                │ │
│  │ contentRu         TEXT?                                                 │ │
│  │ coverImage        VARCHAR?            # URL обложки                     │ │
│  │ status            ENUM                # DRAFT/REVIEW/PUBLISHED/ARCHIVED │ │
│  │ published         BOOLEAN                                               │ │
│  │ publishedAt       TIMESTAMP?                                            │ │
│  │ scheduledAt       TIMESTAMP?          # отложенная публикация           │ │
│  │ isBreaking        BOOLEAN             # срочные новости                 │ │
│  │ isFeatured        BOOLEAN             # избранное                       │ │
│  │ isPinned          BOOLEAN             # закрепленное                    │ │
│  │ allowComments     BOOLEAN                                               │ │
│  │ views             INT default(0)                                        │ │
│  │ likes             INT default(0)                                        │ │
│  │ shares            INT default(0)                                        │ │
│  │ aiGenerated       BOOLEAN                                               │ │
│  │ aiProvider        VARCHAR?                                              │ │
│  │ autoPublishEnabled    BOOLEAN                                           │ │
│  │ autoPublishPlatforms  ARRAY           # [TELEGRAM, INSTAGRAM]           │ │
│  │ authorId          UUID FK -> User                                       │ │
│  │ categoryId        UUID FK -> Category                                   │ │
│  │ createdAt         TIMESTAMP                                             │ │
│  │ updatedAt         TIMESTAMP                                             │ │
│  │ deletedAt         TIMESTAMP?          # soft delete                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Category (Иерархическая, двуязычная)                                    │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id              UUID PK                                                 │ │
│  │ slug            VARCHAR UNIQUE                                          │ │
│  │ nameKz          VARCHAR                                                 │ │
│  │ nameRu          VARCHAR                                                 │ │
│  │ descriptionKz   TEXT?                                                   │ │
│  │ descriptionRu   TEXT?                                                   │ │
│  │ parentId        UUID FK -> Category?  # для подкатегорий                │ │
│  │ sortOrder       INT default(0)                                          │ │
│  │ isActive        BOOLEAN                                                 │ │
│  │ createdAt       TIMESTAMP                                               │ │
│  │ updatedAt       TIMESTAMP                                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Tag (Двуязычный)                                                        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id          UUID PK                                                     │ │
│  │ slug        VARCHAR UNIQUE                                              │ │
│  │ nameKz      VARCHAR                                                     │ │
│  │ nameRu      VARCHAR                                                     │ │
│  │ usageCount  INT default(0)                                              │ │
│  │ createdAt   TIMESTAMP                                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ _ArticleToTag (Many-to-Many junction)                                   │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ A  UUID FK -> Article                                                   │ │
│  │ B  UUID FK -> Tag                                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              INTERACTIONS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Comment (Вложенные комментарии)                                         │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id          UUID PK                                                     │ │
│  │ articleId   UUID FK -> Article                                          │ │
│  │ userId      UUID FK -> User?         # null для гостей                  │ │
│  │ parentId    UUID FK -> Comment?      # для вложенности                  │ │
│  │ content     TEXT                                                        │ │
│  │ guestName   VARCHAR?                 # имя гостя                        │ │
│  │ guestEmail  VARCHAR?                 # email гостя                      │ │
│  │ isApproved  BOOLEAN default(false)   # модерация                        │ │
│  │ isDeleted   BOOLEAN default(false)                                      │ │
│  │ likes       INT default(0)                                              │ │
│  │ createdAt   TIMESTAMP                                                   │ │
│  │ updatedAt   TIMESTAMP                                                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                                 MEDIA                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ MediaFile (Двуязычные метаданные)                                       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id               UUID PK                                                │ │
│  │ filename         VARCHAR              # имя на сервере                  │ │
│  │ originalFilename VARCHAR              # оригинальное имя                │ │
│  │ mimeType         VARCHAR                                                │ │
│  │ size             INT                  # в байтах                        │ │
│  │ width            INT?                 # для изображений                 │ │
│  │ height           INT?                                                   │ │
│  │ url              VARCHAR                                                │ │
│  │ thumbnailUrl     VARCHAR?                                               │ │
│  │ altTextKz        VARCHAR?                                               │ │
│  │ altTextRu        VARCHAR?                                               │ │
│  │ captionKz        VARCHAR?                                               │ │
│  │ captionRu        VARCHAR?                                               │ │
│  │ uploadedById     UUID FK -> User?                                       │ │
│  │ createdAt        TIMESTAMP                                              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ MagazineIssue (PDF журнал)                                              │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id             UUID PK                                                  │ │
│  │ issueNumber    INT UNIQUE                                               │ │
│  │ publishDate    DATE                                                     │ │
│  │ titleKz        VARCHAR                                                  │ │
│  │ titleRu        VARCHAR                                                  │ │
│  │ pdfFilename    VARCHAR                                                  │ │
│  │ pdfUrl         VARCHAR                                                  │ │
│  │ fileSize       INT                                                      │ │
│  │ pagesCount     INT?                                                     │ │
│  │ coverImageUrl  VARCHAR?                                                 │ │
│  │ viewsCount     INT default(0)                                           │ │
│  │ downloadsCount INT default(0)                                           │ │
│  │ isPublished    BOOLEAN                                                  │ │
│  │ isPinned       BOOLEAN                                                  │ │
│  │ uploadedById   UUID FK -> User?                                         │ │
│  │ createdAt      TIMESTAMP                                                │ │
│  │ updatedAt      TIMESTAMP                                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                             ADVERTISING                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Advertisement                                                           │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id             UUID PK                                                  │ │
│  │ code           VARCHAR UNIQUE         # код позиции                     │ │
│  │ nameKz         VARCHAR                                                  │ │
│  │ nameRu         VARCHAR                                                  │ │
│  │ type           ENUM                   # CUSTOM/YANDEX/GOOGLE            │ │
│  │ position       ENUM                   # HOME_TOP/SIDEBAR/etc            │ │
│  │ size           ENUM                   # BANNER_728x90/etc               │ │
│  │ customHtml     TEXT?                  # для своей рекламы               │ │
│  │ imageUrl       VARCHAR?                                                 │ │
│  │ clickUrl       VARCHAR?                                                 │ │
│  │ yandexBlockId  VARCHAR?                                                 │ │
│  │ googleSlotId   VARCHAR?                                                 │ │
│  │ isActive       BOOLEAN                                                  │ │
│  │ startDate      DATE?                                                    │ │
│  │ endDate        DATE?                                                    │ │
│  │ viewsCount     INT default(0)                                           │ │
│  │ clicksCount    INT default(0)                                           │ │
│  │ createdAt      TIMESTAMP                                                │ │
│  │ updatedAt      TIMESTAMP                                                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           SOCIAL MEDIA                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ SocialMediaPublication                                                  │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ id           UUID PK                                                    │ │
│  │ articleId    UUID FK -> Article                                         │ │
│  │ platform     ENUM                     # TELEGRAM/INSTAGRAM              │ │
│  │ status       ENUM                     # PENDING/SUCCESS/FAILED          │ │
│  │ externalId   VARCHAR?                 # ID в соцсети                    │ │
│  │ url          VARCHAR?                 # ссылка на пост                  │ │
│  │ message      TEXT                                                       │ │
│  │ mediaUrl     VARCHAR?                                                   │ │
│  │ publishedAt  TIMESTAMP?                                                 │ │
│  │ error        TEXT?                                                      │ │
│  │ createdAt    TIMESTAMP                                                  │ │
│  │ updatedAt    TIMESTAMP                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Enums

```sql
-- Роли пользователей
CREATE TYPE "Role" AS ENUM ('USER', 'EDITOR', 'ADMIN');

-- Статусы статей
CREATE TYPE "ArticleStatus" AS ENUM (
  'DRAFT',      -- Черновик
  'REVIEW',     -- На проверке
  'SCHEDULED',  -- Запланирована
  'PUBLISHED',  -- Опубликована
  'ARCHIVED'    -- В архиве
);

-- Платформы соцсетей
CREATE TYPE "SocialMediaPlatform" AS ENUM ('TELEGRAM', 'INSTAGRAM');

-- Статусы публикаций
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- Позиции рекламы
CREATE TYPE "AdPosition" AS ENUM (
  'HOME_TOP',
  'HOME_SIDEBAR',
  'ARTICLE_TOP',
  'ARTICLE_SIDEBAR',
  'IN_CONTENT',
  'FOOTER',
  'STICKY_BOTTOM'
);

-- Типы рекламы
CREATE TYPE "AdType" AS ENUM ('CUSTOM', 'YANDEX_DIRECT', 'GOOGLE_ADSENSE');

-- Размеры рекламы
CREATE TYPE "AdSize" AS ENUM (
  'BANNER_728x90',
  'LARGE_BANNER_970x90',
  'RECTANGLE_300x250',
  'HALF_PAGE_300x600',
  'MOBILE_BANNER_320x50',
  'NATIVE',
  'CUSTOM'
);
```

## Индексы

```sql
-- User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Article
CREATE UNIQUE INDEX "Article_slugKz_key" ON "Article"("slugKz");
CREATE UNIQUE INDEX "Article_slugRu_key" ON "Article"("slugRu");
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX "Article_status_idx" ON "Article"("status");
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");
CREATE INDEX "Article_isBreaking_idx" ON "Article"("isBreaking");
CREATE INDEX "Article_isFeatured_idx" ON "Article"("isFeatured");

-- Category
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- Tag
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- Comment
CREATE INDEX "Comment_articleId_idx" ON "Comment"("articleId");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- Advertisement
CREATE UNIQUE INDEX "Advertisement_code_key" ON "Advertisement"("code");
CREATE INDEX "Advertisement_position_idx" ON "Advertisement"("position");
CREATE INDEX "Advertisement_isActive_idx" ON "Advertisement"("isActive");

-- MagazineIssue
CREATE UNIQUE INDEX "MagazineIssue_issueNumber_key" ON "MagazineIssue"("issueNumber");
CREATE INDEX "MagazineIssue_publishDate_idx" ON "MagazineIssue"("publishDate");

-- SocialMediaPublication
CREATE INDEX "SocialMediaPublication_articleId_idx" ON "SocialMediaPublication"("articleId");
CREATE INDEX "SocialMediaPublication_platform_idx" ON "SocialMediaPublication"("platform");
```
