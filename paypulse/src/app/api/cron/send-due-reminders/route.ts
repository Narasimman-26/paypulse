import { NextRequest, NextResponse } from "next/server";
import {
  claimDueReminders,
  getInvoice,
  getDerivedStatus,
  getRemindersForInvoice,
  markReminderSent,
  markReminderFailed,
  cancelReminder,
} from "@/lib/data-store";
import { checkReminderEligibility } from "@/lib/reminders";
import { sendPayPalInvoiceReminder } from "@/lib/paypal";

export const runtime = "nodejs";

/**
 * Helper to check cron authorization
 */
function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    // In local development, allow manual execution with warning if secret is unset
    console.warn("[Cron API] CRON_SECRET is not configured. Allowing request in dev mode.");
    return true;
  }

  // Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === cronSecret) return true;
  }

  // Check x-cron-secret header
  const xSecret = req.headers.get("x-cron-secret")?.trim();
  if (xSecret === cronSecret) return true;

  // Check query parameter ?secret=...
  const querySecret = req.nextUrl.searchParams.get("secret")?.trim();
  if (querySecret === cronSecret) return true;

  return false;
}

async function handleSendDueReminders(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  const now = new Date();
  const claimedReminders = claimDueReminders(now);
  const results: Array<{
    reminderId: string;
    invoiceNumber: string;
    status: "SENT" | "FAILED" | "CANCELLED" | "SKIPPED";
    error?: string;
  }> = [];

  for (const reminder of claimedReminders) {
    const invoice = getInvoice(reminder.invoiceId);

    // 1. Re-check invoice exists and is still unpaid
    if (!invoice) {
      cancelReminder(reminder.id);
      results.push({
        reminderId: reminder.id,
        invoiceNumber: reminder.invoiceNumber,
        status: "CANCELLED",
        error: "Invoice not found",
      });
      continue;
    }

    const derived = getDerivedStatus(invoice);
    if (derived === "PAID" || invoice.status === "PAID" || derived === "CANCELLED" || invoice.status === "CANCELLED") {
      cancelReminder(reminder.id);
      results.push({
        reminderId: reminder.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "CANCELLED",
        error: `Invoice is ${derived.toLowerCase()}`,
      });
      continue;
    }

    // 2. Validate PayPal Invoice ID
    if (!invoice.paypalInvoiceId) {
      markReminderFailed(reminder.id, "Missing PayPal invoice ID");
      results.push({
        reminderId: reminder.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "FAILED",
        error: "Missing PayPal invoice ID",
      });
      continue;
    }

    // 3. Check send limits: Max 3 sent reminders, Min 3 days between sends
    const allReminders = getRemindersForInvoice(invoice.id);
    const eligibility = checkReminderEligibility(invoice, allReminders);
    if (!eligibility.canSend) {
      results.push({
        reminderId: reminder.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "SKIPPED",
        error: eligibility.sendBlockReason,
      });
      continue;
    }

    // 4. Send via PayPal
    try {
      await sendPayPalInvoiceReminder(
        invoice.paypalInvoiceId,
        reminder.subject,
        reminder.message
      );

      markReminderSent(reminder.id, new Date().toISOString());
      results.push({
        reminderId: reminder.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "SENT",
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "PayPal API reminder error";
      markReminderFailed(reminder.id, errorMsg);
      results.push({
        reminderId: reminder.id,
        invoiceNumber: invoice.invoiceNumber,
        status: "FAILED",
        error: errorMsg,
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      timestamp: now.toISOString(),
      claimedCount: claimedReminders.length,
      processedCount: results.length,
      sentCount: results.filter((r) => r.status === "SENT").length,
      results,
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  return handleSendDueReminders(req);
}

export async function POST(req: NextRequest) {
  return handleSendDueReminders(req);
}
