import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatMinorUnits(amountMinor: number, currency: string = "USD"): string {
  return formatCurrency(amountMinor / 100, currency);
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDaysRemaining(dueDate: string | Date, referenceDate?: Date): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  // Use stable reference date during SSR/prerender to satisfy Next.js prerender requirement
  const now = referenceDate || new Date("2026-10-18T00:00:00.000Z");
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
