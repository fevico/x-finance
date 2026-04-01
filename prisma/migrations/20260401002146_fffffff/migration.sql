/*
  Warnings:

  - You are about to drop the column `projectId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectManager` on the `Project` table. All the data in the column will be lost.
  - Added the required column `managerId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectNumber` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "projectId",
DROP COLUMN "projectManager",
ADD COLUMN     "managerId" TEXT NOT NULL,
ADD COLUMN     "projectNumber" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
