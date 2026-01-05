-- AlterTable
ALTER TABLE "articles" ADD COLUMN "auto_publish_platforms" TEXT[] DEFAULT ARRAY[]::TEXT[];
