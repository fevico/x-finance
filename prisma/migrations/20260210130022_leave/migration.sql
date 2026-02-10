/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Bills` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Entity` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `GroupRole` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `GroupRole` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Items` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Journal` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PaymentReceived` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PaymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `vendor` table. All the data in the column will be lost.
  - Added the required column `attendanceLogId` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('Pending', 'Approved');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_entityId_fkey";

-- DropIndex
DROP INDEX "Attendance_employeeId_entityId_date_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "date",
ADD COLUMN     "attendanceLogId" TEXT NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Bills" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Entity" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Expenses" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "GroupRole" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Items" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Journal" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "PaymentReceived" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "AttendanceLog" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'Pending',
    "contact" TEXT NOT NULL,
    "emergencyContact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceLog_date_entityId_idx" ON "AttendanceLog"("date", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceLog_date_entityId_key" ON "AttendanceLog"("date", "entityId");

-- CreateIndex
CREATE INDEX "Leave_employeeId_status_idx" ON "Leave"("employeeId", "status");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_entityId_idx" ON "Attendance"("employeeId", "entityId");

-- CreateIndex
CREATE INDEX "Attendance_attendanceLogId_idx" ON "Attendance"("attendanceLogId");

-- AddForeignKey
ALTER TABLE "AttendanceLog" ADD CONSTRAINT "AttendanceLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_attendanceLogId_fkey" FOREIGN KEY ("attendanceLogId") REFERENCES "AttendanceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
