-- AlterTable
ALTER TABLE "Bills" ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending';
