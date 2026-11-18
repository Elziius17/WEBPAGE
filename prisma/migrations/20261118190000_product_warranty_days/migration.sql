-- La garantía de productos pasa de meses a días (permite 45 días = 1 mes y medio).
-- Se conserva el dato existente: meses × 30.
ALTER TABLE "Product" ADD COLUMN "warrantyDays" INTEGER NOT NULL DEFAULT 0;
UPDATE "Product" SET "warrantyDays" = "warrantyMonths" * 30;
ALTER TABLE "Product" DROP COLUMN "warrantyMonths";
ALTER TABLE "Product" ADD CONSTRAINT "Product_warranty_days_nonnegative" CHECK ("warrantyDays" >= 0);
