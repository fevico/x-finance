-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('Draft', 'Active');

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "status" "JournalStatus" NOT NULL DEFAULT 'Active';
