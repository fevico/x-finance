/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Entity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Overdue', 'Paid', 'Draft', 'Sent', 'Pending');

-- AlterTable
ALTER TABLE "Entity" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "currency" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearEnd" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "creditLimit" TEXT NOT NULL,
    "note" TEXT,
    "entityId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "items" TEXT[],
    "total" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_email_name_idx" ON "Customer"("email", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_customerId_currency_idx" ON "Invoice"("invoiceNumber", "customerId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Entity_name_taxId_email_idx" ON "Entity"("name", "taxId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Entity_email_key" ON "Entity"("email");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
