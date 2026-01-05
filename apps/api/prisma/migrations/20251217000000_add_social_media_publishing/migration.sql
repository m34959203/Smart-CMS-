-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('TELEGRAM', 'INSTAGRAM');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "articles" ADD COLUMN "auto_publish_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "social_media_configs" (
    "id" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "bot_token" TEXT,
    "chat_id" TEXT,
    "access_token" TEXT,
    "page_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_publications" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "error" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_media_publications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "social_media_configs_platform_key" ON "social_media_configs"("platform");

-- CreateIndex
CREATE INDEX "social_media_publications_article_id_idx" ON "social_media_publications"("article_id");

-- CreateIndex
CREATE INDEX "social_media_publications_platform_idx" ON "social_media_publications"("platform");

-- CreateIndex
CREATE INDEX "social_media_publications_status_idx" ON "social_media_publications"("status");

-- AddForeignKey
ALTER TABLE "social_media_publications" ADD CONSTRAINT "social_media_publications_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
