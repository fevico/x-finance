/*
  Warnings:

  - You are about to drop the column `accountId` on the `Expenses` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Expenses` table. All the data in the column will be lost.
  - Added the required column `expenseAccountId` to the `Expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentAccountId` to the `Expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Expenses" DROP CONSTRAINT "Expenses_accountId_fkey";

-- DropIndex
DROP INDEX "Expenses_reference_category_idx";

-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "accountId",
DROP COLUMN "category",
ADD COLUMN     "expenseAccountId" TEXT NOT NULL,
ADD COLUMN     "paymentAccountId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Expenses_reference_paymentAccountId_idx" ON "Expenses"("reference", "paymentAccountId");

-- CreateIndex
CREATE INDEX "Expenses_reference_expenseAccountId_idx" ON "Expenses"("reference", "expenseAccountId");

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenses" ADD CONSTRAINT "Expenses_expenseAccountId_fkey" FOREIGN KEY ("expenseAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
