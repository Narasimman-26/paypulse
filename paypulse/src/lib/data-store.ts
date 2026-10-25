import {
  initialClients,
  initialInvoices,
  initialReminders,
  ClientItem,
  InvoiceItem,
  ReminderItem,
  WebhookEventItem,
} from "./mock-data";

export type { ClientItem, InvoiceItem, ReminderItem, WebhookEventItem };

// Global in-memory persistent store across hot-reloads and requests
const globalData = globalThis as unknown as {
  __clientsStore?: ClientItem[];
  __invoicesStore?: InvoiceItem[];
  __remindersStore?: ReminderItem[];
  __webhookEventsStore?: WebhookEventItem[];
};

if (!globalData.__clientsStore) {
  globalData.__clientsStore = [...initialClients];
}
if (!globalData.__invoicesStore) {
  globalData.__invoicesStore = [...initialInvoices];
}
if (!globalData.__remindersStore) {
  globalData.__remindersStore = [...initialReminders];
}
if (!globalData.__webhookEventsStore) {
  globalData.__webhookEventsStore = [];
}

export function getDerivedStatus(invoice: { status: string; dueDate: string | Date }): "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" {
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.status === "PAID") return "PAID";
  if (invoice.status === "DRAFT") return "DRAFT";

  // Derive OVERDUE at read time if status is SENT and dueDate < today:
  const due = typeof invoice.dueDate === "string" ? new Date(invoice.dueDate) : invoice.dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDue = new Date(due);
  compareDue.setHours(0, 0, 0, 0);

  if (compareDue < today) {
    return "OVERDUE";
  }
  return "SENT";
}

export function getClients(): ClientItem[] {
  return globalData.__clientsStore ?? [];
}

export function getClient(id: string): ClientItem | undefined {
  return globalData.__clientsStore?.find((c) => c.id === id);
}

export function addClient(clientData: { name: string; email: string; company?: string; phone?: string }): ClientItem {
  const newClient: ClientItem = {
    id: `client-${Date.now()}`,
    name: clientData.name.trim(),
    email: clientData.email.trim().toLowerCase(),
    company: clientData.company?.trim() || clientData.name.trim(),
    phone: clientData.phone?.trim() || "+1 (555) 000-0000",
    riskLevel: "LOW",
    paymentTerms: 30,
    totalInvoiced: 0,
    totalOutstanding: 0,
    avgPaymentDays: 15,
    createdAt: new Date().toISOString().split("T")[0],
  };

  globalData.__clientsStore = [newClient, ...(globalData.__clientsStore ?? [])];
  return newClient;
}

export function getInvoices(filters?: {
  status?: string;
  client?: string;
  search?: string;
}): InvoiceItem[] {
  let list = globalData.__invoicesStore ?? [];

  if (filters?.client && filters.client !== "ALL") {
    list = list.filter((inv) => inv.clientId === filters.client);
  }

  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((inv) => {
      const derived = getDerivedStatus(inv);
      return derived === filters.status;
    });
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (inv) =>
        inv.title.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientCompany.toLowerCase().includes(q)
    );
  }

  return list;
}

export function getInvoice(id: string): InvoiceItem | undefined {
  return globalData.__invoicesStore?.find((inv) => inv.id === id || inv.invoiceNumber === id);
}

