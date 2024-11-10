-- CreateTable
CREATE TABLE "Politician" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "politicianUuid" TEXT NOT NULL,
    "actionDate" TEXT NOT NULL,
    "notificationDate" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "ownerDetail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "financialDisclosureReportUuid" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialDisclosureReport" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "politicianUuid" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "filingDate" TEXT NOT NULL,
    "filingType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "reportUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialDisclosureReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Politician_uuid_key" ON "Politician"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDisclosureReport_uuid_key" ON "FinancialDisclosureReport"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialDisclosureReport_documentId_key" ON "FinancialDisclosureReport"("documentId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_financialDisclosureReportUuid_fkey" FOREIGN KEY ("financialDisclosureReportUuid") REFERENCES "FinancialDisclosureReport"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialDisclosureReport" ADD CONSTRAINT "FinancialDisclosureReport_politicianUuid_fkey" FOREIGN KEY ("politicianUuid") REFERENCES "Politician"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
