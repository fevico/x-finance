/*
  Warnings:

  - You are about to drop the `CollectionItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `incomeAccountId` to the `Items` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StoreItemsType" AS ENUM ('product', 'service');

-- DropForeignKey
ALTER TABLE "CollectionItem" DROP CONSTRAINT "CollectionItem_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "CollectionItem" DROP CONSTRAINT "CollectionItem_itemId_fkey";

-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "incomeAccountId" TEXT NOT NULL;

-- DropTable
DROP TABLE "CollectionItem";

-- CreateTable
CREATE TABLE "StoreItems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "unit" TEXT,
    "description" TEXT NOT NULL,
    "sellingPrice" INTEGER,
    "costPrice" INTEGER,
    "rate" INTEGER,
    "taxable" BOOLEAN NOT NULL DEFAULT false,
    "currentStock" INTEGER,
    "lowStock" INTEGER,
    "type" "StoreItemsType" NOT NULL DEFAULT 'product',
    "trackInventory" BOOLEAN NOT NULL DEFAULT false,
    "sellOnline" BOOLEAN NOT NULL DEFAULT false,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionStoreItem" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "storeItemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionStoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreItems_entityId_type_idx" ON "StoreItems"("entityId", "type");

-- CreateIndex
CREATE INDEX "CollectionStoreItem_collectionId_idx" ON "CollectionStoreItem"("collectionId");

-- CreateIndex
CREATE INDEX "CollectionStoreItem_storeItemId_idx" ON "CollectionStoreItem"("storeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionStoreItem_collectionId_storeItemId_key" ON "CollectionStoreItem"("collectionId", "storeItemId");

-- AddForeignKey
ALTER TABLE "StoreItems" ADD CONSTRAINT "StoreItems_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Items" ADD CONSTRAINT "Items_incomeAccountId_fkey" FOREIGN KEY ("incomeAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionStoreItem" ADD CONSTRAINT "CollectionStoreItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionStoreItem" ADD CONSTRAINT "CollectionStoreItem_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "StoreItems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