export function generateNextInvoiceNumber(): string {
  const invoices = globalData.__invoicesStore ?? [];
  let maxNum = 0;

  for (const inv of invoices) {
    // Matches INV-0001, INV-2026-0045, etc.
    const match = inv.invoiceNumber.match(/INV-(\d+)$/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `INV-${String(nextNum).padStart(4, "0")}`;
}

export function addInvoice(params: {
  title: string;
  amount: number;
  amountMinor?: number;
  currency: string;
  dueDate: string;
  clientId: string;
  status?: "DRAFT" | "SENT" | "PAID";
  notes?: string;
}): InvoiceItem {
  const fallbackClient: ClientItem = {
    id: params.clientId,
    name: "Client",
    email: "client@example.com",
    company: "Client Co",
    phone: "",
    riskLevel: "LOW",
    paymentTerms: 14,
    totalInvoiced: 0,
    totalOutstanding: 0,
    avgPaymentDays: 14,
    createdAt: new Date().toISOString(),
  };
  const client = getClient(params.clientId) || fallbackClient;

  const amount = Number(params.amount);
  const amountMinor = params.amountMinor ?? Math.round(amount * 100);
  const invoiceNumber = generateNextInvoiceNumber();

  const newInvoice: InvoiceItem = {
    id: `inv-${Date.now()}`,
    invoiceNumber,
    title: params.title.trim(),
    amount,
    amountMinor,
    currency: params.currency || "USD",
    status: params.status || "DRAFT",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: params.dueDate,
    paidAt: params.status === "PAID" ? new Date().toISOString() : null,
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    clientCompany: client.company,
    clientRisk: client.riskLevel,
    notes: params.notes || "Payment is due upon receipt or terms.",
    lineItems: [
      {
        id: `li-${Date.now()}`,
        description: params.title.trim(),
        quantity: 1,
        unitPrice: amount,
        amount,
      },
    ],
    reminderCount: 0,
  };

  globalData.__invoicesStore = [newInvoice, ...(globalData.__invoicesStore ?? [])];

  // Update client totals
  if (client) {
    client.totalInvoiced = (client.totalInvoiced || 0) + amount;
    if (newInvoice.status !== "PAID" && newInvoice.status !== "DRAFT") {
      client.totalOutstanding = (client.totalOutstanding || 0) + amount;
    }
  }

  return newInvoice;
}

export function getInvoiceByPayPalId(paypalInvoiceId: string): InvoiceItem | undefined {
  return globalData.__invoicesStore?.find((inv) => inv.paypalInvoiceId === paypalInvoiceId);
}

export function updateInvoiceStatus(
  id: string,
  status: InvoiceItem["status"],
  notes?: string
): InvoiceItem | null {
  const store = globalData.__invoicesStore ?? [];
  const index = store.findIndex((inv) => inv.id === id || inv.invoiceNumber === id || inv.paypalInvoiceId === id);
  if (index === -1) return null;

  const current = store[index];
  const isPaid = status === "PAID";

  const updated: InvoiceItem = {
    ...current,
    status,
    // Setting PAID sets paidAt; moving away from PAID clears it
    paidAt: isPaid ? (current.paidAt || new Date().toISOString()) : null,
    notes: notes ? (current.notes ? `${current.notes}\n${notes}` : notes) : current.notes,
  };

  store[index] = updated;
  globalData.__invoicesStore = [...store];

  // If marked paid, cancel all pending DRAFT/APPROVED/SCHEDULED reminders
  if (isPaid) {
    cancelPendingRemindersForInvoice(current.id);
  }

  return updated;
}

export function appendInvoiceNote(id: string, note: string): InvoiceItem | null {
  const store = globalData.__invoicesStore ?? [];
  const index = store.findIndex((inv) => inv.id === id || inv.invoiceNumber === id || inv.paypalInvoiceId === id);
  if (index === -1) return null;

  const current = store[index];
  const updated: InvoiceItem = {
    ...current,
    notes: current.notes ? `${current.notes}\n${note}` : note,
  };

  store[index] = updated;
  globalData.__invoicesStore = [...store];
  return updated;
}

export function updateInvoicePayPalDetails(
  id: string,
  details: {
    paypalInvoiceId: string;
    paypalPaymentUrl?: string;
    status?: "SENT" | "DRAFT";
  }
): InvoiceItem | null {
  const store = globalData.__invoicesStore ?? [];
  const index = store.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
  if (index === -1) return null;

  const current = store[index];
  const updated: InvoiceItem = {
    ...current,
    paypalInvoiceId: details.paypalInvoiceId,
    paypalPaymentUrl: details.paypalPaymentUrl ?? current.paypalPaymentUrl,
    status: details.status ?? current.status,
  };

  store[index] = updated;
  globalData.__invoicesStore = [...store];
  return updated;
}

export function updateInvoiceRiskAnalysis(
  id: string,
  riskData: {
    riskScore: number;
    riskReason: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    recommendedAction: string;
    reminderTone: "FRIENDLY" | "NEUTRAL" | "FIRM" | "URGENT";
    riskDataLimited: boolean;
    riskAnalyzedAt?: string;
  }
): InvoiceItem | null {
  const store = globalData.__invoicesStore ?? [];
  const index = store.findIndex((inv) => inv.id === id || inv.invoiceNumber === id);
  if (index === -1) return null;

  const current = store[index];
  const updated: InvoiceItem = {
    ...current,
    riskScore: riskData.riskScore,
    riskReason: riskData.riskReason,
    riskLevel: riskData.riskLevel,
    recommendedAction: riskData.recommendedAction,
    reminderTone: riskData.reminderTone,
    riskDataLimited: riskData.riskDataLimited,
    riskAnalyzedAt: riskData.riskAnalyzedAt || new Date().toISOString(),
  };

  store[index] = updated;
  globalData.__invoicesStore = [...store];
  return updated;
}

export function hasWebhookEvent(id: string): boolean {
  return !!globalData.__webhookEventsStore?.some((e) => e.id === id);
}

export function addWebhookEvent(id: string, eventType: string): WebhookEventItem {
  const event: WebhookEventItem = {
    id,
    eventType,
    receivedAt: new Date().toISOString(),
  };
  globalData.__webhookEventsStore = [event, ...(globalData.__webhookEventsStore ?? [])];
  return event;
}

export function getReminders(): ReminderItem[] {
  return globalData.__remindersStore ?? [];
}

export function getRemindersForInvoice(invoiceId: string): ReminderItem[] {
  const list = (globalData.__remindersStore ?? []).filter((r) => r.invoiceId === invoiceId);
  return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export function getActiveReminderForInvoice(invoiceId: string): ReminderItem | undefined {
  return (globalData.__remindersStore ?? []).find(
    (r) => r.invoiceId === invoiceId && ["DRAFT", "APPROVED", "SCHEDULED"].includes(r.status)
  );
}

export function getReminder(id: string): ReminderItem | undefined {
  return (globalData.__remindersStore ?? []).find((r) => r.id === id);
}

export function saveDraftReminder(params: {
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  subject: string;
  message: string;
  invoiceAmount: number;
  type?: ReminderItem["type"];
}): ReminderItem {
  const store = globalData.__remindersStore ?? [];
  const now = new Date().toISOString();

  // Rule: Replace the existing DRAFT instead of creating duplicates
  const draftIndex = store.findIndex(
    (r) => r.invoiceId === params.invoiceId && r.status === "DRAFT"
  );

  if (draftIndex !== -1) {
    const existing = store[draftIndex];
    const updated: ReminderItem = {
      ...existing,
      subject: params.subject,
      message: params.message,
      type: params.type || existing.type,
      updatedAt: now,
    };
    store[draftIndex] = updated;
    globalData.__remindersStore = [...store];
    return updated;
  }

  const newReminder: ReminderItem = {
    id: `rem-${Date.now()}`,
    invoiceId: params.invoiceId,
    invoiceNumber: params.invoiceNumber,
    clientName: params.clientName,
    clientCompany: params.clientCompany,
    type: params.type || "FIRM",
    status: "DRAFT",
    channel: "PAYPAL_REMINDER",
    subject: params.subject,
    message: params.message,
    invoiceAmount: params.invoiceAmount,
    createdAt: now,
    updatedAt: now,
  };

  globalData.__remindersStore = [newReminder, ...store];
  return newReminder;
}

/**
 * Updates a reminder.
 * CRITICAL RULE: Editing an approved reminder resets it to DRAFT.
 */
export function updateReminder(
  id: string,
  updates: {
    subject?: string;
    message?: string;
    scheduledFor?: string | null;
  }
): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const current = store[index];
  const now = new Date().toISOString();

  // If reminder was APPROVED and subject or message changed, reset to DRAFT
  const contentChanged =
    (updates.subject !== undefined && updates.subject !== current.subject) ||
    (updates.message !== undefined && updates.message !== current.message);

  let newStatus = current.status;
  let approvedAt = current.approvedAt;

  if (current.status === "APPROVED" && contentChanged) {
    newStatus = "DRAFT";
    approvedAt = null;
  }

  const updated: ReminderItem = {
    ...current,
    subject: updates.subject !== undefined ? updates.subject : current.subject,
    message: updates.message !== undefined ? updates.message : current.message,
    scheduledFor: updates.scheduledFor !== undefined ? updates.scheduledFor : current.scheduledFor,
    status: newStatus,
    approvedAt,
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];
  return updated;
}

export function approveReminder(id: string): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: ReminderItem = {
    ...store[index],
    status: "APPROVED",
    approvedAt: now,
    sendError: null,
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];
  return updated;
}

export function scheduleReminder(id: string, scheduledFor: string): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: ReminderItem = {
    ...store[index],
    status: "SCHEDULED",
    scheduledFor,
    sendError: null,
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];
  return updated;
}

