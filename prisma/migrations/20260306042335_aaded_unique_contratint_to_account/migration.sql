/*
  Warnings:

  - A unique constraint covering the columns `[entityId,code]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Account_entityId_code_key" ON "Account"("entityId", "code");
