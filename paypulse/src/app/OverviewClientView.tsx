"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { OverviewCards } from "@/components/dashboard/OverviewCards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  getDashboardMetrics,
  getInvoices,
  updateInvoiceStatus,
  getDerivedStatus,
  InvoiceItem,
  ClientItem,
} from "@/lib/data-store";
import { cn, formatCurrency, formatDate, getDaysRemaining } from "@/lib/utils";

export function OverviewClientView({
  initialMetrics,
  initialInvoices,
  initialClients,
}: {
  initialMetrics: ReturnType<typeof getDashboardMetrics>;
  initialInvoices: InvoiceItem[];
  initialClients: ClientItem[];
}) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);
  const [clients] = useState<ClientItem[]>(initialClients);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleMarkAsPaid = (invoiceId: string, invoiceNumber: string) => {
    updateInvoiceStatus(invoiceId, "PAID");
    setInvoices([...getInvoices()]);
    setMetrics(getDashboardMetrics());
    setActionMessage(`Invoice #${invoiceNumber} marked as Paid!`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleSendReminder = (invoiceNumber: string, clientName: string) => {
    setActionMessage(`Reminder sent to ${clientName} for invoice #${invoiceNumber}`);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "SENT":
        return <Badge variant="default" className="bg-indigo-600 text-white">Sent</Badge>;
      case "DRAFT":
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Overview
            </h1>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Optimal Health
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <strong className="font-semibold text-slate-900 dark:text-slate-100">Alex</strong>. You have{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">{metrics.upcomingDue.count} invoices due this week</span>{" "}
            and{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums">{formatCurrency(metrics.highRisk.amount)} at high risk</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/reminders">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
              Automated Reminders
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cashflow & Risk Pulse
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">Auto-updated today</span>
        </div>
        <OverviewCards metrics={metrics} />
      </div>

      {/* Middle Grid: Cashflow Chart + Client Risk Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow & Collections Visualization */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Monthly Payment Pulse & Recovery
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold gap-1">
                  <TrendingUp className="h-3 w-3" />
                  90.8% Avg Recovery
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of invoiced amount vs. recovered revenue over the past 6 months
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium self-end sm:self-auto">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-indigo-600 dark:bg-indigo-500" />
                Invoiced
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                Recovered
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-5 flex flex-col justify-between flex-1">
            <div className="w-full">
              {/* Y-Axis + Plot Area */}
              <div className="flex gap-2 sm:gap-3">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between h-60 pb-8 text-[10px] font-mono text-slate-400 dark:text-slate-500 text-right w-10 shrink-0 select-none">
                  <span>$10k</span>
                  <span>$7.5k</span>
                  <span>$5.0k</span>
                  <span>$2.5k</span>
                  <span>$0</span>
                </div>

                {/* Plot Area with Gridlines and Bars */}
                <div className="relative flex-1 h-60">
                  {/* Gridlines */}
                  <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                    <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-dashed border-slate-100 dark:border-slate-800 w-full" />
                    <div className="border-b border-slate-200 dark:border-slate-700 w-full" />
                  </div>

                  {/* Columns Grid */}
                  <div className="relative z-10 h-full flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-2">
                    {[
                      { month: "May", invoiced: 65, recovered: 55, invVal: "$6,500", recVal: "$5,500", rate: "85%" },
                      { month: "Jun", invoiced: 80, recovered: 70, invVal: "$8,000", recVal: "$7,000", rate: "88%" },
                      { month: "Jul", invoiced: 45, recovered: 45, invVal: "$4,500", recVal: "$4,500", rate: "100%" },
                      { month: "Aug", invoiced: 90, recovered: 82, invVal: "$9,000", recVal: "$8,200", rate: "91%" },
                      { month: "Sep", invoiced: 75, recovered: 68, invVal: "$7,500", recVal: "$6,800", rate: "91%" },
                      { month: "Oct (MTD)", invoiced: 95, recovered: 88, invVal: "$9,500", recVal: "$8,850", rate: "93%", isCurrent: true },
                    ].map((item) => (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer max-w-[120px] mx-auto"
                      >
                        {/* Tooltip Card on Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none absolute -top-9 z-30 bg-slate-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-md whitespace-nowrap flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{item.month}:</span>
                          <span className="text-indigo-400 font-mono font-medium">{item.invVal}</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-emerald-400 font-mono font-medium">{item.recVal}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                            {item.rate}
                          </span>
                        </div>

                        {/* Bar Group Container with subtle column hover */}
                        <div className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 h-52 pb-0 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 rounded-t-lg transition-colors px-1 sm:px-1.5">
                          {/* Invoiced Bar Slot with Background Track */}
                          <div className="relative flex-1 max-w-[28px] sm:max-w-[36px] md:max-w-[42px] h-full flex items-end bg-slate-100 dark:bg-slate-800 rounded-t-sm overflow-hidden">
                            <div
                              style={{ height: `${item.invoiced}%` }}
                              className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-sm transition-all group-hover:brightness-110"
                              title={`Invoiced: ${item.invVal}`}
                            />
                          </div>

                          {/* Recovered Bar Slot with Background Track */}
                          <div className="relative flex-1 max-w-[28px] sm:max-w-[36px] md:max-w-[42px] h-full flex items-end bg-slate-100 dark:bg-slate-800 rounded-t-sm overflow-hidden">
                            <div
                              style={{ height: `${item.recovered}%` }}
                              className="w-full bg-emerald-600 dark:bg-emerald-500 rounded-t-sm transition-all group-hover:brightness-110"
                              title={`Recovered: ${item.recVal} (${item.rate})`}
                            />
                          </div>
                        </div>

                        {/* Month Label & Recovery % below baseline */}
                        <div className="h-8 flex flex-col items-center justify-center w-full pt-1">
                          <span
                            className={cn(
                              "text-[11px] truncate leading-none",
                              item.isCurrent
                                ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 font-medium"
                            )}
                          >
                            {item.month}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.rate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 6-Month Cashflow Summary KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    6-Mo Invoiced
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
                    $45,000.00
                  </p>
                </div>
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  6 Invoices
                </span>
              </div>

              <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    6-Mo Recovered
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
                    $40,850.00
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  90.8% Collected
                </span>
              </div>

              <div className="rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Unsettled Gap
                  </p>
                  <p className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 font-mono tabular-nums mt-0.5">
                    $4,150.00
                  </p>
                </div>
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  9.2% Gap
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Risk Radar */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                Client Risk Radar
              </CardTitle>
              <Link href="/clients" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                All Clients
              </Link>
            </div>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Clients flagged for payment delays or high risk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {clients
              .filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "MEDIUM")
              .map((client) => {
                const isHighRisk = client.riskLevel === "HIGH";

                return (
                  <div
                    key={client.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{client.company}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{client.name}</p>
                      </div>
                      <Badge
                        variant={isHighRisk ? "destructive" : "warning"}
                        className="text-[10px] px-2 py-0.5 font-medium"
                      >
                        {client.riskLevel} Risk
                      </Badge>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                      <span>
                        Avg: <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{client.avgPaymentDays}d</strong> to pay
                      </span>
                      <span>
                        Outstanding:{" "}
                        <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums font-semibold">
                          {formatCurrency(client.totalOutstanding)}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 mt-4 text-xs">
              <p className="font-medium flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Auto-Protection Active
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                PayPulse automatically schedules progressive reminders for high-risk clients 48h before due date.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Invoices Table */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recent Invoices
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Latest billing activities and instant actions
              </CardDescription>
            </div>
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="text-xs h-8 rounded-lg gap-1 border-slate-200 dark:border-slate-700">
                View all ({invoices.length})
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Invoice</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.slice(0, 6).map((inv) => {
                    const daysLeft = getDaysRemaining(inv.dueDate);
                    const derived = getDerivedStatus(inv);
                    const isOverdue = derived === "OVERDUE";

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 dark:text-slate-100">
                          <Link href={`/invoices/${inv.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-mono tabular-nums font-semibold">
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate max-w-[180px]">
                            {inv.title}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{inv.clientCompany}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{inv.clientName}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-700 dark:text-slate-300 font-mono tabular-nums">{formatDate(inv.dueDate)}</p>
                          {derived !== "PAID" && (
                            <p
                              className={`text-[10px] font-medium ${
                                isOverdue ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `In ${daysLeft} days`}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                          {formatCurrency(inv.amount, inv.currency)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(derived)}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {derived !== "PAID" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendReminder(inv.invoiceNumber, inv.clientName)}
                                  className="h-8 px-2.5 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                  title="Send instant reminder"
                                >
                                  <Send className="h-3 w-3 mr-1" />
                                  Nudge
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(inv.id, inv.invoiceNumber)}
                                  className="h-8 px-2.5 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border-slate-200 dark:border-slate-700"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                  Paid
                                </Button>
                              </>
                            ) : (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Settled
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
