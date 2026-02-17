/*
  Warnings:

  - You are about to drop the column `items` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "items",
ADD COLUMN     "subtotal" INTEGER NOT NULL,
ADD COLUMN     "tax" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "total" INTEGER NOT NULL;
