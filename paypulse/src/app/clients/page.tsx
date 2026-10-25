import React, { Suspense } from "react";
import { getClients } from "@/lib/data-store";
import { ClientsClientView } from "./ClientsClientView";

export default function ClientsPage() {
  const clients = getClients();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            <p className="text-xs text-slate-500">Loading clients roster...</p>
          </div>
        </div>
      }
    >
      <ClientsClientView initialClients={clients} />
    </Suspense>
  );
}
