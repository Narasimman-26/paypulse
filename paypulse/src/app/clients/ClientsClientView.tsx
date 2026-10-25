"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Mail,
  Phone,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientItem } from "@/lib/data-store";
import { formatCurrency } from "@/lib/utils";
import { createClientAction } from "@/app/actions/clients";

export function ClientsClientView({ initialClients }: { initialClients: ClientItem[] }) {
  const [clients, setClients] = useState<ClientItem[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string[]; email?: string[]; general?: string }>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    startTransition(async () => {
      const result = await createClientAction({
        name: clientName,
        email: clientEmail,
      });

      if (!result.success) {
        setFormErrors(result.errors || { general: "Failed to create client" });
      } else {
        if (result.client) {
          setClients((prev) => [result.client!, ...prev.filter((c) => c.id !== result.client!.id)]);
        }
        setClientName("");
        setClientEmail("");
        setShowAddModal(false);
        setSuccessToast(result.message || "Client created successfully!");
        setTimeout(() => setSuccessToast(null), 3500);
      }
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Clients & Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your client contacts, validate payment histories, and trigger new invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs text-xs h-9 px-3.5 gap-1.5 font-medium"
          >
            <UserPlus className="h-4 w-4" />
            Add New Client
          </Button>

          <Link href="/invoices/new">
            <Button
              variant="outline"
              className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs h-9 px-3.5 gap-1.5 font-medium rounded-lg"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Create New Client
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add a client with Zod-validated name and email address.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormErrors({});
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formErrors.general && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="client-name" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Client / Contact Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="client-name"
                  placeholder="e.g. Rachel Adams or Apex Studios"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={isPending}
                  className={formErrors.name ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-500 font-medium">{formErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-email" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="rachel@apexstudios.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  disabled={isPending}
                  className={formErrors.email ? "border-rose-500 focus-visible:ring-rose-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-[11px] text-rose-500 font-medium">{formErrors.email[0]}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormErrors({});
                  }}
                  disabled={isPending}
                  className="text-xs h-9 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg font-medium gap-1.5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Client...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Create Client
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, contact, or email..."
            className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Active Client Roster:</span>
          <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">{clients.length} Accounts</strong>
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredClients.length === 0 ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12 rounded-xl shadow-xs">
          <CardContent className="space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No clients found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No clients matched &quot;{searchQuery}&quot;. Try clearing your search or add a new client.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="text-xs rounded-lg"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const isHighRisk = client.riskLevel === "HIGH";
            const isMediumRisk = client.riskLevel === "MEDIUM";

            return (
              <Card
                key={client.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Company Name & Risk Pill */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                        {client.company}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {client.name}
                      </p>
                    </div>
                    <Badge
                      variant={isHighRisk ? "destructive" : isMediumRisk ? "warning" : "success"}
                      className="text-[10px] shrink-0 font-medium px-2 py-0.5"
                    >
                      {client.riskLevel} Risk
                    </Badge>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                        Total Invoiced
                      </span>
                      <p className="font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
                        {formatCurrency(client.totalInvoiced)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">
                        Outstanding
                      </span>
                      <p
                        className={`font-bold font-mono tabular-nums mt-0.5 ${
                          client.totalOutstanding > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatCurrency(client.totalOutstanding)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Velocity */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Avg: <strong className="text-slate-800 dark:text-slate-200 font-mono tabular-nums">{client.avgPaymentDays}d</strong>
                    </span>
                    <span className="text-slate-400 dark:text-slate-500">
                      Net {client.paymentTerms} terms
                    </span>
                  </div>

                  {/* Action button */}
                  <div className="pt-2">
                    <Link href={`/invoices/new?clientId=${client.id}`} className="block w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Create Invoice
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
