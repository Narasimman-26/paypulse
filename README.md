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

## 🔒 Roadmap (Future Integrations)
- **PayPal Integration**: Direct checkout buttons, PayPal invoicing API sync, instant webhook listeners.
- **AI Cashflow Insights**: Predictive delinquency scoring and automated reminder tone calibration.
