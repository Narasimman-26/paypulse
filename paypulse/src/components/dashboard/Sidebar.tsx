"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Bell,
  Settings,
  Zap,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: "/",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: "Invoices",
      href: "/invoices",
      icon: FileText,
      badge: "4",
    },
    {
      label: "Clients",
      href: "/clients",
      icon: Users,
      badge: "5",
    },
    {
      label: "Reminders",
      href: "/reminders",
      icon: Bell,
      badge: "2",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      badge: null,
    },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Brand Header */}
      <div>
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-slate-100">PayPulse</span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">Freelancer Payment Radar</p>
            </div>
          </Link>

          {/* Close button for mobile */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1 px-3 pt-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-normal"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Cashflow health indicator widget */}
        <div className="mx-3 mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 dark:text-slate-400">Recovery Rate</span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold font-mono tabular-nums">92.4%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 w-[92.4%]" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            $18,850 recovered this month with automated gentle nudges.
          </p>
        </div>
      </div>

      {/* User Profile & Logout Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 min-w-0 flex-1"
            title="Alex Morgan (alex.morgan@freelance.design) - View Settings"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800 font-semibold text-white text-xs shrink-0">
              AM
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Alex Morgan</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">alex.morgan@freelance.design</p>
            </div>
          </Link>

          <button
            onClick={() => {
              alert("You have logged out of your PayPulse account.");
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-lg z-50 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
