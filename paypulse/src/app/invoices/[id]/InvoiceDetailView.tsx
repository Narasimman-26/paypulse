"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Bell,
  Loader2,
  Info,
  Check,
  ExternalLink,
  Copy,
  Send,
  XCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Calendar,
  Save,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InvoiceItem, ReminderItem, getDerivedStatus, getInvoice } from "@/lib/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateInvoiceStatusAction, sendViaPayPalAction } from "@/app/actions/invoices";
import { checkReminderEligibility } from "@/lib/reminders";
import {
  saveReminderAction,
  approveReminderAction,
  scheduleReminderAction,
  sendReminderNowAction,
  cancelReminderAction,
} from "@/app/actions/reminders";

export function InvoiceDetailView({
  initialInvoice,
  initialReminders = [],
}: {
  initialInvoice: InvoiceItem;
  initialReminders?: ReminderItem[];
}) {
  const [invoice, setInvoice] = useState<InvoiceItem>(initialInvoice);
  const [reminders, setReminders] = useState<ReminderItem[]>(initialReminders);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPayPalPending, startPayPalTransition] = useTransition();
  const [copiedPaymentUrl, setCopiedPaymentUrl] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Active reminder state
  const activeReminder = reminders.find((r) =>
    ["DRAFT", "APPROVED", "SCHEDULED"].includes(r.status)
  );

  const [reminderSubject, setReminderSubject] = useState(activeReminder?.subject || "");
  const [reminderBody, setReminderBody] = useState(activeReminder?.message || "");
  const [scheduledDateTime, setScheduledDateTime] = useState(
    activeReminder?.scheduledFor ? new Date(activeReminder.scheduledFor).toISOString().slice(0, 16) : ""
  );
  const [isGeneratingReminder, setIsGeneratingReminder] = useState(false);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [isApprovingReminder, setIsApprovingReminder] = useState(false);
  const [isSchedulingReminder, setIsSchedulingReminder] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isCancellingReminder, setIsCancellingReminder] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [showScheduleInput, setShowScheduleInput] = useState(false);

  // Sync active reminder form when active reminder changes
  const [prevReminderKey, setPrevReminderKey] = useState<string | null>(
    activeReminder ? `${activeReminder.id}_${activeReminder.updatedAt}` : null
  );
  const currentReminderKey = activeReminder ? `${activeReminder.id}_${activeReminder.updatedAt}` : null;
  if (currentReminderKey !== prevReminderKey) {
    setPrevReminderKey(currentReminderKey);
    if (activeReminder) {
      setReminderSubject(activeReminder.subject || "");
      setReminderBody(activeReminder.message || "");
      setScheduledDateTime(
        activeReminder.scheduledFor ? new Date(activeReminder.scheduledFor).toISOString().slice(0, 16) : ""
      );
    }
  }

  const eligibility = checkReminderEligibility(invoice, reminders);

  const handleGenerateReminder = async () => {
    setIsGeneratingReminder(true);
    setReminderError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/reminder/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate reminder draft");
      }
      if (data.reminder) {
        setReminders((prev) => {
          const filtered = prev.filter((r) => r.id !== data.reminder.id && r.status !== "DRAFT");
          return [data.reminder, ...filtered];
        });
        setReminderSubject(data.reminder.subject);
        setReminderBody(data.reminder.message);
      }
      setActionMessage(data.message || "AI payment reminder draft generated!");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error generating reminder";
      setReminderError(msg);
    } finally {
      setIsGeneratingReminder(false);
    }
  };

  const handleSaveReminder = async () => {
    if (!activeReminder) return;
    setIsSavingReminder(true);
    setReminderError(null);
    try {
      const res = await saveReminderAction({
        id: activeReminder.id,
        subject: reminderSubject,
        message: reminderBody,
        scheduledFor: activeReminder.scheduledFor,
      });
      if (!res.success || !res.reminder) {
        throw new Error(res.error || "Failed to save reminder");
      }
      setReminders((prev) =>
        prev.map((r) => (r.id === res.reminder!.id ? res.reminder! : r))
      );
      setActionMessage(res.message || "Reminder draft saved");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving reminder";
      setReminderError(msg);
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleApproveReminder = async () => {
    if (!activeReminder) return;
    setIsApprovingReminder(true);
    setReminderError(null);
    try {
      const res = await approveReminderAction(activeReminder.id);
      if (!res.success || !res.reminder) {
        throw new Error(res.error || "Failed to approve reminder");
      }
      setReminders((prev) =>
        prev.map((r) => (r.id === res.reminder!.id ? res.reminder! : r))
      );
      setActionMessage(res.message || "Reminder approved!");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error approving reminder";
      setReminderError(msg);
    } finally {
      setIsApprovingReminder(false);
    }
  };

  const handleScheduleReminder = async () => {
    if (!activeReminder || !scheduledDateTime) return;
    setIsSchedulingReminder(true);
    setReminderError(null);
    try {
      const res = await scheduleReminderAction({
        id: activeReminder.id,
        scheduledFor: new Date(scheduledDateTime).toISOString(),
      });
      if (!res.success || !res.reminder) {
        throw new Error(res.error || "Failed to schedule reminder");
      }
      setReminders((prev) =>
        prev.map((r) => (r.id === res.reminder!.id ? res.reminder! : r))
      );
      setShowScheduleInput(false);
      setActionMessage(res.message || "Reminder scheduled successfully!");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error scheduling reminder";
      setReminderError(msg);
    } finally {
      setIsSchedulingReminder(false);
    }
  };

  const handleSendReminderNow = async () => {
    if (!activeReminder) return;
    setIsSendingReminder(true);
    setReminderError(null);
    try {
      const res = await sendReminderNowAction(activeReminder.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to send reminder via PayPal");
      }
      if (res.reminder) {
        setReminders((prev) =>
          prev.map((r) => (r.id === res.reminder!.id ? res.reminder! : r))
        );
      }
      setActionMessage(res.message || "Payment reminder sent via PayPal!");
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending reminder";
      setReminderError(msg);
      if (activeReminder) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === activeReminder.id ? { ...r, status: "FAILED", sendError: msg } : r
          )
        );
      }
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleCancelReminder = async () => {
    if (!activeReminder) return;
    setIsCancellingReminder(true);
    setReminderError(null);
    try {
      const res = await cancelReminderAction(activeReminder.id);
      if (!res.success || !res.reminder) {
        throw new Error(res.error || "Failed to cancel reminder");
      }
      setReminders((prev) =>
        prev.map((r) => (r.id === res.reminder!.id ? res.reminder! : r))
      );
      setActionMessage("Reminder cancelled.");
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error cancelling reminder";
      setReminderError(msg);
    } finally {
      setIsCancellingReminder(false);
    }
  };

  const handleAnalyzeRisk = async (force: boolean = false) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/analyze?force=${force ? "true" : "false"}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze risk");
      }

      const updated = getInvoice(invoice.id);
      if (updated) {
        setInvoice({ ...updated });
      } else {
        setInvoice((prev) => ({
          ...prev,
          riskScore: data.riskScore,
          riskLevel: data.riskLevel,
          riskReason: data.reason,
          recommendedAction: data.recommendedAction,
          reminderTone: data.reminderTone,
          riskAnalyzedAt: data.riskAnalyzedAt,
          riskDataLimited: data.riskDataLimited,
        }));
      }

      setActionMessage(data.cached ? "Loaded cached risk analysis." : "AI Risk analysis completed!");
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during analysis";
      setAnalyzeError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const derivedStatus = getDerivedStatus(invoice);

  const handleStatusUpdate = (newStatus: "DRAFT" | "SENT" | "PAID") => {
    startTransition(async () => {
      const result = await updateInvoiceStatusAction({ id: invoice.id, status: newStatus });
      if (!result.success) {
        setErrorMessage(result.errors?.general || "Failed to update status");
      } else {
        const updated = getInvoice(invoice.id) || result.invoice;
        if (updated) {
          setInvoice({ ...updated });
        }
        setActionMessage(`Invoice status updated to ${newStatus}`);
        setTimeout(() => setActionMessage(null), 3500);
      }
    });
  };

  const handleSendViaPayPal = () => {
    setErrorMessage(null);
    startPayPalTransition(async () => {
      const result = await sendViaPayPalAction(invoice.id);
      if (!result.success) {
        setErrorMessage(result.errors?.general || "Failed to send invoice via PayPal Sandbox.");
      } else {
        const updated = getInvoice(invoice.id) || result.invoice;
        if (updated) {
          setInvoice({ ...updated });
        }
        setActionMessage(result.message || "Invoice successfully sent via PayPal Sandbox!");
        setTimeout(() => setActionMessage(null), 5000);
      }
    });
  };

  const handleCopyPaymentUrl = () => {
    if (invoice.paypalPaymentUrl) {
      navigator.clipboard.writeText(invoice.paypalPaymentUrl);
      setCopiedPaymentUrl(true);
      setTimeout(() => setCopiedPaymentUrl(false), 2500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="success" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Overdue (Derived)
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-0.5 gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5" />
            Sent (Active)
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-700 text-xs px-2.5 py-0.5 gap-1.5 font-medium">
            <XCircle className="h-3.5 w-3.5" />
            Cancelled
          </Badge>
        );
      case "DRAFT":
      default:
        return (
          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 gap-1.5 font-medium">
            <FileText className="h-3.5 w-3.5" />
            Draft
          </Badge>
        );
    }
  };

  const getRiskBadge = (level?: string | null) => {
    switch (level) {
      case "LOW":
        return (
          <Badge variant="success" className="text-xs px-2.5 py-0.5 gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Low Risk
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge variant="warning" className="text-xs px-2.5 py-0.5 gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            Medium Risk
          </Badge>
        );
      case "HIGH":
        return (
          <Badge variant="destructive" className="text-xs px-2.5 py-0.5 gap-1 font-medium">
            <ShieldAlert className="h-3.5 w-3.5" />
            High Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  const getReminderToneBadge = (tone?: string | null) => {
    switch (tone) {
      case "FRIENDLY":
        return (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-medium">
            Friendly
          </Badge>
        );
      case "NEUTRAL":
        return (
          <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 text-xs font-medium">
            Neutral
          </Badge>
        );
      case "FIRM":
        return (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 text-xs font-medium">
            Firm
          </Badge>
        );
      case "URGENT":
        return (
          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 text-xs font-medium">
            Urgent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs font-medium">
            Standard
          </Badge>
        );
    }
  };

  const getReminderStatusBadge = (status: ReminderItem["status"]) => {
    switch (status) {
      case "SENT":
        return (
          <Badge variant="success" className="gap-1 font-medium text-[10px]">
            <CheckCircle2 className="h-3 w-3" />
            SENT
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="gap-1 font-medium text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
            <CheckCheck className="h-3 w-3" />
            APPROVED
          </Badge>
        );
      case "SCHEDULED":
        return (
          <Badge variant="warning" className="gap-1 font-medium text-[10px]">
            <Calendar className="h-3 w-3" />
            SCHEDULED
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="gap-1 font-medium text-[10px]">
            <AlertCircle className="h-3 w-3" />
            FAILED
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="gap-1 font-medium text-[10px] text-slate-400">
            <XCircle className="h-3 w-3" />
            CANCELLED
          </Badge>
        );
      case "DRAFT":
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-medium text-[10px]">
            <FileText className="h-3 w-3" />
            DRAFT
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-9 w-9 p-0 border-slate-200 dark:border-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400">
                {invoice.invoiceNumber}
              </span>
              {getStatusBadge(derivedStatus)}
              {invoice.riskLevel && getRiskBadge(invoice.riskLevel)}
              {invoice.riskDataLimited && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-medium gap-1"
                >
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Data limited
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
              {invoice.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-lg border-slate-200 dark:border-slate-800"
            >
              All Invoices
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 rounded-lg font-medium"
            >
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Update Control Panel */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Manual Status Transition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Allowed manual statuses: <strong>DRAFT</strong>, <strong>SENT</strong>, or <strong>PAID</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Draft button */}
            <Button
              type="button"
              variant={invoice.status === "DRAFT" ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusUpdate("DRAFT")}
              className={`text-xs h-8 rounded-lg font-medium ${
                invoice.status === "DRAFT"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {invoice.status === "DRAFT" && <Check className="h-3 w-3 mr-1" />}
              Set Draft
            </Button>

            {/* Sent button */}
            <Button
              type="button"
              variant={invoice.status === "SENT" ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusUpdate("SENT")}
              className={`text-xs h-8 rounded-lg font-medium ${
                invoice.status === "SENT"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {invoice.status === "SENT" && <Check className="h-3 w-3 mr-1" />}
              Set Sent
            </Button>

            {/* Paid button */}
            <Button
              type="button"
              variant={invoice.status === "PAID" ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleStatusUpdate("PAID")}
              className={`text-xs h-8 rounded-lg font-medium ${
                invoice.status === "PAID"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {invoice.status === "PAID" && <Check className="h-3 w-3 mr-1" />}
              Mark as Paid
            </Button>

            {isPending && <Loader2 className="h-4 w-4 animate-spin text-indigo-600 ml-1" />}
          </div>
        </div>

        {/* Informative Note regarding Overdue Derivation */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            <strong>Note on Overdue status:</strong> OVERDUE cannot be set manually. It is automatically derived at read time whenever an invoice is in <strong>SENT</strong> status and its due date has passed.
          </span>
        </div>
      </Card>

      {/* PayPal Sandbox Integration Panel */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-xs">
                PP
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                PayPal Sandbox Invoicing
              </h3>
              <Badge variant="outline" className="text-[10px] font-medium">
                Sandbox Mode
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {invoice.paypalInvoiceId ? (
                <>
                  Synced with PayPal Invoicing API. PayPal Invoice ID:{" "}
                  <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-200">{invoice.paypalInvoiceId}</strong>
                </>
              ) : (
                "Create a draft and send this invoice directly through the PayPal Sandbox Invoicing API."
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* "Send via PayPal" button */}
            {invoice.status === "DRAFT" && !invoice.paypalInvoiceId && (
              <Button
                type="button"
                size="sm"
                disabled={isPayPalPending || isPending}
                onClick={handleSendViaPayPal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg font-medium gap-1.5 shadow-xs"
              >
                {isPayPalPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Sending via PayPal...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send via PayPal
                  </>
                )}
              </Button>
            )}

            {/* "Payment link" button and copy field */}
            {invoice.paypalPaymentUrl && (
              <div className="flex items-center gap-2">
                <a
                  href={invoice.paypalPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 rounded-lg font-medium border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Payment Link
                  </Button>
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPaymentUrl}
                  className="text-xs h-9 rounded-lg font-medium border-slate-200 dark:border-slate-800 gap-1.5"
                >
                  {copiedPaymentUrl ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Copyable Payment URL Field */}
        {invoice.paypalPaymentUrl && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
              Buyer Sandbox URL:
            </span>
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300 overflow-hidden">
              <span className="truncate select-all">{invoice.paypalPaymentUrl}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Invoice Summary & AI Panels */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 space-y-5">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Total Invoice Amount
                </span>
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-1">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Stored as amountMinor: <strong className="font-mono tabular-nums text-slate-700 dark:text-slate-300">{invoice.amountMinor}</strong> ({invoice.currency})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                  Current Status
                </span>
                <div className="mt-1">{getStatusBadge(derivedStatus)}</div>
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block uppercase">
                  Issue Date
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block uppercase">
                  Due Date
                </span>
                <p className={`font-semibold font-mono tabular-nums mt-0.5 ${derivedStatus === "OVERDUE" ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                  {formatDate(invoice.dueDate)}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block uppercase">
                  Payment Date
                </span>
                <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
                  {invoice.paidAt ? formatDate(invoice.paidAt) : <span className="text-slate-400 font-normal">Unpaid</span>}
                </p>
              </div>
            </div>

            {/* Notes / Instructions */}
            {invoice.notes && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes & Wire Instructions
                </span>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                  {invoice.notes}
                </div>
              </div>
            )}
          </Card>

          {/* AI Invoice Risk Assessment Card */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    AI Risk Assessment
                  </h3>
                  {invoice.riskLevel && getRiskBadge(invoice.riskLevel)}
                  {invoice.riskDataLimited && (
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-medium gap-1"
                    >
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Data limited
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assesses delinquency risk and suggests optimal collection strategy using Gemini AI.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {invoice.status === "PAID" || invoice.status === "CANCELLED" ? (
                  <Badge variant="outline" className="text-xs text-slate-400 border-slate-200 dark:border-slate-800">
                    Analysis disabled for {invoice.status.toLowerCase()} invoices
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAnalyzing || isPending}
                    onClick={() => handleAnalyzeRisk(Boolean(invoice.riskAnalyzedAt))}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg font-medium gap-1.5 shadow-xs"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : invoice.riskAnalyzedAt ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-analyze with AI
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Error State with Retry Button */}
            {analyzeError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3.5 text-xs text-rose-800 dark:text-rose-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Analysis Failed</p>
                    <p className="mt-0.5 text-rose-700 dark:text-rose-400">{analyzeError}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAnalyzeRisk(true)}
                  className="text-xs h-7 px-2.5 rounded-lg border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-800 dark:text-rose-200 shrink-0"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Content: Analyzed vs Unanalyzed */}
            {invoice.riskScore !== undefined && invoice.riskScore !== null ? (
              <div className="space-y-4">
                {/* Score & Tone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Score Meter */}
                  <div className="sm:col-span-2 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Risk Score
                      </span>
                      <span className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-slate-100">
                        {invoice.riskScore} <span className="text-slate-400 font-normal text-xs">/ 100</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          invoice.riskScore < 35
                            ? "bg-emerald-500"
                            : invoice.riskScore < 70
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, invoice.riskScore))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                      <span>0 (Low Risk)</span>
                      <span>35</span>
                      <span>70</span>
                      <span>100 (High Risk)</span>
                    </div>
                  </div>

                  {/* Recommended Tone */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Recommended Tone
                    </span>
                    <div className="my-1">
                      {getReminderToneBadge(invoice.reminderTone)}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Communication style
                    </span>
                  </div>
                </div>

                {/* AI Reason Callout */}
                {invoice.riskReason && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      Analysis Rationale
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {invoice.riskReason}
                    </p>
                  </div>
                )}

                {/* Recommended Action */}
                {invoice.recommendedAction && (
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Recommended Action
                    </span>
                    <p className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                      {invoice.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      Last analyzed:{" "}
                      <strong className="text-slate-700 dark:text-slate-300 font-mono tabular-nums font-normal">
                        {invoice.riskAnalyzedAt ? new Date(invoice.riskAnalyzedAt).toLocaleString() : "Recently"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 italic">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>* AI estimate, not a guarantee.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Invoice Not Analyzed
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                    Click <strong>Analyze with AI</strong> to compute collection risk, evaluate past payment signals, and receive an automated reminder strategy recommendation.
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  * AI estimate, not a guarantee.
                </div>
              </div>
            )}
          </Card>

          {/* AI Payment Reminder Copilot & History Panel */}
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6 space-y-5">
            {/* Header: Title + Safety Label */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    <Bell className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Payment Reminder Workflow
                  </h3>
                  {activeReminder && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-normal">Active:</span>
                      {getReminderStatusBadge(activeReminder.status)}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-assisted payment nudge sequence integrated with PayPal Invoicing API.
                </p>
              </div>

              {/* Prominent Safety Label */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium shrink-0">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>AI actions require freelancer approval</span>
              </div>
            </div>

            {/* Error Banner */}
            {reminderError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3.5 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Reminder Action Failed</p>
                  <p className="mt-0.5 text-rose-700 dark:text-rose-400">{reminderError}</p>
                </div>
              </div>
            )}

            {/* AI Recommendation Context */}
            {invoice.recommendedAction && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    AI Collection Recommendation
                  </span>
                  {invoice.reminderTone && (
                    <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider bg-white dark:bg-slate-900">
                      Tone: {invoice.reminderTone}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-900 dark:text-slate-100 font-medium">
                  {invoice.recommendedAction}
                </p>
              </div>
            )}

            {/* Eligibility Check Callout */}
            {!eligibility.eligible ? (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                  <Info className="h-4 w-4 text-slate-400" />
                  <span>Automated Reminders Not Active for this Invoice</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  {eligibility.reason}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Send Limit Info / Warnings */}
                {!eligibility.canSend && eligibility.sendBlockReason && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{eligibility.sendBlockReason}</span>
                  </div>
                )}

                {/* If No Active Reminder Exists */}
                {!activeReminder ? (
                  <div className="p-5 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-3">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Ready to Generate AI Payment Reminder
                      </h4>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                        Generate a professional, tone-aligned payment reminder draft with PayPal payment link included. Freelancer approval is required before any message is sent.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isGeneratingReminder}
                      onClick={handleGenerateReminder}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg font-medium gap-1.5 shadow-xs"
                    >
                      {isGeneratingReminder ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generating Draft...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate Draft with AI
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Active Reminder Editor Form */
                  <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Active Reminder Draft
                        </span>
                        {getReminderStatusBadge(activeReminder.status)}
                      </div>

                      {activeReminder.status === "APPROVED" && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCheck className="h-3.5 w-3.5" />
                          Approved (Editing subject/body resets status to Draft)
                        </span>
                      )}

                      {activeReminder.status === "SCHEDULED" && activeReminder.scheduledFor && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono tabular-nums font-medium flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Scheduled for {new Date(activeReminder.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Subject Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={reminderSubject}
                        onChange={(e) => setReminderSubject(e.target.value)}
                        placeholder="Payment Reminder Subject..."
                        className="w-full text-xs font-medium h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      />
                    </div>

                    {/* Message Body Textarea */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Reminder Note / Body
                        </label>
                        <span className="text-[10px] text-slate-400">
                          PayPal Sandbox payment link is included
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={reminderBody}
                        onChange={(e) => setReminderBody(e.target.value)}
                        placeholder="Draft reminder note..."
                        className="w-full text-xs font-normal p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 leading-relaxed font-mono resize-none"
                      />
                    </div>

                    {/* Inline Schedule Date/Time Picker */}
                    {showScheduleInput && (
                      <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 animate-in fade-in duration-200">
                        <label className="text-xs font-medium text-amber-900 dark:text-amber-200 block">
                          Pick Date & Time for Scheduled Dispatch:
                        </label>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="datetime-local"
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            className="text-xs h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono tabular-nums"
                          />
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isSchedulingReminder || !scheduledDateTime}
                              onClick={handleScheduleReminder}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 px-3 rounded-lg font-medium"
                            >
                              {isSchedulingReminder ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Confirm Schedule"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowScheduleInput(false)}
                              className="text-xs h-9 px-2.5 rounded-lg border-slate-200 dark:border-slate-700"
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions Bar: Save, Approve, Schedule, Send Now, Cancel */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Save Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSavingReminder || isSendingReminder}
                          onClick={handleSaveReminder}
                          className="text-xs h-8 px-3 rounded-lg font-medium border-slate-200 dark:border-slate-700 gap-1.5"
                        >
                          {isSavingReminder ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save
                        </Button>

                        {/* Approve Button */}
                        <Button
                          type="button"
                          variant={activeReminder.status === "APPROVED" ? "secondary" : "default"}
                          size="sm"
                          disabled={activeReminder.status === "APPROVED" || isApprovingReminder || isSendingReminder}
                          onClick={handleApproveReminder}
                          className={`text-xs h-8 px-3 rounded-lg font-medium gap-1.5 ${
                            activeReminder.status === "APPROVED"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isApprovingReminder ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCheck className="h-3.5 w-3.5" />
                          )}
                          {activeReminder.status === "APPROVED" ? "Approved ✓" : "Approve"}
                        </Button>

                        {/* Schedule Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSendingReminder}
                          onClick={() => setShowScheduleInput(!showScheduleInput)}
                          className="text-xs h-8 px-3 rounded-lg font-medium border-slate-200 dark:border-slate-700 gap-1.5"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Schedule
                        </Button>

                        {/* Send Now */}
                        <div className="relative inline-block">
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              activeReminder.status !== "APPROVED" ||
                              isSendingReminder ||
                              !eligibility.canSend
                            }
                            onClick={handleSendReminderNow}
                            className={`text-xs h-8 px-3.5 rounded-lg font-medium gap-1.5 shadow-xs transition-colors ${
                              activeReminder.status === "APPROVED" && eligibility.canSend
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {isSendingReminder ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Sending via PayPal...
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                Send now
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Cancel Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isCancellingReminder || isSendingReminder}
                          onClick={handleCancelReminder}
                          className="text-xs h-8 px-2.5 rounded-lg text-slate-500 hover:text-rose-600 gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>

                      {/* Regenerate with AI Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isGeneratingReminder || isSendingReminder}
                        onClick={handleGenerateReminder}
                        className="text-[11px] h-8 px-2.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Regenerate Draft
                      </Button>
                    </div>

                    {activeReminder.status !== "APPROVED" && (
                      <p className="text-[11px] text-slate-400 italic">
                        * &ldquo;Send now&rdquo; is disabled until draft is approved by the freelancer.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reminder History List */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Reminder History ({reminders.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {eligibility.sentRemindersCount}/3 sent reminders used
                </span>
              </div>

              {reminders.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/30 text-center text-xs text-slate-400">
                  No reminders created yet for this invoice.
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          {getReminderStatusBadge(rem.status)}
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {rem.subject}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {rem.channel || "PAYPAL_REMINDER"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
                        {rem.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono tabular-nums">
                        {rem.createdAt && (
                          <span>Created: {new Date(rem.createdAt).toLocaleDateString()}</span>
                        )}
                        {rem.approvedAt && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            Approved: {new Date(rem.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {rem.scheduledFor && rem.status === "SCHEDULED" && (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Scheduled: {new Date(rem.scheduledFor).toLocaleString()}
                          </span>
                        )}
                        {rem.sentAt && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Dispatched: {new Date(rem.sentAt).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {rem.sendError && (
                        <div className="rounded-md bg-rose-50 dark:bg-rose-950/40 p-2 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>Error: {rem.sendError}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Client Profile Card */}
        <div className="space-y-6">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 space-y-4">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Client Contact
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                {invoice.clientName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {invoice.clientCompany}
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{invoice.clientEmail}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{invoice.clientCompany}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400">Risk Assessment:</span>
                <Badge
                  variant={invoice.clientRisk === "HIGH" ? "destructive" : invoice.clientRisk === "MEDIUM" ? "warning" : "success"}
                  className="text-[10px] font-medium"
                >
                  {invoice.clientRisk || "LOW"} Risk
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Link href={`/clients`} className="block w-full">
                <Button variant="outline" size="sm" className="w-full text-xs h-8 rounded-lg border-slate-200 dark:border-slate-800">
                  View in Directory
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
