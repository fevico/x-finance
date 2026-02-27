/*
  Warnings:

  - Added the required column `accountsPayableId` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bills" ADD COLUMN     "accountsPayableId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "Bills_accountsPayableId_fkey" FOREIGN KEY ("accountsPayableId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
