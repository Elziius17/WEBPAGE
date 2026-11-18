-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDropshipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "leadTime" TEXT;
