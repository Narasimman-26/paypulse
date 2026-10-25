-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ReminderTone" AS ENUM ('FRIENDLY', 'NEUTRAL', 'FIRM', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add AI risk analysis fields to Invoice
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "riskScore" INTEGER;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "riskReason" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "riskLevel" "RiskLevel";
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "recommendedAction" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "reminderTone" "ReminderTone";
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "riskAnalyzedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "riskDataLimited" BOOLEAN NOT NULL DEFAULT false;
