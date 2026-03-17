/*
  Warnings:

  - The values [ADMIN] on the enum `ModuleScope` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENTITY,BOTH] on the enum `RoleScope` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModuleScope_new" AS ENUM ('GROUP', 'ENTITY');
ALTER TABLE "public"."Module" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "Module" ALTER COLUMN "scope" TYPE "ModuleScope_new" USING ("scope"::text::"ModuleScope_new");
ALTER TYPE "ModuleScope" RENAME TO "ModuleScope_old";
ALTER TYPE "ModuleScope_new" RENAME TO "ModuleScope";
DROP TYPE "public"."ModuleScope_old";
ALTER TABLE "Module" ALTER COLUMN "scope" SET DEFAULT 'ENTITY';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoleScope_new" AS ENUM ('ADMIN', 'USER');
ALTER TABLE "Role" ALTER COLUMN "scope" TYPE "RoleScope_new" USING ("scope"::text::"RoleScope_new");
ALTER TYPE "RoleScope" RENAME TO "RoleScope_old";
ALTER TYPE "RoleScope_new" RENAME TO "RoleScope";
DROP TYPE "public"."RoleScope_old";
COMMIT;
