-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Active', 'Inactive', 'On_Leave');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'Active';
