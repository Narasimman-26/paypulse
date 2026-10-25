-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReminderChannel" AS ENUM ('PAYPAL_REMINDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update ReminderStatus enum values
DO $$ BEGIN
    ALTER TYPE "ReminderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
    ALTER TYPE "ReminderStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
    ALTER TYPE "ReminderStatus" ADD VALUE IF NOT EXISTS 'FAILED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add AI payment reminder fields to Reminder
ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "sendError" TEXT;
ALTER TABLE "reminders" ADD COLUMN IF NOT EXISTS "channel" "ReminderChannel" NOT NULL DEFAULT 'PAYPAL_REMINDER';
ALTER TABLE "reminders" ALTER COLUMN "scheduledFor" DROP NOT NULL;
ALTER TABLE "reminders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
