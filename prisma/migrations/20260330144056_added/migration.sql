-- CreateTable
CREATE TABLE "SupplyIssueHistory" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "issuedTo" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "notes" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyIssueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyRestockHistory" (
    "id" TEXT NOT NULL,
    "supplyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT NOT NULL,
    "restockedBy" TEXT NOT NULL,
    "notes" TEXT,
    "restockDate" TIMESTAMP(3) NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyRestockHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSupply" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "location" TEXT,
    "supplier" TEXT,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreSupply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplyIssueHistory_entityId_idx" ON "SupplyIssueHistory"("entityId");

-- CreateIndex
CREATE INDEX "SupplyIssueHistory_supplyId_idx" ON "SupplyIssueHistory"("supplyId");

-- CreateIndex
CREATE INDEX "SupplyRestockHistory_entityId_idx" ON "SupplyRestockHistory"("entityId");

-- CreateIndex
CREATE INDEX "SupplyRestockHistory_supplyId_idx" ON "SupplyRestockHistory"("supplyId");

-- CreateIndex
CREATE INDEX "StoreSupply_entityId_idx" ON "StoreSupply"("entityId");

-- AddForeignKey
ALTER TABLE "SupplyIssueHistory" ADD CONSTRAINT "SupplyIssueHistory_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "StoreSupply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyIssueHistory" ADD CONSTRAINT "SupplyIssueHistory_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyRestockHistory" ADD CONSTRAINT "SupplyRestockHistory_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "StoreSupply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyRestockHistory" ADD CONSTRAINT "SupplyRestockHistory_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSupply" ADD CONSTRAINT "StoreSupply_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
