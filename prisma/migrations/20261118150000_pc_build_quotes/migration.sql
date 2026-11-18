-- AlterEnum
ALTER TYPE "RequestKind" ADD VALUE 'PC_BUILD';

-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN     "details" JSONB,
ADD COLUMN     "quotedAt" TIMESTAMP(3),
ADD COLUMN     "quotedPriceCents" INTEGER;


-- El precio cotizado nunca es negativo.
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_quotedPriceCents_check" CHECK ("quotedPriceCents" IS NULL OR "quotedPriceCents" >= 0);
