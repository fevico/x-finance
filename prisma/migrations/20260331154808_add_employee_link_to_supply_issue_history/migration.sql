-- AlterTable
ALTER TABLE "SupplyIssueHistory" ADD COLUMN     "employeeId" TEXT;

-- AddForeignKey
ALTER TABLE "SupplyIssueHistory" ADD CONSTRAINT "SupplyIssueHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
