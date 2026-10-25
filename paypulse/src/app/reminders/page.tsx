"use client";

import React, { useState } from "react";
import {
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getReminders, ReminderItem } from "@/lib/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "SCHEDULED" | "SENT">("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("GENTLE");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  React.useEffect(() => {
    setReminders(getReminders());
    setMounted(true);
  }, []);

  const filteredReminders = reminders.filter((rem) => {
    if (activeTab === "ALL") return true;
    return rem.status === activeTab;
  });

  const handleTriggerSend = (id: string, clientName: string) => {
    setReminders(
      reminders.map((r) =>
        r.id === id ? { ...r, status: "SENT", sentAt: new Date().toISOString() } : r
      )
    );
    setActionNotice(`Dispatched reminder directly to ${clientName}!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const templates = [
    {
      type: "GENTLE",
      title: "Gentle Pre-Due Nudge",
      timing: "48h before due date",
      subject: "Upcoming Payment Due: Invoice #[InvoiceNumber]",
      message:
        "Hi [ClientName], hope you are doing well! Just a quick heads up that invoice #[InvoiceNumber] for [Amount] is due on [DueDate]. Please let me know if you need any additional tax receipts or wire info.",
    },
    {
      type: "FRIENDLY",
      title: "Friendly Due Date Check-in",
      timing: "Day of due date",
      subject: "Due Today: Invoice #[InvoiceNumber] ([Amount])",
      message:
        "Hi [ClientName], hope your week is off to a great start. Invoice #[InvoiceNumber] is due for payment today. Thank you so much for your partnership!",
    },
    {
      type: "FIRM",
      title: "Firm Overdue Follow-up",
      timing: "7 days past due",
      subject: "Past Due Notice: Invoice #[InvoiceNumber] is 7 days overdue",
      message:
        "Hi [ClientName], our records show that invoice #[InvoiceNumber] for [Amount] was due on [DueDate] and remains unpaid. Please advise on when we can expect settlement or reach out if there are any processing delays.",
    },
    {
      type: "FINAL_NOTICE",
      title: "Escalated Final Notice",
      timing: "15+ days past due",
      subject: "URGENT: Final Notice for Overdue Invoice #[InvoiceNumber]",
      message:
        "Attention [ClientName], invoice #[InvoiceNumber] is now severely overdue. Please remit payment immediately to avoid pause on ongoing deliverables and retainers.",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Automated Reminders & Follow-Ups
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automate payment nudges, escalate overdue accounts, and preserve client goodwill.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs px-2.5 py-0.5 font-medium">
            Auto-Cadence Active
          </Badge>
        </div>
      </div>

      {/* Cadence Timeline Banner */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Smart Follow-Up Cadence Sequence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">STEP 1</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Gentle Nudge</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">2 days before due date</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">STEP 2</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Due Date Check-in</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">On due date morning</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">STEP 3</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Firm Notice</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">7 days past due date</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3">
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">STEP 4</span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">Final Escalation</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">15 days past due date</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Reminders Queue & Template Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reminders Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Reminders Pipeline
              </CardTitle>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {(["ALL", "SCHEDULED", "SENT"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {filteredReminders.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No reminders in this view.
                </div>
              ) : (
                filteredReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">
                          {rem.clientCompany}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          ({rem.invoiceNumber})
                        </span>
                      </div>
                      <Badge
                        variant={rem.status === "SENT" ? "success" : "default"}
                        className="text-[10px] font-medium"
                      >
                        {rem.status}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{rem.subject}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 italic">
                      &quot;{rem.message}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="font-mono tabular-nums">
                        {rem.status === "SENT"
                          ? `Sent on ${rem.sentAt || rem.scheduledFor ? formatDate(rem.sentAt || rem.scheduledFor!) : "N/A"}`
                          : `Scheduled for ${rem.scheduledFor ? formatDate(rem.scheduledFor) : "Pending"}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCurrency(rem.invoiceAmount)}
                        </span>
                        {rem.status !== "SENT" && (
                          <Button
                            size="sm"
                            onClick={() => handleTriggerSend(rem.id, rem.clientName)}
                            className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg gap-1 font-medium"
                          >
                            <Send className="h-3 w-3" />
                            Send Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Template Library (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Reminder Templates
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Pre-calibrated tones for high recovery and zero friction
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.type}
                  onClick={() => setSelectedTemplate(tpl.type)}
                  className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
                    selectedTemplate === tpl.type
                      ? "border-indigo-600 bg-slate-50 dark:bg-slate-800/60 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{tpl.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{tpl.timing}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1">{tpl.subject}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{tpl.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
