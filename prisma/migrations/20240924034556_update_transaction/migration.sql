/*
  Warnings:

  - Changed the type of `capital_gains` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "capital_gains",
ADD COLUMN     "capital_gains" BOOLEAN NOT NULL;
