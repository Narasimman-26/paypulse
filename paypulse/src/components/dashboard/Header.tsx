"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Plus,
  LogOut,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  Settings,
  FileText,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [logoutNotice, setLogoutNotice] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const freelancer = {
    name: "Alex Morgan",
    email: "alex.morgan@freelance.design",
    role: "Senior Product Designer & Consultant",
    tier: "Pro Freelancer",
    id: "PP-8824-AM",
    joined: "Jan 2024",
  };

  const handleLogout = () => {
    setAccountOpen(false);
    setLogoutNotice(true);
    setTimeout(() => {
      setLogoutNotice(false);
    }, 3000);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(freelancer.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      {logoutNotice && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-slate-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>You have been logged out securely. (Session reset)</span>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 transition-colors">
        {/* Left side: Hamburger button + Search */}
        <div className="flex items-center gap-3 lg:gap-4 flex-1 max-w-lg">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search invoices, clients, or amounts (Ctrl+K)..."
              className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors"
            />
          </div>
        </div>

        {/* Right side: Currency, ThemeToggle, Notifications, Primary New Invoice CTA, Account Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Pill */}
          <div className="hidden sm:flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
            USD ($)
          </div>

          {/* Theme Toggle (Dark / White mode) */}
          <ThemeToggle />

          {/* Notifications */}
          <Link
            href="/reminders"
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </Link>

          {/* Primary "New invoice" button */}
          <Link href="/invoices/new">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs text-xs font-medium gap-1.5 h-9 px-3.5"
            >
              <Plus className="h-4 w-4" />
              <span>New invoice</span>
            </Button>
          </Link>

          {/* User profile avatar with Account Details Dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-lg hover:ring-2 hover:ring-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Click to view Account & Email"
              aria-label="Account details: Alex Morgan"
              aria-expanded={accountOpen}
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold">
                AM
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
            </button>

            {/* Account Details Popover */}
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Profile Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 font-semibold text-white text-sm">
                    AM
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {freelancer.name}
                      </h3>
                      <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        <ShieldCheck className="h-3 w-3 mr-0.5" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {freelancer.role}
                    </p>
                  </div>
                </div>

                {/* Email Info Card with Copy Button */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Mail className="h-3 w-3 text-indigo-500" />
                      Email Address
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs font-mono font-medium text-slate-900 dark:text-slate-100 select-all break-all">
                    {freelancer.email}
                  </div>
                </div>

                {/* Account Metadata / Plan */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Current Plan</span>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {freelancer.tier}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Account ID</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {freelancer.id}
                    </span>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                  <Link
                    href="/invoices"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>My Invoices</span>
                  </Link>
                  <Link
                    href="/clients"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Client Directory</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    <span>Settings & Profile</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
