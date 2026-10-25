import { InvoiceItem, ReminderItem } from "@/lib/data-store";
import { getDerivedStatus } from "@/lib/data-store";

export interface ReminderEligibility {
  eligible: boolean;
  reason?: string;
  canSend: boolean;
  sendBlockReason?: string;
  activeReminder?: ReminderItem;
  sentRemindersCount: number;
  lastSentAt?: string;
  daysSinceLastSent?: number;
}

/**
 * Validates invoice eligibility for AI payment reminders according to business rules:
 * - Eligible: invoices with riskLevel HIGH (or overdue) that are SENT via PayPal (have paypalInvoiceId) and not PAID/CANCELLED.
 * - One active reminder per invoice (DRAFT, APPROVED, or SCHEDULED).
 * - Max 3 sent reminders per invoice.
 * - Min 3 days between sends.
 */
export function checkReminderEligibility(
  invoice: InvoiceItem,
  invoiceReminders: ReminderItem[]
): ReminderEligibility {
  const derived = getDerivedStatus(invoice);

  // 1. Must not be PAID or CANCELLED
  if (derived === "PAID" || invoice.status === "PAID") {
    return {
      eligible: false,
      reason: "Invoice is already paid in full. No payment reminders needed.",
      canSend: false,
      sendBlockReason: "Invoice is paid",
      sentRemindersCount: 0,
    };
  }

  if (derived === "CANCELLED" || invoice.status === "CANCELLED") {
    return {
      eligible: false,
      reason: "Invoice is cancelled. Automated reminders are disabled.",
      canSend: false,
      sendBlockReason: "Invoice is cancelled",
      sentRemindersCount: 0,
    };
  }

  // 2. Must be SENT via PayPal and have paypalInvoiceId
  if (!invoice.paypalInvoiceId) {
    return {
      eligible: false,
      reason: "Invoice has not been sent via PayPal Sandbox yet. Send via PayPal first to enable reminders.",
      canSend: false,
      sendBlockReason: "Missing PayPal Invoice ID",
      sentRemindersCount: 0,
    };
  }

  if (invoice.status === "DRAFT") {
    return {
      eligible: false,
      reason: "Invoice is in DRAFT status. Send the invoice via PayPal before sending payment reminders.",
      canSend: false,
      sendBlockReason: "Invoice is in Draft status",
      sentRemindersCount: 0,
    };
  }

  // 3. Must be riskLevel HIGH (or overdue)
  const isOverdue = derived === "OVERDUE";
  const isHighRisk = invoice.riskLevel === "HIGH";

  if (!isHighRisk && !isOverdue) {
    return {
      eligible: false,
      reason: "Only high-risk or overdue invoices are eligible for the AI payment reminder workflow.",
      canSend: false,
      sendBlockReason: "Invoice is neither High Risk nor Overdue",
      sentRemindersCount: 0,
    };
  }

  // 4. Check active reminders (DRAFT, APPROVED, SCHEDULED)
  const activeReminder = invoiceReminders.find((r) =>
    ["DRAFT", "APPROVED", "SCHEDULED"].includes(r.status)
  );

  // 5. Check sent reminders constraints (Max 3 sent, Min 3 days between sends)
  const sentReminders = invoiceReminders
    .filter((r) => r.status === "SENT" && r.sentAt)
    .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime());

  const sentCount = sentReminders.length;
  const lastSent = sentReminders[0];

  let canSend = true;
  let sendBlockReason: string | undefined;
  let daysSinceLastSent: number | undefined;

  if (sentCount >= 3) {
    canSend = false;
    sendBlockReason = "Maximum limit of 3 sent reminders has been reached for this invoice.";
  } else if (lastSent && lastSent.sentAt) {
    const lastSentTime = new Date(lastSent.sentAt).getTime();
    const elapsedDays = (Date.now() - lastSentTime) / (1000 * 60 * 60 * 24);
    daysSinceLastSent = Math.floor(elapsedDays);

    if (elapsedDays < 3) {
      canSend = false;
      const daysRemaining = (3 - elapsedDays).toFixed(1);
      sendBlockReason = `Minimum 3 days required between reminder sends. Next reminder can be sent in ${daysRemaining} days (last sent ${new Date(lastSent.sentAt).toLocaleDateString()}).`;
    }
  }

  return {
    eligible: true,
    canSend,
    sendBlockReason,
    activeReminder,
    sentRemindersCount: sentCount,
    lastSentAt: lastSent?.sentAt || undefined,
    daysSinceLastSent,
  };
}
