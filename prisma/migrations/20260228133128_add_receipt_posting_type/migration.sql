-- AlterEnum
ALTER TYPE "AccountTransactionType" ADD VALUE 'RECEIPT_POSTING';

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_depositTo_fkey";

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_depositTo_fkey" FOREIGN KEY ("depositTo") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
