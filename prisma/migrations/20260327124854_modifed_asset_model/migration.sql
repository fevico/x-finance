/*
  Warnings:

  - You are about to drop the column `assigned` on the `Asset` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assignedId` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serialNumber` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "assigned",
ADD COLUMN     "assignedId" TEXT NOT NULL,
ADD COLUMN     "serialNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assignedId_fkey" FOREIGN KEY ("assignedId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
