/*
  Warnings:

  - The values [GROUP] on the enum `RoleScope` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `groupAdminRoleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `groupRoleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `GroupRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupRoleToPermission` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ModuleScope" AS ENUM ('ADMIN', 'ENTITY');

-- AlterEnum
BEGIN;
CREATE TYPE "RoleScope_new" AS ENUM ('ADMIN', 'ENTITY', 'BOTH');
ALTER TABLE "Role" ALTER COLUMN "scope" TYPE "RoleScope_new" USING ("scope"::text::"RoleScope_new");
ALTER TYPE "RoleScope" RENAME TO "RoleScope_old";
ALTER TYPE "RoleScope_new" RENAME TO "RoleScope";
DROP TYPE "public"."RoleScope_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "GroupRole" DROP CONSTRAINT "GroupRole_groupId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_groupAdminRoleId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_groupRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_entityId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "_GroupRoleToPermission" DROP CONSTRAINT "_GroupRoleToPermission_A_fkey";

-- DropForeignKey
ALTER TABLE "_GroupRoleToPermission" DROP CONSTRAINT "_GroupRoleToPermission_B_fkey";

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "scope" "ModuleScope" NOT NULL DEFAULT 'ENTITY';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "groupAdminRoleId",
DROP COLUMN "groupRoleId",
ADD COLUMN     "adminEntities" TEXT[],
ADD COLUMN     "roleId" TEXT NOT NULL;

-- DropTable
DROP TABLE "GroupRole";

-- DropTable
DROP TABLE "UserRole";

-- DropTable
DROP TABLE "_GroupRoleToPermission";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
