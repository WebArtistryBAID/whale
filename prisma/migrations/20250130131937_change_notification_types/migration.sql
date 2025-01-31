/*
  Warnings:

  - The values [custom] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('orderCreated', 'pickupReminder', 'orderRefunded', 'balanceToppedUp', 'pointsEarned', 'payLaterReminder');
ALTER TABLE "User"
    ALTER COLUMN "inboxNotifications" DROP DEFAULT;
ALTER TABLE "User"
    ALTER COLUMN "smsNotifications" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "inboxNotifications" TYPE "NotificationType_new"[] USING ("inboxNotifications"::text::"NotificationType_new"[]);
ALTER TABLE "User" ALTER COLUMN "smsNotifications" TYPE "NotificationType_new"[] USING ("smsNotifications"::text::"NotificationType_new"[]);
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
ALTER TABLE "User"
    ALTER COLUMN "inboxNotifications" SET DEFAULT ARRAY[]::"NotificationType"[];
ALTER TABLE "User"
    ALTER COLUMN "smsNotifications" SET DEFAULT ARRAY[]::"NotificationType"[];
COMMIT;
