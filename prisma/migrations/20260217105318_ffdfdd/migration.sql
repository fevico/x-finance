/*
  Warnings:

  - You are about to drop the column `items` on the `Bills` table. All the data in the column will be lost.
  - Added the required column `total` to the `BillItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `discount` to the `Bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Bills` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Bills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BillItem" ADD COLUMN     "total" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Bills" DROP COLUMN "items",
ADD COLUMN     "discount" INTEGER NOT NULL,
ADD COLUMN     "subtotal" INTEGER NOT NULL,
ADD COLUMN     "tax" INTEGER NOT NULL;
