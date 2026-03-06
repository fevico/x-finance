/*
  Warnings:

  - You are about to drop the column `bankAccountId` on the `AccountTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `currentBalance` on the `BankAccount` table. All the data in the column will be lost.
  - You are about to drop the column `openingBalance` on the `BankAccount` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountTransaction" DROP CONSTRAINT "AccountTransaction_bankAccountId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "linkedType" TEXT;

-- AlterTable
ALTER TABLE "AccountTransaction" DROP COLUMN "bankAccountId";

-- AlterTable
ALTER TABLE "BankAccount" DROP COLUMN "currentBalance",
DROP COLUMN "openingBalance";
