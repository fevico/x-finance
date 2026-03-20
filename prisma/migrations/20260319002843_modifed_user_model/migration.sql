-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requirePasswordChange" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "User_email_groupId_isActive_idx" ON "User"("email", "groupId", "isActive");
