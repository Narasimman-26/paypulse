// Pure code risk scoring & signals calculation (No AI)
// Deterministic baseline and signal computation for invoices

import { InvoiceItem, getInvoices } from "@/lib/data-store";

export interface InvoiceRiskSignals {
  invoiceId: string;
  invoiceNumber: string;
  title: string;
  status: string;
  amountMinor: number;
  amountMajor: number;
  currency: string;
  daysUntilDue: number;
  daysOverdue: number;
  isOverdue: boolean;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  // Real history signals from DB:
  paidInvoiceCount: number;
  latePaidCount: number;
  averageDelayDays: number;
  currentOutstandingCount: number;
  dataLimited: boolean;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type ReminderTone = "FRIENDLY" | "NEUTRAL" | "FIRM" | "URGENT";

export interface RiskAnalysisResult {
  riskScore: number;
  riskLevel: RiskLevel;
  reason: string;
  recommendedAction: string;
  reminderTone: ReminderTone;
  dataLimited: boolean;
  isFallback?: boolean;
}

/**
 * Computes deterministic signals for an invoice from the database
 */
export function computeSignals(invoice: InvoiceItem): InvoiceRiskSignals {
  const allInvoices = getInvoices();
  // Client's history: all invoices for this client excluding this current invoice
  const clientInvoices = allInvoices.filter(
    (inv) => inv.clientId === invoice.clientId && inv.id !== invoice.id
  );

  const paidInvoices = clientInvoices.filter(
    (inv) => inv.status === "PAID" && inv.paidAt
  );

  const paidInvoiceCount = paidInvoices.length;

  let latePaidCount = 0;
  let totalDelayDays = 0;

  for (const inv of paidInvoices) {
    if (!inv.paidAt) continue;
    const paidDate = new Date(inv.paidAt);
    const dueDate = new Date(inv.dueDate);
    paidDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 0) {
      latePaidCount++;
      totalDelayDays += diffDays;
    }
  }

  const averageDelayDays =
    latePaidCount > 0 ? Math.round(totalDelayDays / latePaidCount) : 0;

  const currentOutstandingCount = clientInvoices.filter(
    (inv) => inv.status !== "PAID" && inv.status !== "CANCELLED"
  ).length;

  // Days until due / days overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const invoiceDue = new Date(invoice.dueDate);
  invoiceDue.setHours(0, 0, 0, 0);

  const diffTime = invoiceDue.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const daysUntilDue = Math.max(0, diffDays);
  const daysOverdue = Math.max(0, -diffDays);
  const isOverdue = diffDays < 0;

  // Rule: dataLimited = paidInvoiceCount < 3
  const dataLimited = paidInvoiceCount < 3;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    title: invoice.title,
    status: invoice.status,
    amountMinor: invoice.amountMinor,
    amountMajor: invoice.amount,
    currency: invoice.currency,
    daysUntilDue,
    daysOverdue,
    isOverdue,
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    clientCompany: invoice.clientCompany,
    paidInvoiceCount,
    latePaidCount,
    averageDelayDays,
    currentOutstandingCount,
    dataLimited,
  };
}

/**
 * Deterministic baseline risk score (0-100)
 */
export function baselineScore(signals: InvoiceRiskSignals): number {
  let score = 20; // Default baseline

  // Overdue impact
  if (signals.isOverdue) {
    if (signals.daysOverdue > 30) score += 50;
    else if (signals.daysOverdue > 14) score += 35;
    else if (signals.daysOverdue > 7) score += 25;
    else score += 15;
  } else {
    // Due soon
    if (signals.daysUntilDue <= 2) score += 10;
    else if (signals.daysUntilDue <= 5) score += 5;
  }

  // Outstanding exposure
  if (signals.currentOutstandingCount >= 3) {
    score += 15;
  } else if (signals.currentOutstandingCount >= 1) {
    score += 8;
  }

  // Client history signals
  if (signals.dataLimited) {
    // Data limited: add moderate uncertainty penalty
    score += 15;
  } else {
    // Proven history available
    const lateRatio = signals.latePaidCount / signals.paidInvoiceCount;
    if (lateRatio >= 0.6) {
      score += 25;
    } else if (lateRatio >= 0.3) {
      score += 15;
    } else if (lateRatio === 0) {
      // Clean on-time track record reward
      score -= 15;
    }

    if (signals.averageDelayDays > 14) {
      score += 15;
    } else if (signals.averageDelayDays > 7) {
      score += 8;
    }
  }

  // High amount exposure check (> $10,000)
  if (signals.amountMinor >= 1000000) {
    score += 10;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Derive risk level from score:
 * <35 LOW, <70 MEDIUM, else HIGH
 * Always derived in code - never trust the model's level
 */
export function levelFromScore(score: number): RiskLevel {
  if (score < 35) return "LOW";
  if (score < 70) return "MEDIUM";
  return "HIGH";
}

/**
 * Fallback deterministic rule-based estimate when Gemini is unavailable, 429, or invalid key
 */
export function generateBaselineRiskAnalysis(
  signals: InvoiceRiskSignals
): RiskAnalysisResult {
  const score = baselineScore(signals);
  const level = levelFromScore(score);

  let tone: ReminderTone = "FRIENDLY";
  if (score >= 70) tone = "URGENT";
  else if (score >= 50) tone = "FIRM";
  else if (score >= 35) tone = "NEUTRAL";

  let reason = "";
  if (signals.dataLimited) {
    reason = `Rule-based estimate: Client has limited payment history (${signals.paidInvoiceCount} settled invoice${
      signals.paidInvoiceCount === 1 ? "" : "s"
    }). Confidence is lower until 3+ invoices are settled.`;
    if (signals.isOverdue) {
      reason += ` Invoice is ${signals.daysOverdue} days past due.`;
    } else if (signals.daysUntilDue <= 3) {
      reason += ` Due in ${signals.daysUntilDue} day(s).`;
    }
  } else {
    reason = `Rule-based estimate: Based on client's history of ${signals.paidInvoiceCount} settled invoices (${
      signals.latePaidCount
    } late, avg delay ${signals.averageDelayDays}d)${
      signals.isOverdue
        ? ` and current delay of ${signals.daysOverdue} days past due.`
        : ` and payment due in ${signals.daysUntilDue} days.`
    }`;
  }

  let recommendedAction = "Send standard friendly reminder before due date.";
  if (score >= 70) {
    recommendedAction =
      "Dispatch urgent formal notice immediately and halt deliverable milestones until payment is confirmed.";
  } else if (score >= 50) {
    recommendedAction =
      "Issue a firm check-in and request payment verification or accounts payable status.";
  } else if (score >= 35) {
    recommendedAction =
      "Send a gentle reminder 48 hours prior to due date with clear payment instructions.";
  } else {
    recommendedAction =
      "No proactive escalation needed. Client exhibits consistent on-time settlement.";
  }

  return {
    riskScore: score,
    riskLevel: level,
    reason,
    recommendedAction,
    reminderTone: tone,
    dataLimited: signals.dataLimited,
    isFallback: true,
  };
}
