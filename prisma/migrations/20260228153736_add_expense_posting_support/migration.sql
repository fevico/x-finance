/*
  Warnings:

  - The values [pending] on the enum `ExpenseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseStatus_new" AS ENUM ('draft', 'approved', 'rejected');
ALTER TABLE "public"."Expenses" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Expenses" ALTER COLUMN "status" TYPE "ExpenseStatus_new" USING ("status"::text::"ExpenseStatus_new");
ALTER TYPE "ExpenseStatus" RENAME TO "ExpenseStatus_old";
ALTER TYPE "ExpenseStatus_new" RENAME TO "ExpenseStatus";
DROP TYPE "public"."ExpenseStatus_old";
ALTER TABLE "Expenses" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterTable
ALTER TABLE "Expenses" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "journalReference" TEXT,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "postingStatus" "JournalPostingStatus" NOT NULL DEFAULT 'Pending',
ALTER COLUMN "status" SET DEFAULT 'draft';
