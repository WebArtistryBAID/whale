/*
  Warnings:

  - The primary key for the `CouponCode` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "CouponCode" DROP CONSTRAINT "CouponCode_pkey",
ALTER
COLUMN "id" DROP
DEFAULT,
ALTER
COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CouponCode_id_seq";
