-- CreateEnum AdType
DO $$ BEGIN
    CREATE TYPE "AdType" AS ENUM ('CUSTOM', 'YANDEX_DIRECT', 'GOOGLE_ADSENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update AdPosition enum with new values
-- First, we need to handle the transition from old to new enum values
-- Since enums can't be easily altered, we'll use ALTER TYPE ADD VALUE
DO $$ BEGIN
    ALTER TYPE "AdPosition" ADD VALUE IF NOT EXISTS 'HOME_TOP';
    ALTER TYPE "AdPosition" ADD VALUE IF NOT EXISTS 'HOME_SIDEBAR';
    ALTER TYPE "AdPosition" ADD VALUE IF NOT EXISTS 'ARTICLE_TOP';
    ALTER TYPE "AdPosition" ADD VALUE IF NOT EXISTS 'ARTICLE_SIDEBAR';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update AdSize enum to add CUSTOM
DO $$ BEGIN
    ALTER TYPE "AdSize" ADD VALUE IF NOT EXISTS 'CUSTOM';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop old ad_units table
DROP TABLE IF EXISTS "ad_units" CASCADE;

-- CreateTable advertisements
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name_kz" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "type" "AdType" NOT NULL,
    "position" "AdPosition" NOT NULL,
    "size" "AdSize" NOT NULL,
    "custom_html" TEXT,
    "image_url" TEXT,
    "click_url" TEXT,
    "yandex_block_id" TEXT,
    "google_ad_slot" TEXT,
    "google_ad_client" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "advertisements_code_key" ON "advertisements"("code");

-- CreateIndex
CREATE INDEX "advertisements_position_idx" ON "advertisements"("position");

-- CreateIndex
CREATE INDEX "advertisements_is_active_idx" ON "advertisements"("is_active");

-- CreateIndex
CREATE INDEX "advertisements_type_idx" ON "advertisements"("type");
