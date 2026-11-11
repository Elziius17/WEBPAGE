-- AlterTable
ALTER TABLE "DeliveryZone" ADD COLUMN     "costIsMinimum" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_userId_key" ON "Testimonial"("userId");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

