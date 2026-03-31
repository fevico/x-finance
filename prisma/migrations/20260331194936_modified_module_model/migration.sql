/*
  Warnings:

  - You are about to drop the column `sortOrder` on the `Module` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Module" DROP COLUMN "sortOrder",
ADD COLUMN     "menuSortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "moduleSortOrder" INTEGER NOT NULL DEFAULT 0;
