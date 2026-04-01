/*
  Warnings:

  - You are about to drop the column `menuSortOrder` on the `Module` table. All the data in the column will be lost.
  - You are about to drop the column `moduleSortOrder` on the `Module` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('Upcoming', 'In_Progress', 'Completed', 'On_Hold');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Completed', 'Planning', 'In_Progress', 'On_Hold');

-- AlterTable
ALTER TABLE "Module" DROP COLUMN "menuSortOrder",
DROP COLUMN "moduleSortOrder";

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'In_Progress',
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "billingType" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "budgetedRevenue" INTEGER NOT NULL,
    "budgetedCost" INTEGER NOT NULL,
    "projectManager" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'Upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "estimatedMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT,
    "multiCurrency" BOOLEAN NOT NULL DEFAULT false,
    "taxCalculation" BOOLEAN NOT NULL DEFAULT false,
    "dateFormat" TIMESTAMP(3),
    "numberFormat" TEXT,
    "invoicePrefix" TEXT,
    "paymentTerm" TEXT,
    "lateFees" BOOLEAN NOT NULL DEFAULT false,
    "paymentReminders" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" INTEGER,
    "billPrefix" TEXT,
    "purchaseOrderPrefix" TEXT,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedThreshold" INTEGER,
    "match" BOOLEAN NOT NULL DEFAULT false,
    "entityId" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_entityId_id_idx" ON "Project"("entityId", "id");

-- CreateIndex
CREATE INDEX "Milestone_entityId_projectId_idx" ON "Milestone"("entityId", "projectId");

-- CreateIndex
CREATE INDEX "Settings_entityId_idx" ON "Settings"("entityId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