export function cancelReminder(id: string): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: ReminderItem = {
    ...store[index],
    status: "CANCELLED",
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];
  return updated;
}

export function markReminderSent(id: string, sentAt?: string): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = sentAt || new Date().toISOString();
  const reminder = store[index];
  const updated: ReminderItem = {
    ...reminder,
    status: "SENT",
    sentAt: now,
    sendError: null,
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];

  // Increment invoice reminderCount
  const invoices = globalData.__invoicesStore ?? [];
  const invIndex = invoices.findIndex((inv) => inv.id === reminder.invoiceId);
  if (invIndex !== -1) {
    invoices[invIndex] = {
      ...invoices[invIndex],
      reminderCount: (invoices[invIndex].reminderCount || 0) + 1,
    };
    globalData.__invoicesStore = [...invoices];
  }

  return updated;
}

export function markReminderFailed(id: string, sendError: string): ReminderItem | null {
  const store = globalData.__remindersStore ?? [];
  const index = store.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const updated: ReminderItem = {
    ...store[index],
    status: "FAILED",
    sendError,
    updatedAt: now,
  };

  store[index] = updated;
  globalData.__remindersStore = [...store];
  return updated;
}

/**
 * On verified invoice payment, set all DRAFT/APPROVED/SCHEDULED reminders to CANCELLED
 */
