-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "subtitleEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "faqsEn" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "introContentEn" TEXT,
ADD COLUMN     "seoDescriptionEn" TEXT,
ADD COLUMN     "seoTitleEn" TEXT,
ADD COLUMN     "shortDescEn" TEXT;

-- AlterTable
ALTER TABLE "HomeSection" ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "ListingCategory" ADD COLUMN     "faqsEn" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "introContentEn" TEXT,
ADD COLUMN     "seoDescriptionEn" TEXT,
ADD COLUMN     "seoTitleEn" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "seoDescriptionEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "faqsEn" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "priceNoteEn" TEXT,
ADD COLUMN     "seoDescriptionEn" TEXT,
ADD COLUMN     "seoTitleEn" TEXT,
ADD COLUMN     "shortDescEn" TEXT;

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'bn';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'bn';
