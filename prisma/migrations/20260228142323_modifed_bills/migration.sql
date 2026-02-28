/*
  Warnings:

  - The values [pending] on the enum `BillStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('draft', 'unpaid', 'partial', 'paid');
ALTER TABLE "public"."Bills" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bills" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "public"."BillStatus_old";
ALTER TABLE "Bills" ALTER COLUMN "status" SET DEFAULT 'unpaid';
COMMIT;
