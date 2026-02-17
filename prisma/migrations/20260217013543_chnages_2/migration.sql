-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'draft', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'pending';
