"use client";

import React, { useState } from "react";
import {
  User,
  Building,
  CreditCard,
  Save,
  CheckCircle2,
  Database,
  Sun,
  Moon,
  Laptop,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("Alex Morgan");
  const [email, setEmail] = useState("alex@morganstudios.design");
  const [businessName, setBusinessName] = useState("Morgan Digital & UI Studio");
  const [currency, setCurrency] = useState("USD");
  const [defaultTerms, setDefaultTerms] = useState(30);
  const [autoReminders, setAutoReminders] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Toast Alert */}
      {savedNotice && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure your appearance, freelancer profile, billing defaults, and preferences.
          </p>
        </div>

        <Button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs h-9 px-4 gap-1.5 shadow-xs font-medium"
        >
          <Save className="h-3.5 w-3.5" />
          Save Changes
        </Button>
      </div>

      {/* 1. APPEARANCE & THEME SECTION */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sun className="h-4 w-4 text-slate-400" />
            Appearance & Theme
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Choose between White/Light mode or Dark mode for your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* White / Light Mode Button */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex flex-col items-start p-4 rounded-lg border text-left transition-colors relative ${
                theme === "light"
                  ? "border-indigo-600 bg-slate-50 dark:bg-slate-800/60 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Sun className="h-4 w-4" />
                </div>
                {theme === "light" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">White / Light Mode</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Clean, crisp white cards and light slate background.
              </p>
            </button>

            {/* Dark Mode Button */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-start p-4 rounded-lg border text-left transition-colors relative ${
                theme === "dark"
                  ? "border-indigo-600 bg-slate-50 dark:bg-slate-800/60 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Moon className="h-4 w-4" />
                </div>
                {theme === "dark" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Dark Mode</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sleek dark background with high-contrast elements.
              </p>
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`flex flex-col items-start p-4 rounded-lg border text-left transition-colors relative ${
                theme === "system"
                  ? "border-indigo-600 bg-slate-50 dark:bg-slate-800/60 shadow-xs"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Laptop className="h-4 w-4" />
                </div>
                {theme === "system" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">System Sync</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically matches your device OS setting.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 2. PROFILE & BUSINESS DETAILS */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            Freelancer Identity & Business Information
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            These details appear on your invoices and automated reminder emails.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-xs font-medium">
                Your Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 text-xs h-9 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 text-xs h-9 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="business" className="text-xs font-medium">
                Business / Studio Name
              </Label>
              <Input
                id="business"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1.5 text-xs h-9 rounded-lg"
              />
            </div>
            <div>
              <Label htmlFor="currency" className="text-xs font-medium">
                Default Currency
              </Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. BILLING & TERMS DEFAULTS */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-400" />
            Billing Defaults
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Set default payment terms for newly generated invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="max-w-md">
            <Label htmlFor="terms" className="text-xs font-medium">
              Default Payment Terms
            </Label>
            <select
              id="terms"
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(Number(e.target.value))}
              className="mt-1.5 w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value={15}>Net 15 (Payment due in 15 days)</option>
              <option value={30}>Net 30 (Payment due in 30 days)</option>
              <option value={45}>Net 45 (Payment due in 45 days)</option>
              <option value={0}>Due Immediately Upon Receipt</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Automated Payment Reminders
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically schedule gentle nudges 48h prior to due date.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoReminders}
              onChange={(e) => setAutoReminders(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. PAYMENT GATEWAY & INTEGRATIONS STATUS */}
      <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-slate-400" />
            Payment Integrations & Gateway Status
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Manage your connected payment channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          {/* PayPal Card */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">PayPal Checkout & Invoicing</h4>
                  <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    Integration Pending
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct invoice payment links, instant payout sync, and dispute management.
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" disabled className="text-xs h-8 rounded-lg opacity-70">
              Coming in v2
            </Button>
          </div>

          {/* PostgreSQL Database Status */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">PostgreSQL (Prisma ORM)</h4>
                  <Badge variant="success" className="text-[10px]">
                    Schema Ready
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Configured with Freelancer, Client, Invoice, and Reminder models.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
              DATABASE_URL
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
