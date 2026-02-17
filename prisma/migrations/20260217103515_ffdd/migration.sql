/*
  Warnings:

  - You are about to drop the column `items` on the `Receipt` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `ReceiptItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "items",
ADD COLUMN     "subtotal" INTEGER NOT NULL,
ADD COLUMN     "tax" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ReceiptItem" ADD COLUMN     "total" INTEGER NOT NULL;
