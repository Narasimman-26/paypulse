"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface MetricData {
  outstanding: {
    amount: number;
    count: number;
    changePercent: string;
  };
  highRisk: {
    amount: number;
    count: number;
    warningCount: number;
  };
  recovered: {
    amount: number;
    byCurrency?: Record<string, { amount: number; count: number; currency: string }>;
    count: number;
    label?: string;
    changePercent?: string;
  };
  upcomingDue: {
    amount: number;
    count: number;
    daysWindow: number;
  };
}

export function OverviewCards({ metrics }: { metrics: MetricData }) {
  const currencyList = metrics.recovered.byCurrency
    ? Object.values(metrics.recovered.byCurrency).filter((c) => c.count > 0)
    : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. OUTSTANDING CARD */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(metrics.outstanding.amount)}
            </h3>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <Badge variant="secondary" className="font-medium text-[11px] px-2 py-0.25 tabular-nums">
                {metrics.outstanding.count} invoices
              </Badge>
              <span className="text-slate-500 dark:text-slate-400">unpaid total</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{metrics.outstanding.changePercent} this month</span>
            <Link
              href="/invoices?status=outstanding"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 2. HIGH RISK CARD */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              High Risk Volume
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(metrics.highRisk.amount)}
            </h3>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <Badge variant="destructive" className="font-medium text-[11px] px-2 py-0.25 tabular-nums">
                {metrics.highRisk.count} at-risk
              </Badge>
              <span className="text-slate-500 dark:text-slate-400">needs attention</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{metrics.highRisk.warningCount} overdue &gt; 10 days</span>
            <Link
              href="/invoices?status=high_risk"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              Resolve
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 3. RECOVERED CARD */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Paid after reminder
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1">
            {currencyList.length > 0 ? (
              <div className="space-y-1">
                {currencyList.map(({ currency, amount }) => (
                  <h3
                    key={currency}
                    className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums"
                  >
                    {formatCurrency(amount, currency)}
                  </h3>
                ))}
              </div>
            ) : (
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {formatCurrency(0, "USD")}
              </h3>
            )}
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <Badge variant="success" className="font-medium text-[11px] px-2 py-0.25 tabular-nums">
                {metrics.recovered.count} {metrics.recovered.count === 1 ? "invoice" : "invoices"}
              </Badge>
              <span className="text-slate-500 dark:text-slate-400">Paid after reminder</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Recovered post-reminder</span>
            <Link
              href="/invoices?status=paid"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              History
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 4. UPCOMING DUE CARD */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming Due (7d)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatCurrency(metrics.upcomingDue.amount)}
            </h3>
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <Badge variant="warning" className="font-medium text-[11px] px-2 py-0.25 tabular-nums">
                {metrics.upcomingDue.count} invoices
              </Badge>
              <span className="text-slate-500 dark:text-slate-400">due in next 7 days</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Auto-nudges ready</span>
            <Link
              href="/reminders"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline inline-flex items-center gap-0.5"
            >
              Queue
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
