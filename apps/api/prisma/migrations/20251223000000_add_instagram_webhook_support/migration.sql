-- CreateEnum
CREATE TYPE "InstagramWebhookEventType" AS ENUM ('COMMENTS', 'MENTIONS', 'STORY_INSIGHTS', 'LIVE_COMMENTS', 'MESSAGE_REACTIONS', 'MESSAGES');

-- AlterTable: Add webhook fields to social_media_configs
ALTER TABLE "social_media_configs" ADD COLUMN "webhook_verify_token" TEXT;
ALTER TABLE "social_media_configs" ADD COLUMN "webhook_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "social_media_configs" ADD COLUMN "webhook_app_secret" TEXT;

-- CreateTable: Instagram Webhook Events
CREATE TABLE "instagram_webhook_events" (
    "id" TEXT NOT NULL,
    "event_type" "InstagramWebhookEventType" NOT NULL,
    "media_id" TEXT,
    "comment_id" TEXT,
    "user_id" TEXT,
    "username" TEXT,
    "text" TEXT,
    "raw_payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instagram_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instagram_webhook_events_event_type_idx" ON "instagram_webhook_events"("event_type");

-- CreateIndex
CREATE INDEX "instagram_webhook_events_media_id_idx" ON "instagram_webhook_events"("media_id");

-- CreateIndex
CREATE INDEX "instagram_webhook_events_processed_idx" ON "instagram_webhook_events"("processed");

-- CreateIndex
CREATE INDEX "instagram_webhook_events_created_at_idx" ON "instagram_webhook_events"("created_at");