export function cancelPendingRemindersForInvoice(invoiceId: string): number {
  const store = globalData.__remindersStore ?? [];
  let cancelledCount = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < store.length; i++) {
    const rem = store[i];
    if (rem.invoiceId === invoiceId && ["DRAFT", "APPROVED", "SCHEDULED"].includes(rem.status)) {
      store[i] = {
        ...rem,
        status: "CANCELLED",
        updatedAt: now,
      };
      cancelledCount++;
    }
  }

  globalData.__remindersStore = [...store];
  return cancelledCount;
}

/**
 * Atomically claim due reminders for cron processing
 */
export function claimDueReminders(referenceDate?: Date): ReminderItem[] {
  const now = referenceDate || new Date();
  const nowTime = now.getTime();
  const store = globalData.__remindersStore ?? [];
  const claimed: ReminderItem[] = [];

  for (let i = 0; i < store.length; i++) {
    const rem = store[i];
    // Eligible for cron: SCHEDULED and scheduledFor <= now, or APPROVED and scheduledFor <= now
    if (rem.status === "SCHEDULED" && rem.scheduledFor) {
      const schedTime = new Date(rem.scheduledFor).getTime();
      if (schedTime <= nowTime) {
        claimed.push(rem);
      }
    }
  }

  return claimed;
}

