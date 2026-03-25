/*
  Warnings:

  - A unique constraint covering the columns `[subdomain]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `method` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subdomain` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "method" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "subdomain" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Group_subdomain_key" ON "Group"("subdomain");
