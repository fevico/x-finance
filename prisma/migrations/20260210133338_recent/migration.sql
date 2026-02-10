-- AlterEnum
ALTER TYPE "LeaveStatus" ADD VALUE 'Rejected';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
