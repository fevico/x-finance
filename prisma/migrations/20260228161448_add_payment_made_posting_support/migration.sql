-- AlterTable
ALTER TABLE "PaymentMade" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending';
