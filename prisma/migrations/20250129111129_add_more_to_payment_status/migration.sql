/*
  Warnings:

  - You are about to drop the column `paid` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('notPaid', 'paid', 'refunded');

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paid",
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'notPaid';
