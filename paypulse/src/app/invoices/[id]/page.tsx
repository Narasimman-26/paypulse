import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getInvoice, getRemindersForInvoice } from "@/lib/data-store";
import { InvoiceDetailView } from "./InvoiceDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function InvoiceDetailContent({ params }: PageProps) {
  const { id } = await params;
  const invoice = getInvoice(id);

  if (!invoice) {
    notFound();
  }

  const reminders = getRemindersForInvoice(invoice.id);

  return <InvoiceDetailView initialInvoice={invoice} initialReminders={reminders} />;
}

export default function InvoiceDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            <p className="text-xs text-slate-500">Loading invoice details...</p>
          </div>
        </div>
      }
    >
      <InvoiceDetailContent {...props} />
    </Suspense>
  );
}
