/*
  Warnings:

  - A unique constraint covering the columns `[moduleKey,scope]` on the table `Module` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Module_moduleKey_scope_key" ON "Module"("moduleKey", "scope");
