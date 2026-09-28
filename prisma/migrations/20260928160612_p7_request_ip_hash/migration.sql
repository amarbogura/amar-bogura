-- DropIndex
DROP INDEX "ServiceRequest_contactPhone_idx";

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "ServiceRequest_contactPhone_serviceId_createdAt_idx" ON "ServiceRequest"("contactPhone", "serviceId", "createdAt");
