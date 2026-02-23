/*
  Warnings:

  - You are about to drop the column `expenseAccountId` on the `vendor` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('active', 'inactive', 'closed');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "BankTransactionStatus" AS ENUM ('pending', 'cleared', 'reconciled', 'reversed');

-- DropForeignKey
ALTER TABLE "vendor" DROP CONSTRAINT "vendor_expenseAccountId_fkey";

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "expenseAccountId";

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "routingNumber" TEXT,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'active',
    "linkedAccountId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "amount" INTEGER NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "reference" TEXT,
    "status" "BankTransactionStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "bankAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_accountNumber_key" ON "BankAccount"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_linkedAccountId_key" ON "BankAccount"("linkedAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_entityId_linkedAccountId_idx" ON "BankAccount"("entityId", "linkedAccountId");

-- CreateIndex
CREATE INDEX "BankAccount_accountNumber_idx" ON "BankAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "BankTransaction_bankAccountId_date_idx" ON "BankTransaction"("bankAccountId", "date");

-- CreateIndex
CREATE INDEX "BankTransaction_date_idx" ON "BankTransaction"("date");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_linkedAccountId_fkey" FOREIGN KEY ("linkedAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
