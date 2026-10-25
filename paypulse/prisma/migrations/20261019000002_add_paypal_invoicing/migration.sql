-- AlterTable: Add paypal fields to Invoice
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paypalInvoiceId" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paypalPaymentUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_paypalInvoiceId_key" ON "invoices"("paypalInvoiceId");

-- CreateTable: WebhookEvent for idempotency
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);
