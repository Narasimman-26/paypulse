"use server";

import { revalidatePath } from "next/cache";
import {
  getReminder,
  getInvoice,
  getRemindersForInvoice,
  updateReminder,
  approveReminder,
  scheduleReminder,
  cancelReminder,
  markReminderSent,
  markReminderFailed,
  ReminderItem,
  getDerivedStatus,
} from "@/lib/data-store";
import { checkReminderEligibility } from "@/lib/reminders";
import { sendPayPalInvoiceReminder } from "@/lib/paypal";

export interface ReminderActionResult {
  success: boolean;
  reminder?: ReminderItem;
  message?: string;
  error?: string;
}

/**
 * Save edits to subject and body.
 * CRITICAL RULE: Editing an approved reminder resets it to DRAFT.
 */
export async function saveReminderAction(params: {
  id: string;
  subject: string;
  message: string;
  scheduledFor?: string | null;
}): Promise<ReminderActionResult> {
  try {
    const existing = getReminder(params.id);
    if (!existing) {
      return { success: false, error: "Reminder not found" };
    }

    const wasApproved = existing.status === "APPROVED";
    const updated = updateReminder(params.id, {
      subject: params.subject,
      message: params.message,
      scheduledFor: params.scheduledFor,
    });

    if (!updated) {
      return { success: false, error: "Failed to update reminder" };
    }

    revalidatePath(`/invoices/${existing.invoiceId}`);
    revalidatePath("/reminders");

    const message =
      wasApproved && updated.status === "DRAFT"
        ? "Reminder content updated. Status reset to Draft for freelancer re-approval."
        : "Reminder saved successfully.";

    return { success: true, reminder: updated, message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save reminder";
    return { success: false, error: msg };
  }
}

/**
 * Approve an active reminder.
 * Sets status to APPROVED, sets approvedAt.
 */
export async function approveReminderAction(id: string): Promise<ReminderActionResult> {
  try {
    const existing = getReminder(id);
    if (!existing) {
      return { success: false, error: "Reminder not found" };
    }

    const updated = approveReminder(id);
    if (!updated) {
      return { success: false, error: "Failed to approve reminder" };
    }

    revalidatePath(`/invoices/${existing.invoiceId}`);
    revalidatePath("/reminders");

    return {
      success: true,
      reminder: updated,
      message: "Reminder approved! It can now be sent immediately or scheduled.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to approve reminder";
    return { success: false, error: msg };
  }
}

/**
 * Schedule an approved reminder for a specific date/time.
 */
export async function scheduleReminderAction(params: {
  id: string;
  scheduledFor: string;
}): Promise<ReminderActionResult> {
  try {
    const existing = getReminder(params.id);
    if (!existing) {
      return { success: false, error: "Reminder not found" };
    }

    const updated = scheduleReminder(params.id, params.scheduledFor);
    if (!updated) {
      return { success: false, error: "Failed to schedule reminder" };
    }

    revalidatePath(`/invoices/${existing.invoiceId}`);
    revalidatePath("/reminders");

    return {
      success: true,
      reminder: updated,
      message: `Reminder scheduled for ${new Date(params.scheduledFor).toLocaleString()}.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to schedule reminder";
    return { success: false, error: msg };
  }
}

/**
 * Cancel an active reminder.
 */
export async function cancelReminderAction(id: string): Promise<ReminderActionResult> {
  try {
    const existing = getReminder(id);
    if (!existing) {
      return { success: false, error: "Reminder not found" };
    }

    const updated = cancelReminder(id);
    if (!updated) {
      return { success: false, error: "Failed to cancel reminder" };
    }

    revalidatePath(`/invoices/${existing.invoiceId}`);
    revalidatePath("/reminders");

    return {
      success: true,
      reminder: updated,
      message: "Reminder cancelled.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel reminder";
    return { success: false, error: msg };
  }
}

/**
 * Send now: call PayPal "send invoice reminder" for the invoice (subject + note).
 * Before sending, re-check the invoice is still unpaid.
 * Mark SENT with sentAt, or FAILED with error.
 */
export async function sendReminderNowAction(id: string): Promise<ReminderActionResult> {
  try {
    const reminder = getReminder(id);
    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    // Must be APPROVED before sending (or SCHEDULED)
    if (reminder.status !== "APPROVED" && reminder.status !== "SCHEDULED") {
      return {
        success: false,
        error: `Only approved reminders can be sent. Current status is ${reminder.status}. Please approve the draft first.`,
      };
    }

    const invoice = getInvoice(reminder.invoiceId);
    if (!invoice) {
      return { success: false, error: "Associated invoice not found" };
    }

    // 1. Re-check the invoice is still unpaid
    const derived = getDerivedStatus(invoice);
    if (derived === "PAID" || invoice.status === "PAID") {
      cancelReminder(reminder.id);
      revalidatePath(`/invoices/${invoice.id}`);
      return {
        success: false,
        error: "Invoice is already paid in full. The pending reminder has been cancelled.",
      };
    }

    if (derived === "CANCELLED" || invoice.status === "CANCELLED") {
      cancelReminder(reminder.id);
      revalidatePath(`/invoices/${invoice.id}`);
      return {
        success: false,
        error: "Invoice was cancelled. The pending reminder has been cancelled.",
      };
    }

    // 2. Validate PayPal invoice ID
    if (!invoice.paypalInvoiceId) {
      return {
        success: false,
        error: "Invoice has no PayPal invoice ID. It must be sent via PayPal first.",
      };
    }

    // 3. Check send limits: Max 3 sent reminders, Min 3 days between sends
    const allReminders = getRemindersForInvoice(invoice.id);
    const eligibility = checkReminderEligibility(invoice, allReminders);
    if (!eligibility.canSend) {
      return {
        success: false,
        error: eligibility.sendBlockReason || "Send criteria not met.",
      };
    }

    // 4. Call PayPal Send Invoice Reminder API
    try {
      await sendPayPalInvoiceReminder(
        invoice.paypalInvoiceId,
        reminder.subject,
        reminder.message
      );

      // Mark SENT with sentAt
      const updated = markReminderSent(reminder.id);

      revalidatePath(`/invoices/${invoice.id}`);
      revalidatePath("/reminders");
      revalidatePath("/");

      return {
        success: true,
        reminder: updated || reminder,
        message: "Payment reminder successfully dispatched via PayPal Sandbox!",
      };
    } catch (apiError: unknown) {
      const errorMsg = apiError instanceof Error ? apiError.message : "PayPal API reminder error";
      // Mark FAILED with sendError
      const failed = markReminderFailed(reminder.id, errorMsg);

      revalidatePath(`/invoices/${invoice.id}`);
      revalidatePath("/reminders");

      return {
        success: false,
        reminder: failed || reminder,
        error: `PayPal Send Reminder Failed: ${errorMsg}`,
      };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to execute send reminder";
    return { success: false, error: msg };
  }
}
