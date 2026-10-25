# PayPulse ⚡ — Freelancer Payment & Invoicing Dashboard

**PayPulse** is a modern freelancer payment radar and cashflow intelligence dashboard built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui components, and Prisma ORM with PostgreSQL.

---

## 🚀 Features

- **Sidebar Navigation**:
  - **Overview**: Instant health radar with Outstanding, High Risk, Recovered, and Upcoming Due metrics.
  - **Invoices**: Searchable, filterable invoice list with status updates and quick actions.
  - **Clients**: Client directory with automated risk assessment and payment velocity tracking.
  - **Reminders**: Multi-step automated follow-up cadence (Gentle Nudge, Due Date Check-in, Firm Notice, Final Notice).
  - **Settings**: Freelancer profile, billing defaults, and payment gateway status.
- **Core Overview Cards**:
  - **Outstanding Balance**: Total pending receivables across clients.
  - **High Risk**: Exposure from slow-paying or overdue clients requiring proactive attention.
  - **Recovered Revenue**: Successfully collected funds and month-over-month recovery pulse.
  - **Upcoming Due**: Invoices due in the next 7 days for automated follow-up.
- **Invoice Creation Flow**:
  - Dynamic line items manager with real-time tax and subtotal computation.
  - Split-screen live invoice document preview with client details and payment terms.
  - Direct status updates (Mark as Paid, Send Nudge).
