-- DropIndex (safely check and drop if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'magazine_issues_year_month_issue_number_key') THEN
        DROP INDEX "magazine_issues_year_month_issue_number_key";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'magazine_issues_year_month_idx') THEN
        DROP INDEX "magazine_issues_year_month_idx";
    END IF;
END $$;

-- AlterTable (safely drop columns if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazine_issues' AND column_name = 'year') THEN
        ALTER TABLE "magazine_issues" DROP COLUMN "year";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazine_issues' AND column_name = 'month') THEN
        ALTER TABLE "magazine_issues" DROP COLUMN "month";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazine_issues' AND column_name = 'description_kz') THEN
        ALTER TABLE "magazine_issues" DROP COLUMN "description_kz";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'magazine_issues' AND column_name = 'description_ru') THEN
        ALTER TABLE "magazine_issues" DROP COLUMN "description_ru";
    END IF;
END $$;
