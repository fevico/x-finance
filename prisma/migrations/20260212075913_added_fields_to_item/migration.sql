-- AlterTable
ALTER TABLE "Items" ADD COLUMN     "sellOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackInventory" BOOLEAN NOT NULL DEFAULT false;