- **Prisma Schema (PostgreSQL)**:
  - `Freelancer`: Profile, billing configuration, client/invoice relations.
  - `Client`: Contact info, payment terms, risk score (`LOW`, `MEDIUM`, `HIGH`).
  - `Invoice`: Invoice number, line items, status (`DRAFT`, `PENDING`, `PAID`, `OVERDUE`, `HIGH_RISK`), due dates.
  - `Reminder`: Follow-up sequence types, status (`SCHEDULED`, `SENT`, `DISMISSED`), scheduled dispatch dates.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) patterns + [Lucide Icons](https://lucide.dev/)
- **Database & ORM**: [Prisma](https://www.prisma.io/) with PostgreSQL

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **PostgreSQL**: Local instance or hosted provider (Supabase, Neon, Railway, Docker)

### 2. Install Dependencies
```bash
cd paypulse
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update your `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/paypulse?schema=public"
```

### 4. Database Setup with Prisma
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```

To explore data visually using Prisma Studio:
```bash
npx prisma studio
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

```
paypulse/
├── prisma/
│   └── schema.prisma         # PostgreSQL models: Freelancer, Client, Invoice, Reminder
├── public/                   # Static assets
├── src/
│   ├── app/
│   │   ├── clients/
│   │   │   └── page.tsx      # Clients list with risk scoring
│   │   ├── invoices/
│   │   │   ├── new/
│   │   │   │   └── page.tsx  # Interactive invoice creation & live preview
│   │   │   └── page.tsx      # Invoice table, search, and status filters
│   │   ├── reminders/
│   │   │   └── page.tsx      # Follow-up sequence queue & reminder templates
│   │   ├── settings/
│   │   │   └── page.tsx      # Freelancer profile & payment settings
│   │   ├── globals.css       # Design tokens & Tailwind styles
│   │   ├── layout.tsx        # App layout with DashboardShell
│   │   └── page.tsx          # Overview dashboard with 4 metric cards & charts
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── DashboardShell.tsx  # Responsive sidebar + header wrapper
│   │   │   ├── Header.tsx          # Top navigation & search bar
│   │   │   ├── OverviewCards.tsx   # Outstanding, High Risk, Recovered, Upcoming Due
│   │   │   └── Sidebar.tsx         # Sidebar navigation with active badges
│   │   └── ui/                     # shadcn/ui buttons, cards, badges, inputs
│   └── lib/
│       ├── data-store.ts     # In-memory reactive state & metrics calculator
│       ├── mock-data.ts      # Sample clients, invoices, and reminders
│       ├── prisma.ts         # Prisma Client singleton
│       └── utils.ts          # Utility functions (cn, formatCurrency, formatDate)
├── .env.example              # Sample environment configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💳 PayPal Sandbox Invoicing API Integration

PayPulse includes native server-side integration with the **PayPal Invoicing REST API (v2)** in **Sandbox Mode** (`https://api-m.sandbox.paypal.com`).

### 1. Create PayPal Developer Account & Sandbox Accounts
1. Log in to [developer.paypal.com](https://developer.paypal.com).
2. Under **Testing Tools** ➔ **Sandbox Accounts**, verify or create:
   - **Business Account (Merchant / Invoicer)**: Used to generate API credentials and send invoices (e.g. `sb-freelancer@business.example.com`).
   - **Personal Account (Buyer / Client)**: Used to open payment links and simulate buyer payments (e.g. `sb-client@personal.example.com`). Note the generated password for testing.

### 2. Create REST API Sandbox App & Credentials
1. Navigate to **Apps & Credentials** in the Developer Dashboard.
2. Ensure the top toggle is set to **Sandbox** (Never live).
3. Click **Create App**:
   - **App Name**: `PayPulse Invoicing Sandbox`
   - **App Type**: `Merchant`
   - **Sandbox Business Account**: Select your sandbox business account.
4. Click **Create App**.
5. Copy the generated:
   - **Client ID**
   - **Secret** (Click "Show")

### 3. Configure Local Environment Variables
Create or edit `.env.local` in the `paypulse` folder (never commit real credentials):

```env
# PayPal Sandbox Credentials (Server-side only)
PAYPAL_CLIENT_ID="your_sandbox_client_id_here"
PAYPAL_CLIENT_SECRET="your_sandbox_client_secret_here"
PAYPAL_BASE_URL="https://api-m.sandbox.paypal.com"
APP_BASE_URL="http://localhost:3000"

# PayPal Webhook ID (from Step 5)
PAYPAL_WEBHOOK_ID="your_sandbox_webhook_id_here"
```

### 4. Setup Local Webhook Tunnel
PayPal needs a public HTTPS endpoint to send webhook notifications to your local dev environment.
Using **ngrok** (or **cloudflared**):

```bash
# In a separate terminal
ngrok http 3000
```
Copy the secure HTTPS URL (e.g. `https://xxxx-xx-xx.ngrok-free.app`).
Your webhook destination URL is:
```
https://xxxx-xx-xx.ngrok-free.app/api/paypal/webhook
```

### 5. Create Sandbox Webhook with Required Event Types
1. In your PayPal App page, scroll down to **Sandbox Webhooks** and click **Add Webhook**.
2. **Webhook URL**: Enter `https://xxxx-xx-xx.ngrok-free.app/api/paypal/webhook`.
3. Select the following **Invoicing** event types:
   - ✅ `INVOICING.INVOICE.PAID`
   - ✅ `INVOICING.INVOICE.SENT`
   - ✅ `INVOICING.INVOICE.CANCELLED`
   - ✅ `INVOICING.INVOICE.REFUNDED`
4. Click **Save**.
5. Copy the newly created **Webhook ID** and paste it into `.env.local` as `PAYPAL_WEBHOOK_ID`.

### 6. Verification & End-to-End Testing Flow
1. **Create an Invoice**: In PayPulse, go to `/invoices/new` and create a draft invoice.
2. **Send via PayPal**: Open the invoice detail page (`/invoices/[id]`) and click **Send via PayPal**.
   - PayPulse calls `POST /v2/invoicing/invoices` to scaffold the draft invoice.
   - PayPulse calls `POST /v2/invoicing/invoices/{id}/send` to dispatch the invoice.
   - PayPulse fetches `detail.metadata.recipient_view_url` and stores it as `paypalPaymentUrl`.
   - The invoice transitions from `DRAFT` to `SENT`.
3. **Pay as Sandbox Buyer**:
   - Click **Open Payment Link** (or copy link into an incognito window).
   - Log in with your **Sandbox Personal (Buyer)** credentials and complete payment.
4. **Webhook Verification**:
   - PayPal delivers the `INVOICING.INVOICE.PAID` event to `/api/paypal/webhook`.
   - PayPulse verifies the cryptographic signature via PayPal's `verify-webhook-signature` API.
   - Duplicate events are skipped idempotently using `WebhookEvent`.
   - PayPulse queries PayPal API to verify status is `PAID` and updates local invoice to `PAID` with timestamp `paidAt`.
   - Overview metrics automatically refresh with the recovered payment!

---

## 🤖 AI Payment Reminder Workflow (Gemini + PayPal Invoicing)

PayPulse features an autonomous AI payment follow-up engine powered by Google Gemini and PayPal Invoicing Sandbox:

### 1. Strict Freelancer Safety & Control
- **Human-in-the-Loop Required**: Prominently displays `AI actions require freelancer approval`.
- **Approval Reset**: Any edit to a previously approved subject or body immediately resets status back to `DRAFT` and revokes approval.
- **Eligibility Guardrails**:
  - Invoices must be `HIGH` risk (or derived `OVERDUE`), `SENT` via PayPal (`paypalInvoiceId` present), and neither `PAID` nor `CANCELLED`.
  - Exactly **1 active reminder** per invoice (`DRAFT`, `APPROVED`, or `SCHEDULED`).
  - Maximum of **3 sent reminders** per invoice.
  - Minimum interval of **3 days** between consecutive reminder dispatches.
- **No Money Movement**: The PayPal integration allowlist strictly permits drafting, sending, sending reminders, and retrieving invoice metadata. No refund, cancellation, or payment recording is permitted.

### 2. Seed Invoice for Sandbox Testing (`INV-0006`)
- Seeded invoice `INV-0006` is a high-risk overdue invoice (`$3,500.00 USD`) with placeholder `paypalInvoiceId: "INV2-SANDBOX-TEST-001"`.
- To test live PayPal reminder dispatch with your own sandbox account:
  1. Create an invoice in PayPulse and send it via PayPal, or
  2. Update the `paypalInvoiceId` field of `INV-0006` in `prisma/seed.ts` or database to match an active invoice ID from your PayPal Developer Sandbox dashboard.

### 3. Scheduled Dispatch via Vercel Cron
Scheduled reminders are processed automatically by the cron endpoint:
- **Route**: `GET /api/cron/send-due-reminders` or `POST /api/cron/send-due-reminders`
- **Configuration (`vercel.json`)**:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/send-due-reminders",
        "schedule": "0 9 * * *"
      }
    ]
  }
  ```
- **Security**: Protected by `CRON_SECRET` header (`Authorization: Bearer <CRON_SECRET>`).

### 4. Manual Trigger for Local Development
To trigger processing of due scheduled reminders locally:
```bash
curl -X POST http://localhost:3000/api/cron/send-due-reminders \
  -H "Authorization: Bearer your_cron_secret_here"
```

### 5. Webhook Auto-Cancellation & Recovered Metrics
- When a payment is settled via `INVOICING.INVOICE.PAID`:
  - The invoice transitions to `PAID`.
  - All pending reminders (`DRAFT`, `APPROVED`, `SCHEDULED`) for this invoice are automatically marked `CANCELLED`.
- **Dashboard Recovered Card**:
  - Displays total amount recovered specifically for invoices that had a reminder with status `SENT` prior to payment (`sentAt <= paidAt`).
  - Separated per currency (never summing across different currencies), labeled `"Paid after reminder"` with invoice count.
