/*
  Warnings:

  - You are about to drop the column `category` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `credit` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `debit` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `subCategory` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - Added the required column `subCategoryId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "category",
DROP COLUMN "credit",
DROP COLUMN "date",
DROP COLUMN "debit",
DROP COLUMN "subCategory",
DROP COLUMN "type",
ADD COLUMN     "subCategoryId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AccountType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "groupId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountSubCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountType_code_key" ON "AccountType"("code");

-- CreateIndex
CREATE INDEX "AccountCategory_groupId_typeId_idx" ON "AccountCategory"("groupId", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountCategory_code_groupId_key" ON "AccountCategory"("code", "groupId");

-- CreateIndex
CREATE INDEX "AccountSubCategory_categoryId_idx" ON "AccountSubCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountSubCategory_code_categoryId_key" ON "AccountSubCategory"("code", "categoryId");

-- CreateIndex
CREATE INDEX "Account_subCategoryId_idx" ON "Account"("subCategoryId");

-- AddForeignKey
ALTER TABLE "AccountCategory" ADD CONSTRAINT "AccountCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountCategory" ADD CONSTRAINT "AccountCategory_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AccountType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSubCategory" ADD CONSTRAINT "AccountSubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AccountCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "AccountSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
