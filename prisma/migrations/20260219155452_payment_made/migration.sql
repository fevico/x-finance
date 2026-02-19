-- CreateEnum
CREATE TYPE "PaymentMadeStatus" AS ENUM ('Pending', 'Cleared');

-- CreateTable
CREATE TABLE "PaymentMade" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "billNumber" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "entityId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "reference" TEXT,
    "note" TEXT,
    "status" "PaymentMadeStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "PaymentMade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMade_entityId_idx" ON "PaymentMade"("entityId");

-- AddForeignKey
ALTER TABLE "PaymentMade" ADD CONSTRAINT "PaymentMade_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMade" ADD CONSTRAINT "PaymentMade_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMade" ADD CONSTRAINT "PaymentMade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
