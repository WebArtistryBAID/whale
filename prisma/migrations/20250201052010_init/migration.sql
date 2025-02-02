-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('student', 'teacher');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'others');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('wxPay', 'balance', 'cash', 'payLater', 'payForMe');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('orderCreated', 'pickupReminder', 'orderRefunded', 'balanceToppedUp', 'pointsEarned', 'payLaterReminder');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('waiting', 'done');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('pickUp', 'delivery');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('notPaid', 'paid', 'refunded');

-- CreateEnum
CREATE TYPE "UserAuditLogType" AS ENUM ('login', 'blocked', 'unblocked', 'permissionsUpdated', 'balanceTransaction', 'balanceUsed', 'pointsUpdated', 'orderCreated', 'orderSetStatus', 'orderPaymentSuccess', 'orderPaymentFailed', 'orderRefunded');

-- CreateTable
CREATE TABLE "User"
(
    "id"                 INTEGER      NOT NULL,
    "name"               TEXT         NOT NULL,
    "pinyin"             TEXT         NOT NULL,
    "phone"              TEXT,
    "permissions"        TEXT[],
    "type"               "UserType"   NOT NULL,
    "gender"             "Gender"     NOT NULL,
    "blocked"            BOOLEAN      NOT NULL DEFAULT false,
    "points"             TEXT         NOT NULL DEFAULT '0',
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,
    "balance"            TEXT         NOT NULL DEFAULT '0',
    "inboxNotifications" "NotificationType"[] DEFAULT ARRAY['orderCreated', 'pickupReminder', 'orderRefunded', 'balanceToppedUp', 'payLaterReminder']
    :
    :
    "NotificationType"[],
    "smsNotifications"   "NotificationType"[] DEFAULT ARRAY['orderRefunded', 'balanceToppedUp', 'payLaterReminder']
    :
    :
    "NotificationType"
[],

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OATokens"
(
    "id"           SERIAL  NOT NULL,
    "accessToken"  TEXT    NOT NULL,
    "refreshToken" TEXT    NOT NULL,
    "userId"       INTEGER NOT NULL,

    CONSTRAINT "OATokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification"
(
    "id"        SERIAL             NOT NULL,
    "createdAt" TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type"      "NotificationType" NOT NULL,
    "values"    TEXT[],
    "toasted"   BOOLEAN            NOT NULL DEFAULT false,
    "userId"    INTEGER            NOT NULL,
    "orderId"   INTEGER,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponCode"
(
    "id"            TEXT    NOT NULL,
    "value"         TEXT    NOT NULL,
    "allowedUses"   INTEGER NOT NULL,
    "remainingUses" INTEGER NOT NULL,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category"
(
    "id"   SERIAL NOT NULL,
    "name" TEXT   NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag"
(
    "id"    SERIAL NOT NULL,
    "name"  TEXT   NOT NULL,
    "color" TEXT   NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionType"
(
    "id"   SERIAL NOT NULL,
    "name" TEXT   NOT NULL,

    CONSTRAINT "OptionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionItem"
(
    "id"          SERIAL  NOT NULL,
    "typeId"      INTEGER NOT NULL,
    "name"        TEXT    NOT NULL,
    "default"     BOOLEAN NOT NULL DEFAULT false,
    "priceChange" TEXT    NOT NULL DEFAULT '0',
    "soldOut"     BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemType"
(
    "id"               SERIAL       NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoryId"       INTEGER      NOT NULL,
    "name"             TEXT         NOT NULL,
    "image"            TEXT,
    "description"      TEXT         NOT NULL,
    "shortDescription" TEXT         NOT NULL,
    "basePrice"        TEXT         NOT NULL,
    "salePercent"      TEXT         NOT NULL,
    "soldOut"          BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderedItem"
(
    "id"         SERIAL  NOT NULL,
    "orderId"    INTEGER NOT NULL,
    "itemTypeId" INTEGER NOT NULL,
    "amount"     INTEGER NOT NULL,

    CONSTRAINT "OrderedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order"
(
    "id"            SERIAL          NOT NULL,
    "totalPrice"    TEXT            NOT NULL,
    "totalPriceRaw" TEXT            NOT NULL,
    "status"        "OrderStatus"   NOT NULL,
    "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)    NOT NULL,
    "type"          "OrderType"     NOT NULL,
    "deliveryRoom"  TEXT,
    "userId"        INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'notPaid',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "wxPayId"       TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad"
(
    "id"    SERIAL NOT NULL,
    "name"  TEXT   NOT NULL,
    "image" TEXT,
    "url"   TEXT   NOT NULL,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsItem"
(
    "key"   TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SettingsItem_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UserAuditLog"
(
    "id"      SERIAL             NOT NULL,
    "time"    TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type"    "UserAuditLogType" NOT NULL,
    "userId"  INTEGER,
    "orderId" INTEGER,
    "values"  TEXT[],

    CONSTRAINT "UserAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OptionItemToOrderedItem"
(
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_OptionItemToOrderedItem_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateTable
CREATE TABLE "_ItemTypeToTag"
(
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ItemTypeToTag_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateTable
CREATE TABLE "_ItemTypeToOptionType"
(
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ItemTypeToOptionType_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateIndex
CREATE UNIQUE INDEX "OATokens_userId_key" ON "OATokens" ("userId");

-- CreateIndex
CREATE INDEX "_OptionItemToOrderedItem_B_index" ON "_OptionItemToOrderedItem" ("B");

-- CreateIndex
CREATE INDEX "_ItemTypeToTag_B_index" ON "_ItemTypeToTag" ("B");

-- CreateIndex
CREATE INDEX "_ItemTypeToOptionType_B_index" ON "_ItemTypeToOptionType" ("B");

-- AddForeignKey
ALTER TABLE "OATokens"
    ADD CONSTRAINT "OATokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionItem"
    ADD CONSTRAINT "OptionItem_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "OptionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemType"
    ADD CONSTRAINT "ItemType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderedItem"
    ADD CONSTRAINT "OrderedItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderedItem"
    ADD CONSTRAINT "OrderedItem_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuditLog"
    ADD CONSTRAINT "UserAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAuditLog"
    ADD CONSTRAINT "UserAuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionItemToOrderedItem"
    ADD CONSTRAINT "_OptionItemToOrderedItem_A_fkey" FOREIGN KEY ("A") REFERENCES "OptionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OptionItemToOrderedItem"
    ADD CONSTRAINT "_OptionItemToOrderedItem_B_fkey" FOREIGN KEY ("B") REFERENCES "OrderedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTypeToTag"
    ADD CONSTRAINT "_ItemTypeToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ItemType" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTypeToTag"
    ADD CONSTRAINT "_ItemTypeToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTypeToOptionType"
    ADD CONSTRAINT "_ItemTypeToOptionType_A_fkey" FOREIGN KEY ("A") REFERENCES "ItemType" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemTypeToOptionType"
    ADD CONSTRAINT "_ItemTypeToOptionType_B_fkey" FOREIGN KEY ("B") REFERENCES "OptionType" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
