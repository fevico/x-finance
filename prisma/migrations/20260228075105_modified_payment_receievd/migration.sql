/*
  Warnings:

  - You are about to drop the column `journalPosted` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PaymentReceived` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentNumber,entityId]` on the table `PaymentReceived` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency` to the `PaymentReceived` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentNumber` to the `PaymentReceived` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JournalPostingStatus" AS ENUM ('Pending', 'Processing', 'Success', 'Failed');

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "journalPosted",
ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "PaymentReceived" DROP COLUMN "status",
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "paymentNumber" TEXT NOT NULL,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending';

-- DropEnum
DROP TYPE "PaymentReceivedStatus";

-- CreateIndex
CREATE INDEX "PaymentReceived_paymentNumber_idx" ON "PaymentReceived"("paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceived_paymentNumber_entityId_key" ON "PaymentReceived"("paymentNumber", "entityId");
