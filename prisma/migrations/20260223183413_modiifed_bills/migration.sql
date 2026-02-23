/*
  Warnings:

  - You are about to drop the `BillItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `items` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BillItem" DROP CONSTRAINT "BillItem_billId_fkey";

-- DropForeignKey
ALTER TABLE "BillItem" DROP CONSTRAINT "BillItem_itemId_fkey";

-- AlterTable
ALTER TABLE "Bills" ADD COLUMN     "items" JSONB NOT NULL;

-- DropTable
DROP TABLE "BillItem";
