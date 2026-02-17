/*
  Warnings:

  - You are about to drop the column `account` on the `Expenses` table. All the data in the column will be lost.
  - You are about to drop the column `expenseAccount` on the `vendor` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "account",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "expenseAccount",
ADD COLUMN     "expenseAccountId" TEXT;

-- AddForeignKey
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceived" ADD CONSTRAINT "PaymentReceived_depositTo_fkey" FOREIGN KEY ("depositTo") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
