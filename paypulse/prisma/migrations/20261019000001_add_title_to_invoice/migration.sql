-- AlterTable: Add title and amountMinor to Invoice
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "amountMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
