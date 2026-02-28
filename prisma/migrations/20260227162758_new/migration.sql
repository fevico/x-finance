-- DropForeignKey
ALTER TABLE "InvoiceActivity" DROP CONSTRAINT "InvoiceActivity_performedBy_fkey";

-- AlterTable
ALTER TABLE "InvoiceActivity" ALTER COLUMN "performedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceActivity" ADD CONSTRAINT "InvoiceActivity_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
