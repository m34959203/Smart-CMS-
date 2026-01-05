-- CreateTable magazine_issues
CREATE TABLE IF NOT EXISTS "magazine_issues" (
    "id" TEXT NOT NULL,
    "issue_number" INTEGER NOT NULL,
    "publish_date" TIMESTAMP(3) NOT NULL,
    "title_kz" TEXT NOT NULL,
    "title_ru" TEXT NOT NULL,
    "pdf_filename" TEXT NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "pages_count" INTEGER,
    "cover_image_url" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "downloads_count" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magazine_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "magazine_issues_publish_date_idx" ON "magazine_issues"("publish_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "magazine_issues_is_published_idx" ON "magazine_issues"("is_published");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "magazine_issues_uploaded_by_id_idx" ON "magazine_issues"("uploaded_by_id");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'magazine_issues_uploaded_by_id_fkey'
    ) THEN
        ALTER TABLE "magazine_issues" ADD CONSTRAINT "magazine_issues_uploaded_by_id_fkey"
        FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
