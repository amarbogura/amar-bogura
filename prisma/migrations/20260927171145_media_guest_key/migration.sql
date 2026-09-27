-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "guestKey" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedById_idx" ON "MediaAsset"("uploadedById");

-- CreateIndex
CREATE INDEX "MediaAsset_guestKey_idx" ON "MediaAsset"("guestKey");
