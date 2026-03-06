/*
  Warnings:

  - A unique constraint covering the columns `[entityId,accountNumber]` on the table `BankAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BankAccount_accountNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_entityId_accountNumber_key" ON "BankAccount"("entityId", "accountNumber");
