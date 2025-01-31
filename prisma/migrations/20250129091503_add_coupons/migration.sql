/*
  Warnings:

  - Added the required column `paymentMethod` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('wxPay', 'balance', 'cash', 'payLater', 'payForMe');

-- AlterTable
ALTER TABLE "Order"
    ADD COLUMN "paymentMethod" "PaymentMethod" NOT NULL;

-- CreateTable
CREATE TABLE "CouponCode"
(
    "id"            SERIAL  NOT NULL,
    "value"         TEXT    NOT NULL,
    "allowedUses"   INTEGER NOT NULL,
    "remainingUses" INTEGER NOT NULL,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id")
);
