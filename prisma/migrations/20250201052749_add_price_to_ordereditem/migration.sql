/*
  Warnings:

  - Added the required column `price` to the `OrderedItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderedItem"
    ADD COLUMN "price" TEXT NOT NULL;
