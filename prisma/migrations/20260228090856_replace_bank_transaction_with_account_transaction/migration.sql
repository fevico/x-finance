/*
  Warnings:

  - You are about to drop the `BankTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountTransactionType" AS ENUM ('BANK', 'INVOICE_POSTING', 'PAYMENT_RECEIVED_POSTING', 'OPENING_BALANCE', 'MANUAL_ENTRY', 'JOURNAL_ENTRY', 'EXPENSE_POSTING', 'BILL_POSTING');

-- CreateEnum
CREATE TYPE "TransactionPostingStatus" AS ENUM ('Pending', 'Processing', 'Success', 'Failed');

-- DropForeignKey
ALTER TABLE "BankTransaction" DROP CONSTRAINT "BankTransaction_bankAccountId_fkey";

-- DropTable
DROP TABLE "BankTransaction";

-- DropEnum
DROP TYPE "BankTransactionStatus";

-- DropEnum
DROP TYPE "BankTransactionType";

-- CreateTable
CREATE TABLE "AccountTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "type" "AccountTransactionType" NOT NULL,
    "status" "TransactionPostingStatus" NOT NULL DEFAULT 'Pending',
    "accountId" TEXT NOT NULL,
    "debitAmount" INTEGER NOT NULL DEFAULT 0,
    "creditAmount" INTEGER NOT NULL DEFAULT 0,
    "runningBalance" INTEGER,
    "entityId" TEXT NOT NULL,
    "relatedEntityId" TEXT,
    "relatedEntityType" TEXT,
    "bankAccountId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountTransaction_entityId_accountId_date_idx" ON "AccountTransaction"("entityId", "accountId", "date");

-- CreateIndex
CREATE INDEX "AccountTransaction_date_type_idx" ON "AccountTransaction"("date", "type");

-- CreateIndex
CREATE INDEX "AccountTransaction_accountId_date_idx" ON "AccountTransaction"("accountId", "date");

-- CreateIndex
CREATE INDEX "AccountTransaction_relatedEntityId_relatedEntityType_idx" ON "AccountTransaction"("relatedEntityId", "relatedEntityType");

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
