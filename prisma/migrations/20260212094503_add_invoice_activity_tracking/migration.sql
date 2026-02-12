/*
  Warnings:

  - You are about to drop the column `activities` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceItemId` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `invoiceId` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceActivityType" AS ENUM ('Created', 'Sent', 'Viewed', 'PaymentReceived', 'Overdue', 'Cancelled', 'Updated');

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_invoiceItemId_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "activities",
DROP COLUMN "invoiceItemId";

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "invoiceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "InvoiceActivity" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "activityType" "InvoiceActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceActivity_invoiceId_createdAt_idx" ON "InvoiceActivity"("invoiceId", "createdAt");

-- CreateIndex
CREATE INDEX "InvoiceActivity_invoiceId_idx" ON "InvoiceActivity"("invoiceId");

-- AddForeignKey
ALTER TABLE "InvoiceActivity" ADD CONSTRAINT "InvoiceActivity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
