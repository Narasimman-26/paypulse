"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateNextInvoiceNumber, ClientItem } from "@/lib/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createInvoiceAction } from "@/app/actions/invoices";

export function NewInvoiceClientView({ initialClients }: { initialClients: ClientItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId");

  const clients = initialClients;

  // Auto-generate invoice number
  const autoInvoiceNumber = useMemo(() => generateNextInvoiceNumber(), []);

  // Form State
  const [title, setTitle] = useState("Website UI & Full-Stack Implementation");
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (preselectedClientId && clients.some((c) => c.id === preselectedClientId)) {
      return preselectedClientId;
    }
    return clients[0]?.id || "";
  });
  const [amountStr, setAmountStr] = useState("2500");
  const [currency, setCurrency] = useState<"USD" | "INR" | "EUR">("USD");

  const defaultDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  }, []);

  const [dueDate, setDueDate] = useState<string>(defaultDueDate);
  const [notes, setNotes] = useState(
    "Payment is due within payment terms. Please include the invoice number in the transfer description."
  );

  const [formErrors, setFormErrors] = useState<{
    title?: string[];
    amount?: string[];
    currency?: string[];
    dueDate?: string[];
    clientId?: string[];
    general?: string;
  }>({});

  const [isPending, startTransition] = useTransition();

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const parsedAmount = parseFloat(amountStr) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    startTransition(async () => {
      const result = await createInvoiceAction({
        title,
        amount: parsedAmount,
        currency,
        dueDate,
        clientId: selectedClientId,
        notes,
      });

      if (!result.success) {
        setFormErrors(result.errors || { general: "Failed to create invoice" });
      } else {
        router.push("/invoices");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Create New Invoice
              </h1>
              <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                {autoInvoiceNumber}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Default: DRAFT
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify invoice details, major unit amount, currency, and client destination.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/invoices">
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="text-xs h-9 rounded-lg border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="create-invoice-form"
            disabled={isPending || clients.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg font-medium shadow-xs gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving Invoice...
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5" />
                Save as Draft
              </>
            )}
          </Button>
        </div>
      </div>

      {formErrors.general && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formErrors.general}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Invoice Information</span>
                <span className="text-xs font-normal text-slate-500 font-mono tabular-nums">Auto-number: {autoInvoiceNumber}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <form id="create-invoice-form" onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-title" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Invoice Title <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="invoice-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Brand Identity & Design System"
                    disabled={isPending}
                    className={formErrors.title ? "border-rose-500" : ""}
                  />
                  {formErrors.title && (
                    <p className="text-[11px] text-rose-500 font-medium">{formErrors.title[0]}</p>
                  )}
                </div>

                {/* 2. Client Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="client-select" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Select Client <span className="text-rose-500">*</span>
                    </Label>
                    <Link href="/clients" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                      + Add New Client
                    </Link>
                  </div>
                  <select
                    id="client-select"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    disabled={isPending || clients.length === 0}
                    className={`w-full h-9 rounded-lg border bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                      formErrors.clientId ? "border-rose-500" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company}) - {c.email}
                      </option>
                    ))}
                  </select>
                  {formErrors.clientId && (
                    <p className="text-[11px] text-rose-500 font-medium">{formErrors.clientId[0]}</p>
                  )}
                </div>

                {/* 3. Amount & Currency Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Amount in Major Units */}
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-amount" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Amount (Major Units) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        {currency === "USD" ? "$" : currency === "INR" ? "₹" : "€"}
                      </span>
                      <Input
                        id="invoice-amount"
                        type="number"
                        step="any"
                        min="0.01"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        placeholder="2500.00"
                        disabled={isPending}
                        className={`pl-8 font-mono tabular-nums ${formErrors.amount ? "border-rose-500" : ""}`}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Stored internally as amountMinor: <strong className="font-mono tabular-nums text-slate-600 dark:text-slate-300">{Math.round((parsedAmount || 0) * 100)}</strong>
                    </p>
                    {formErrors.amount && (
                      <p className="text-[11px] text-rose-500 font-medium">{formErrors.amount[0]}</p>
                    )}
                  </div>

                  {/* Currency Dropdown (USD / INR / EUR) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="invoice-currency" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Currency <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="invoice-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as "USD" | "INR" | "EUR")}
                      disabled={isPending}
                      className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                      <option value="EUR">EUR (€) - Euro</option>
                    </select>
                    {formErrors.currency && (
                      <p className="text-[11px] text-rose-500 font-medium">{formErrors.currency[0]}</p>
                    )}
                  </div>
                </div>

                {/* 4. Due Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-due-date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Due Date <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="invoice-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={isPending}
                      className={`font-mono tabular-nums ${formErrors.dueDate ? "border-rose-500" : ""}`}
                    />
                  </div>
                  {formErrors.dueDate && (
                    <p className="text-[11px] text-rose-500 font-medium">{formErrors.dueDate[0]}</p>
                  )}
                </div>

                {/* 5. Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-notes" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Payment Instructions & Notes
                  </Label>
                  <textarea
                    id="invoice-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isPending}
                    placeholder="Enter wire details, payment links, or project notes..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 resize-none"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Live Document Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-1">
              Live Document Preview
            </span>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6 text-slate-900 dark:text-slate-100">
              {/* Invoice Document Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                      PP
                    </div>
                    <span className="font-semibold text-sm tracking-tight">PayPulse Studio</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Alex Morgan - Independent Consultant
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    alex.morgan@freelance.design
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400 block">
                    {autoInvoiceNumber}
                  </span>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    DRAFT
                  </Badge>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Billed To:
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedClient?.company || "Client Company"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {selectedClient?.name || "Client Name"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {selectedClient?.email || "email@client.com"}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Issue Date:
                    </span>
                    <span className="font-medium font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      {formatDate(new Date())}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Due Date:
                    </span>
                    <span className="font-semibold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                      {dueDate ? formatDate(dueDate) : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Item Summary */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5">
                  <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                    {title || "Untitled Invoice"}
                  </span>
                  <span className="font-mono tabular-nums font-bold">
                    {formatCurrency(parsedAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                    Total Due
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Currency: {currency}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatCurrency(parsedAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 text-[11px] text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Instructions:</strong>
                  {notes}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
