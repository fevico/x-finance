/*
  Warnings:

  - The values [product] on the enum `ItemsType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `costPrice` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `currentStock` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `lowStock` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `sellOnline` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `taxable` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `trackInventory` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ItemsType_new" AS ENUM ('goods', 'service');
ALTER TABLE "public"."Items" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Items" ALTER COLUMN "type" TYPE "ItemsType_new" USING ("type"::text::"ItemsType_new");
ALTER TYPE "ItemsType" RENAME TO "ItemsType_old";
ALTER TYPE "ItemsType_new" RENAME TO "ItemsType";
DROP TYPE "public"."ItemsType_old";
ALTER TABLE "Items" ALTER COLUMN "type" SET DEFAULT 'goods';
COMMIT;

-- AlterTable
ALTER TABLE "Items" DROP COLUMN "costPrice",
DROP COLUMN "currentStock",
DROP COLUMN "lowStock",
DROP COLUMN "rate",
DROP COLUMN "sellOnline",
DROP COLUMN "sellingPrice",
DROP COLUMN "sku",
DROP COLUMN "taxable",
DROP COLUMN "trackInventory",
DROP COLUMN "unit",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTaxable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unitPrice" INTEGER,
ALTER COLUMN "type" SET DEFAULT 'goods';

-- CreateIndex
CREATE UNIQUE INDEX "Items_code_key" ON "Items"("code");
