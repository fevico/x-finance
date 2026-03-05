/*
  Warnings:

  - A unique constraint covering the columns `[billNumber]` on the table `Bills` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityId,billNumber]` on the table `Bills` will be added. If there are existing duplicate values, this will fail.
  - Made the column `billNumber` on table `Bills` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Bills" ALTER COLUMN "billNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Bills_billNumber_key" ON "Bills"("billNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bills_entityId_billNumber_key" ON "Bills"("entityId", "billNumber");
