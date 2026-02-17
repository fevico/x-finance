/*
  Warnings:

  - You are about to drop the column `supplier` on the `Expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "supplier",
ADD COLUMN     "vendorId" TEXT;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
