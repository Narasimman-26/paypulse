import { NextRequest, NextResponse } from "next/server";
import {
  getInvoice,
  getRemindersForInvoice,
  saveDraftReminder,
} from "@/lib/data-store";
import { checkReminderEligibility } from "@/lib/reminders";
import { generatePaymentReminderWithGemini } from "@/lib/gemini";
import { formatCurrency, formatDate } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * POST /api/invoices/[id]/reminder/generate
 * Generates an AI payment reminder draft using Google Gemini.
 * Replaces existing DRAFT instead of creating duplicates.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const invoice = getInvoice(id);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const reminders = getRemindersForInvoice(invoice.id);
    const eligibility = checkReminderEligibility(invoice, reminders);

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reason || "Invoice is not eligible for payment reminders.",
        },
        { status: 400 }
      );
    }

    // Check if an active APPROVED or SCHEDULED reminder already exists
    if (eligibility.activeReminder && eligibility.activeReminder.status !== "DRAFT") {
      return NextResponse.json(
        {
          error: `An active reminder in '${eligibility.activeReminder.status}' status already exists. Please send or cancel it before generating a new draft.`,
          activeReminder: eligibility.activeReminder,
        },
        { status: 400 }
      );
    }

    // Compute input fields for Gemini
    const dueTime = new Date(invoice.dueDate).getTime();
    const nowTime = Date.now();
    const diffDays = Math.round((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.max(0, -diffDays);

    const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const paymentLink =
      invoice.paypalPaymentUrl || `${appBaseUrl}/invoices/${invoice.id}`;

    const reminderTone = invoice.reminderTone || "FRIENDLY";

    // Call Gemini with structured JSON output and fallback
    const generated = await generatePaymentReminderWithGemini({
      invoiceNumber: invoice.invoiceNumber,
      amountFormatted: formatCurrency(invoice.amount, invoice.currency),
      currency: invoice.currency,
      dueDate: formatDate(invoice.dueDate),
      daysOverdue,
      paymentLink,
      reminderTone,
      freelancerName: "Alex Morgan",
      clientName: invoice.clientName,
      title: invoice.title,
    });

    // Save reminder with status DRAFT (replaces existing draft for this invoice)
    const reminder = saveDraftReminder({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientCompany: invoice.clientCompany,
      subject: generated.subject,
      message: generated.body,
      invoiceAmount: invoice.amount,
      type: reminderTone === "URGENT" || reminderTone === "FIRM" ? "FIRM" : "FRIENDLY",
    });

    return NextResponse.json(
      {
        success: true,
        message: generated.isFallback
          ? "Generated rule-based reminder draft (Gemini fallback used)."
          : "AI payment reminder draft generated successfully.",
        reminder,
        isFallback: generated.isFallback,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal error";
    console.error("[Generate Reminder Error]:", error);
    return NextResponse.json(
      { error: "Failed to generate payment reminder", detail: errorMsg },
      { status: 500 }
    );
  }
}
