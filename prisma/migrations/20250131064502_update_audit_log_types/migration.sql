/*
  Warnings:

  - The values [balanceUpdated] on the enum `UserAuditLogType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserAuditLogType_new" AS ENUM ('login', 'blocked', 'unblocked', 'permissionsUpdated', 'balanceTransaction', 'balanceUsed', 'pointsUpdated', 'orderCreated', 'orderSetStatus', 'orderPaymentSuccess', 'orderPaymentFailed', 'orderRefunded');
ALTER TABLE "UserAuditLog" ALTER COLUMN "type" TYPE "UserAuditLogType_new" USING ("type"::text::"UserAuditLogType_new");
ALTER TYPE "UserAuditLogType" RENAME TO "UserAuditLogType_old";
ALTER TYPE "UserAuditLogType_new" RENAME TO "UserAuditLogType";
DROP TYPE "UserAuditLogType_old";
COMMIT;

-- AlterTable
ALTER TABLE "User"
    ALTER COLUMN "inboxNotifications" SET DEFAULT ARRAY['orderCreated', 'pickupReminder', 'orderRefunded', 'balanceToppedUp', 'payLaterReminder']::"NotificationType"[],
ALTER
COLUMN "smsNotifications" SET DEFAULT ARRAY['orderRefunded', 'balanceToppedUp', 'payLaterReminder']::"NotificationType"[];
