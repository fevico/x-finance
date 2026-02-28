-- CreateEnum
CREATE TYPE "OpeningBalanceStatus" AS ENUM ('Draft', 'Finalized');

-- CreateTable
CREATE TABLE "OpeningBalance" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fiscalYear" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCredit" INTEGER NOT NULL DEFAULT 0,
    "totalDebit" INTEGER NOT NULL DEFAULT 0,
    "difference" INTEGER NOT NULL DEFAULT 0,
    "status" "OpeningBalanceStatus" NOT NULL DEFAULT 'Draft',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpeningBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningBalanceItem" (
    "id" TEXT NOT NULL,
    "openingBalanceId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpeningBalanceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpeningBalance_entityId_date_idx" ON "OpeningBalance"("entityId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningBalance_entityId_fiscalYear_key" ON "OpeningBalance"("entityId", "fiscalYear");

-- CreateIndex
CREATE INDEX "OpeningBalanceItem_openingBalanceId_idx" ON "OpeningBalanceItem"("openingBalanceId");

-- CreateIndex
CREATE INDEX "OpeningBalanceItem_accountId_idx" ON "OpeningBalanceItem"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningBalanceItem_openingBalanceId_accountId_key" ON "OpeningBalanceItem"("openingBalanceId", "accountId");

-- AddForeignKey
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningBalanceItem" ADD CONSTRAINT "OpeningBalanceItem_openingBalanceId_fkey" FOREIGN KEY ("openingBalanceId") REFERENCES "OpeningBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningBalanceItem" ADD CONSTRAINT "OpeningBalanceItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
