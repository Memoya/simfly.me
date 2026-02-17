-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "activationStatus" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "dataUsage" REAL;
ALTER TABLE "OrderItem" ADD COLUMN "totalData" REAL;

-- AlterTable
ALTER TABLE "ProviderSync" ADD COLUMN "emailStatus" TEXT;
