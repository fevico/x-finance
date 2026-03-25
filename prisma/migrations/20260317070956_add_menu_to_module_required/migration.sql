/*
  Warnings:

  - Made the column `menu` on table `Module` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Module" ALTER COLUMN "menu" SET NOT NULL;
