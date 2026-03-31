/*
  Warnings:

  - You are about to drop the column `issuedBy` on the `SupplyIssueHistory` table. All the data in the column will be lost.
  - Added the required column `issuedById` to the `SupplyIssueHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SupplyIssueHistory" DROP COLUMN "issuedBy",
ADD COLUMN     "issuedById" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AddForeignKey
ALTER TABLE "SupplyIssueHistory" ADD CONSTRAINT "SupplyIssueHistory_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyIssueHistory" ADD CONSTRAINT "SupplyIssueHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
