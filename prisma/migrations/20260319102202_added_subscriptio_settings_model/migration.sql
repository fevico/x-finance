-- CreateTable
CREATE TABLE "SubscriptionSettings" (
    "id" TEXT NOT NULL,
    "trialPeriodEnabled" BOOLEAN NOT NULL DEFAULT true,
    "trialDurationDays" INTEGER NOT NULL DEFAULT 14,
    "autoRenewalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "proratePayments" BOOLEAN NOT NULL DEFAULT true,
    "paymentReminders" BOOLEAN NOT NULL DEFAULT true,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionSettings_id_key" ON "SubscriptionSettings"("id");
