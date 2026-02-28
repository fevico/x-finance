/*
  Warnings:

  - Added the required column `depositTo` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "depositTo" TEXT NOT NULL,
ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending';

-- CreateIndex
CREATE INDEX "Receipt_receiptNumber_idx" ON "Receipt"("receiptNumber");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_depositTo_fkey" FOREIGN KEY ("depositTo") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