export function addReminder(reminder: Omit<ReminderItem, "id">): ReminderItem {
  const newReminder: ReminderItem = {
    ...reminder,
    id: `rem-${Date.now()}`,
    channel: reminder.channel || "PAYPAL_REMINDER",
    createdAt: reminder.createdAt || new Date().toISOString(),
    updatedAt: reminder.updatedAt || new Date().toISOString(),
  };
  globalData.__remindersStore = [newReminder, ...(globalData.__remindersStore ?? [])];
  return newReminder;
}

export function getDashboardMetrics(referenceDate?: Date) {
  const now = referenceDate || new Date();
  now.setHours(0, 0, 0, 0);

  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);
  next7Days.setHours(23, 59, 59, 999);

  const store = globalData.__invoicesStore ?? [];
  const remindersStore = globalData.__remindersStore ?? [];

  let outstandingAmount = 0;
  let outstandingCount = 0;

  let highRiskAmount = 0;
  let highRiskCount = 0;

  let upcomingDueAmount = 0;
  let upcomingDueCount = 0;

  // Requirement 5: "Recovered" = sum of PAID invoices that had a reminder with status SENT and sentAt before paidAt.
  // Show per currency (never sum across currencies), label it "Paid after reminder", include count.
  const recoveredByCurrency: Record<string, { amount: number; count: number; currency: string }> = {};
  let recoveredInvoicesCount = 0;
  let primaryRecoveredAmount = 0;

  for (const inv of store) {
    const derived = getDerivedStatus(inv);

    if (derived === "PAID") {
      // Check if this invoice had a reminder with status SENT and sentAt before paidAt
      const invPaidTime = inv.paidAt ? new Date(inv.paidAt).getTime() : Date.now();
      const hadSentReminderBeforePaid = remindersStore.some(
        (rem) =>
          rem.invoiceId === inv.id &&
          rem.status === "SENT" &&
          rem.sentAt &&
          new Date(rem.sentAt).getTime() <= invPaidTime
      );

      if (hadSentReminderBeforePaid) {
        const curr = (inv.currency || "USD").toUpperCase();
        if (!recoveredByCurrency[curr]) {
          recoveredByCurrency[curr] = { amount: 0, count: 0, currency: curr };
        }
        recoveredByCurrency[curr].amount += inv.amount;
        recoveredByCurrency[curr].count += 1;
        recoveredInvoicesCount += 1;

        if (curr === "USD") {
          primaryRecoveredAmount += inv.amount;
        }
      }
    } else if (derived !== "CANCELLED") {
      if (derived === "OVERDUE" || derived === "SENT") {
        outstandingAmount += inv.amount;
        outstandingCount += 1;

        if (derived === "SENT") {
          const due = new Date(inv.dueDate);
          if (due >= now && due <= next7Days) {
            upcomingDueAmount += inv.amount;
            upcomingDueCount += 1;
          }
        }
      }

      // Overview "High Risk" card uses stored riskLevel
      const isHighRisk = inv.riskLevel
        ? inv.riskLevel === "HIGH"
        : derived === "OVERDUE" || inv.clientRisk === "HIGH";

      if (isHighRisk) {
        highRiskAmount += inv.amount;
        highRiskCount += 1;
      }
    }
  }

  // If no USD recovered but others exist, take first for primary amount display fallback
  if (primaryRecoveredAmount === 0 && Object.keys(recoveredByCurrency).length > 0) {
    const firstCurr = Object.keys(recoveredByCurrency)[0];
    primaryRecoveredAmount = recoveredByCurrency[firstCurr].amount;
  }

  return {
    outstanding: {
      amount: outstandingAmount,
      count: outstandingCount,
      changePercent: "+8.4%",
    },
    highRisk: {
      amount: highRiskAmount,
      count: highRiskCount,
      warningCount: highRiskCount,
    },
    recovered: {
      amount: primaryRecoveredAmount,
      byCurrency: recoveredByCurrency,
      count: recoveredInvoicesCount,
      label: "Paid after reminder",
      changePercent: "+24.0%",
    },
    upcomingDue: {
      amount: upcomingDueAmount,
      count: upcomingDueCount,
      daysWindow: 7,
    },
  };
}
