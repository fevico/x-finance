/*
  Warnings:

  - Added the required column `maxApiRatePerHour` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxEntities` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxStorageGB` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxTransactionsMonth` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxUsers` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tierName` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxApiRatePerHour` to the `SubscriptionTier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxEntities` to the `SubscriptionTier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxStorageGB` to the `SubscriptionTier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxTransactionsMonth` to the `SubscriptionTier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxUsers` to the `SubscriptionTier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingEndDate" TIMESTAMP(3),
ADD COLUMN     "billingStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxApiRatePerHour" INTEGER NOT NULL,
ADD COLUMN     "maxEntities" INTEGER NOT NULL,
ADD COLUMN     "maxStorageGB" INTEGER NOT NULL,
ADD COLUMN     "maxTransactionsMonth" INTEGER NOT NULL,
ADD COLUMN     "maxUsers" INTEGER NOT NULL,
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "tierName" TEXT NOT NULL,
ADD COLUMN     "usedEntities" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedStorageGB" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "usedTransactionsMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usedUsers" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SubscriptionTier" ADD COLUMN     "apiAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customBranding" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxApiRatePerHour" INTEGER NOT NULL,
ADD COLUMN     "maxEntities" INTEGER NOT NULL,
ADD COLUMN     "maxStorageGB" INTEGER NOT NULL,
ADD COLUMN     "maxTransactionsMonth" INTEGER NOT NULL,
ADD COLUMN     "maxUsers" INTEGER NOT NULL,
ADD COLUMN     "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sso" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "webhooks" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "previousTierId" TEXT,
    "previousTierName" TEXT,
    "newTierId" TEXT NOT NULL,
    "newTierName" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriptionTierId" TEXT,
    "subscriptionId" TEXT,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionHistory_groupId_createdAt_idx" ON "SubscriptionHistory"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_groupId_isActive_idx" ON "Subscription"("groupId", "isActive");

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_previousTierId_fkey" FOREIGN KEY ("previousTierId") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_newTierId_fkey" FOREIGN KEY ("newTierId") REFERENCES "SubscriptionTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionTierId_fkey" FOREIGN KEY ("subscriptionTierId") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
