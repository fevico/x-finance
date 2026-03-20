-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "maxApiRatePerHour" DROP NOT NULL,
ALTER COLUMN "maxStorageGB" DROP NOT NULL,
ALTER COLUMN "maxTransactionsMonth" DROP NOT NULL,
ALTER COLUMN "usedStorageGB" DROP NOT NULL,
ALTER COLUMN "usedTransactionsMonth" DROP NOT NULL;
