"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowUpRight,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDerivedStatus, InvoiceItem, ClientItem } from "@/lib/data-store";
import { formatCurrency, formatDate } from "@/lib/utils";

export function InvoicesClientView({
  initialInvoices,
  initialClients,
}: {
  initialInvoices: InvoiceItem[];
  initialClients: ClientItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read URL query params directly (no useEffect setState needed)
  const selectedStatus = searchParams.get("status") || "ALL";
  const selectedClient = searchParams.get("client") || "ALL";
  const urlSearch = searchParams.get("search") || "";

  const [invoices] = useState<InvoiceItem[]>(initialInvoices);
  const [clients] = useState<ClientItem[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState(urlSearch);

  // Update URL query params
  const updateUrlParams = (newStatus: string, newClient: string, newSearch: string) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
    if (newClient && newClient !== "ALL") params.set("client", newClient);
    if (newSearch && newSearch.trim().length > 0) params.set("search", newSearch.trim());

    const queryString = params.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  };

  const handleStatusChange = (status: string) => {
    updateUrlParams(status, selectedClient, searchQuery);
  };

  const handleClientChange = (clientId: string) => {
    updateUrlParams(selectedStatus, clientId, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateUrlParams(selectedStatus, selectedClient, query);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  // Filter invoices with derived status
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const derived = getDerivedStatus(inv);

      // Status filter
      if (selectedStatus !== "ALL") {
        if (derived !== selectedStatus) return false;
      }

      // Client filter
      if (selectedClient !== "ALL") {
        if (inv.clientId !== selectedClient) return false;
      }

      // Text search
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.title.toLowerCase().includes(q) ||
          inv.clientName.toLowerCase().includes(q) ||
          inv.clientCompany.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, selectedStatus, selectedClient, searchQuery]);

  const getStatusBadge = (derivedStatus: string) => {
    switch (derivedStatus) {
      case "PAID":
        return (
          <Badge variant="success" className="gap-1 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge variant="destructive" className="gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      case "SENT":
        return (
          <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 font-medium">
            <Clock className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-700 gap-1 font-medium">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      case "DRAFT":
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-medium">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Invoices & Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter by client or status, and inspect invoice details with real-time derived overdue tracking.
          </p>
        </div>

        <Link href="/invoices/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs text-xs h-9 px-3.5 gap-1.5 font-medium">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by invoice #, title, or client..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue (Derived)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Client Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Client:</span>
              <select
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none max-w-[160px] truncate"
              >
                <option value="ALL">All Clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedStatus !== "ALL" || selectedClient !== "ALL" || searchQuery.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white gap-1 rounded-lg"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Invoice Table */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              No invoices match your criteria
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any invoices matching your active filters or search terms. Try adjusting or clearing your filters.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs rounded-lg"
              >
                Clear All Filters
              </Button>
              <Link href="/invoices/new">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg">
                  Create Invoice
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">AI Risk</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredInvoices.map((inv) => {
                  const derived = getDerivedStatus(inv);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-normal text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                        {inv.title}
                      </td>

                      {/* Client Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {inv.clientName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {inv.clientCompany}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(inv.amount, inv.currency)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        {formatDate(inv.dueDate)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(derived)}
                      </td>

                      {/* AI Risk Badge */}
                      <td className="py-3.5 px-4">
                        {inv.riskLevel === "HIGH" ? (
                          <Badge variant="destructive" className="text-[10px] gap-1 font-medium">
                            High Risk
                          </Badge>
                        ) : inv.riskLevel === "MEDIUM" ? (
                          <Badge variant="warning" className="text-[10px] gap-1 font-medium">
                            Med Risk
                          </Badge>
                        ) : inv.riskLevel === "LOW" ? (
                          <Badge variant="success" className="text-[10px] gap-1 font-medium">
                            Low Risk
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono italic">Unanalyzed</span>
                        )}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          >
                            View
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
