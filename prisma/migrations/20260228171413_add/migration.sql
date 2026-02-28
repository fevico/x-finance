/*
  Warnings:

  - You are about to drop the column `billNumber` on the `PaymentMade` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentMade" DROP COLUMN "billNumber",
ADD COLUMN     "billId" TEXT;

-- CreateIndex
CREATE INDEX "PaymentMade_billId_idx" ON "PaymentMade"("billId");

-- AddForeignKey
ALTER TABLE "PaymentMade" ADD CONSTRAINT "PaymentMade_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
