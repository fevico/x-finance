/*
  Warnings:

  - You are about to drop the column `category` on the `Bills` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Bills_billDate_category_idx";

-- AlterTable
ALTER TABLE "Bills" DROP COLUMN "category";
