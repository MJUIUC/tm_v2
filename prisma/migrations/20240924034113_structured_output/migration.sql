/*
  Warnings:

  - You are about to drop the column `actionDate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `assetName` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `assetType` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `notificationDate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `ownerDetail` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionType` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `asset` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capital_gains` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notification_date` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "actionDate",
DROP COLUMN "assetName",
DROP COLUMN "assetType",
DROP COLUMN "notificationDate",
DROP COLUMN "ownerDetail",
DROP COLUMN "transactionType",
ADD COLUMN     "asset" TEXT NOT NULL,
ADD COLUMN     "capital_gains" TEXT NOT NULL,
ADD COLUMN     "date" TEXT NOT NULL,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "notification_date" TEXT NOT NULL,
ADD COLUMN     "owner" TEXT,
ADD COLUMN     "type" TEXT NOT NULL;
