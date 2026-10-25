export interface ClientItem {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  paymentTerms: number;
  totalInvoiced: number;
  totalOutstanding: number;
  avgPaymentDays: number;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  title: string;
  amount: number;
  amountMinor: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "PENDING" | "HIGH_RISK" | "CANCELLED";
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  paypalInvoiceId?: string | null;
  paypalPaymentUrl?: string | null;
  riskScore?: number | null;
  riskReason?: string | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  recommendedAction?: string | null;
  reminderTone?: "FRIENDLY" | "NEUTRAL" | "FIRM" | "URGENT" | null;
  riskAnalyzedAt?: string | null;
  riskDataLimited?: boolean;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientRisk: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
  lineItems: LineItem[];
  reminderCount: number;
}

export interface WebhookEventItem {
  id: string;
  eventType: string;
  receivedAt: string;
}

export type ReminderStatus = "DRAFT" | "APPROVED" | "SCHEDULED" | "SENT" | "FAILED" | "CANCELLED";
export type ReminderChannel = "PAYPAL_REMINDER";

export interface ReminderItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  type: "GENTLE" | "FRIENDLY" | "FIRM" | "FINAL_NOTICE" | "CUSTOM";
  status: ReminderStatus;
  scheduledFor?: string | null;
  approvedAt?: string | null;
  sentAt?: string | null;
  subject: string;
  message: string;
  sendError?: string | null;
  channel: ReminderChannel;
  invoiceAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export const initialClients: ClientItem[] = [
  {
    id: "client-1",
    name: "Sarah Jenkins",
    email: "sarah@acme.inc",
    company: "Acme Innovations",
    phone: "+1 (555) 234-5678",
    riskLevel: "LOW",
    paymentTerms: 30,
    totalInvoiced: 26900,
    totalOutstanding: 2400,
    avgPaymentDays: 14,
    createdAt: "2026-01-15",
  },
  {
    id: "client-2",
    name: "Dave Miller",
    email: "dave@hyperscale.io",
    company: "HyperScale Labs",
    phone: "+1 (555) 890-1234",
    riskLevel: "HIGH",
    paymentTerms: 15,
    totalInvoiced: 15850,
    totalOutstanding: 2000,
    avgPaymentDays: 42,
    createdAt: "2026-03-02",
  },
  {
    id: "client-3",
    name: "Elena Rostova",
    email: "elena@nimbus.cloud",
    company: "Nimbus Cloud Systems",
    phone: "+1 (555) 456-7890",
    riskLevel: "MEDIUM",
    paymentTerms: 30,
    totalInvoiced: 103750,
    totalOutstanding: 88750,
    avgPaymentDays: 28,
    createdAt: "2026-02-10",
  },
  {
    id: "client-4",
    name: "Marcus Chen",
    email: "marcus@vantagemedia.com",
    company: "Vantage Media Group",
    phone: "+1 (555) 321-6540",
    riskLevel: "LOW",
    paymentTerms: 14,
    totalInvoiced: 21950,
    totalOutstanding: 3200,
    avgPaymentDays: 12,
    createdAt: "2026-01-28",
  },
  {
    id: "client-5",
    name: "Jordan Bell",
    email: "jbell@apexfin.co",
    company: "Apex Fintech",
    phone: "+1 (555) 789-0123",
    riskLevel: "HIGH",
    paymentTerms: 30,
    totalInvoiced: 18400,
    totalOutstanding: 5400,
    avgPaymentDays: 58,
    createdAt: "2026-04-05",
  },
];

export const initialInvoices: InvoiceItem[] = [
  // 5 realistic freelance invoices required by Feature 7:
  {
    id: "inv-seed-1",
    invoiceNumber: "INV-0001",
    title: "Brand Identity & Design System",
    amount: 2400,
    amountMinor: 240000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-09-28",
    dueDate: "2026-10-12", // 7 days overdue (status SENT & dueDate < today -> derived OVERDUE)
    paidAt: null,
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Deliverables: Design tokens, vector assets, and brand guidelines manual.",
    lineItems: [
      { id: "li-s1", description: "Design token architecture & Tailwind config", quantity: 15, unitPrice: 100, amount: 1500 },
      { id: "li-s2", description: "Brand book guidelines and SVG export suite", quantity: 9, unitPrice: 100, amount: 900 },
    ],
    reminderCount: 1,
  },
  {
    id: "inv-seed-2",
    invoiceNumber: "INV-0002",
    title: "Mobile App Wireframing & Prototyping",
    amount: 1850,
    amountMinor: 185000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-09-30",
    dueDate: "2026-10-15",
    paidAt: "2026-10-14T11:20:00.000Z", // Paid
    clientId: "client-2",
    clientName: "Dave Miller",
    clientEmail: "dave@hyperscale.io",
    clientCompany: "HyperScale Labs",
    clientRisk: "HIGH",
    notes: "Paid in full via Stripe direct transfer.",
    lineItems: [
      { id: "li-s3", description: "iOS & Android high-fidelity clickable prototype", quantity: 1, unitPrice: 1850, amount: 1850 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-seed-3",
    invoiceNumber: "INV-0003",
    title: "Full-Stack Next.js Dashboard Development",
    amount: 85000,
    amountMinor: 8500000,
    currency: "INR",
    status: "SENT",
    issueDate: "2026-10-07",
    dueDate: "2026-10-22", // Due in 3 days (due soon)
    paidAt: null,
    clientId: "client-3",
    clientName: "Elena Rostova",
    clientEmail: "elena@nimbus.cloud",
    clientCompany: "Nimbus Cloud Systems",
    clientRisk: "MEDIUM",
    notes: "Milestone 1 frontend & server actions delivery. Bank transfer to INR account.",
    lineItems: [
      { id: "li-s4", description: "Next.js App router dashboard & metric cards", quantity: 1, unitPrice: 50000, amount: 50000 },
      { id: "li-s5", description: "Prisma data modeling & API integration", quantity: 1, unitPrice: 35000, amount: 35000 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-seed-4",
    invoiceNumber: "INV-0004",
    title: "E-Commerce Checkout UX Redesign",
    amount: 3200,
    amountMinor: 320000,
    currency: "EUR",
    status: "SENT",
    issueDate: "2026-10-10",
    dueDate: "2026-11-02", // Future active invoice
    paidAt: null,
    clientId: "client-4",
    clientName: "Marcus Chen",
    clientEmail: "marcus@vantagemedia.com",
    clientCompany: "Vantage Media Group",
    clientRisk: "LOW",
    notes: "International wire transfer (EUR SEPA).",
    lineItems: [
      { id: "li-s6", description: "Checkout funnel friction audit & user testing", quantity: 16, unitPrice: 100, amount: 1600 },
      { id: "li-s7", description: "Stripe Elements custom checkout UI build", quantity: 16, unitPrice: 100, amount: 1600 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-seed-5",
    invoiceNumber: "INV-0005",
    title: "Q4 Marketing Landing Pages & SEO Audit",
    amount: 1200,
    amountMinor: 120000,
    currency: "USD",
    status: "DRAFT",
    issueDate: "2026-10-18",
    dueDate: "2026-11-15", // Draft invoice
    paidAt: null,
    clientId: "client-5",
    clientName: "Jordan Bell",
    clientEmail: "jbell@apexfin.co",
    clientCompany: "Apex Fintech",
    clientRisk: "HIGH",
    notes: "Draft estimate pending client scope approval.",
    lineItems: [
      { id: "li-s8", description: "Landing page wireframes & copywriting review", quantity: 12, unitPrice: 100, amount: 1200 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-seed-6",
    invoiceNumber: "INV-0006",
    title: "AI Payment Gateway Architecture & Compliance Audit",
    amount: 3500,
    amountMinor: 350000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-09-20",
    dueDate: "2026-10-10", // Overdue (>10 days past due) -> HIGH risk
    paidAt: null,
    clientId: "client-2",
    clientName: "Dave Miller",
    clientEmail: "dave@hyperscale.io",
    clientCompany: "HyperScale Labs",
    clientRisk: "HIGH",
    paypalInvoiceId: "INV2-SANDBOX-TEST-001",
    paypalPaymentUrl: "https://www.sandbox.paypal.com/invoice/p/#INV2-SANDBOX-TEST-001",
    riskScore: 85,
    riskLevel: "HIGH",
    riskReason: "High Risk: Payment is 14 days overdue and client has a documented history of delayed settlements.",
    recommendedAction: "Send formal payment reminder via PayPal with a 48-hour resolution request.",
    reminderTone: "FIRM",
    riskAnalyzedAt: "2026-10-20T12:00:00.000Z",
    riskDataLimited: false,
    notes: "PayPal Sandbox testing invoice. Replace paypalInvoiceId placeholder with an active Sandbox invoice ID if needed.",
    lineItems: [
      { id: "li-s9", description: "Architecture audit & PCI-DSS compliance roadmap", quantity: 1, unitPrice: 3500, amount: 3500 },
    ],
    reminderCount: 0,
  },

  // Existing invoices retained:
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0038",
    title: "Q3 Design System & Mobile Refactor",
    amount: 4200,
    amountMinor: 420000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-09-05",
    dueDate: "2026-10-05", // Overdue
    clientId: "client-5",
    clientName: "Jordan Bell",
    clientEmail: "jbell@apexfin.co",
    clientCompany: "Apex Fintech",
    clientRisk: "HIGH",
    notes: "Includes React Native UI token overhaul and Figma library sync.",
    lineItems: [
      { id: "li-1", description: "Design tokens architecture & Tailwind sync", quantity: 30, unitPrice: 90, amount: 2700 },
      { id: "li-2", description: "Mobile screens QA & layout polish", quantity: 15, unitPrice: 100, amount: 1500 },
    ],
    reminderCount: 2,
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0041",
    title: "Infrastructure UI Dashboard",
    amount: 3750,
    amountMinor: 375000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-09-21",
    dueDate: "2026-10-21", // due in 2 days
    clientId: "client-3",
    clientName: "Elena Rostova",
    clientEmail: "elena@nimbus.cloud",
    clientCompany: "Nimbus Cloud Systems",
    clientRisk: "MEDIUM",
    notes: "Milestone 2 frontend implementation completed.",
    lineItems: [
      { id: "li-3", description: "Cluster topology & metrics views", quantity: 25, unitPrice: 110, amount: 2750 },
      { id: "li-4", description: "RBAC settings & audit logs UI", quantity: 10, unitPrice: 100, amount: 1000 },
    ],
    reminderCount: 1,
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-0042",
    title: "Brand Guidelines & Asset Pack",
    amount: 2500,
    amountMinor: 250000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-09-23",
    dueDate: "2026-10-23", // due in 4 days
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Final approved vector exports and typography styleguide.",
    lineItems: [
      { id: "li-5", description: "Brand identity guidelines (PDF + Web)", quantity: 1, unitPrice: 1800, amount: 1800 },
      { id: "li-6", description: "Iconography and 3D asset render suite", quantity: 1, unitPrice: 700, amount: 700 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-0043",
    title: "API Documentation Portal UI",
    amount: 2000,
    amountMinor: 200000,
    currency: "USD",
    status: "SENT",
    issueDate: "2026-10-05",
    dueDate: "2026-10-20", // due in 1 day
    clientId: "client-2",
    clientName: "Dave Miller",
    clientEmail: "dave@hyperscale.io",
    clientCompany: "HyperScale Labs",
    clientRisk: "HIGH",
    notes: "Net 15 terms. Client has history of delayed settlements.",
    lineItems: [
      { id: "li-7", description: "Interactive OpenAPI explorer layout", quantity: 20, unitPrice: 100, amount: 2000 },
    ],
    reminderCount: 1,
  },
  {
    id: "inv-5",
    invoiceNumber: "INV-2026-0035",
    title: "Motion Graphics & Landing Page",
    amount: 5850,
    amountMinor: 585000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-08-15",
    dueDate: "2026-09-15",
    paidAt: "2026-10-02T10:00:00Z",
    clientId: "client-4",
    clientName: "Marcus Chen",
    clientEmail: "marcus@vantagemedia.com",
    clientCompany: "Vantage Media Group",
    clientRisk: "LOW",
    notes: "Recovered successfully after scheduled automated nudge.",
    lineItems: [
      { id: "li-8", description: "Hero motion graphics & Lottie animations", quantity: 1, unitPrice: 2850, amount: 2850 },
      { id: "li-9", description: "High-converting Next.js landing page", quantity: 1, unitPrice: 3000, amount: 3000 },
    ],
    reminderCount: 2,
  },
  {
    id: "inv-6",
    invoiceNumber: "INV-2026-0036",
    title: "Annual Design Retainer Q2",
    amount: 8000,
    amountMinor: 800000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-08-01",
    dueDate: "2026-08-31",
    paidAt: "2026-08-28T12:00:00Z",
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Paid in full via ACH transfer.",
    lineItems: [
      { id: "li-10", description: "Monthly product advisory & sprint design", quantity: 2, unitPrice: 4000, amount: 8000 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-7",
    invoiceNumber: "INV-2026-0037",
    title: "Product Strategy & Architecture Sprint",
    amount: 5000,
    amountMinor: 500000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-08-20",
    dueDate: "2026-09-20",
    paidAt: "2026-10-11T09:00:00Z",
    clientId: "client-3",
    clientName: "Elena Rostova",
    clientEmail: "elena@nimbus.cloud",
    clientCompany: "Nimbus Cloud Systems",
    clientRisk: "MEDIUM",
    notes: "Settled on time.",
    lineItems: [
      { id: "li-11", description: "Architecture workshops and wireframing", quantity: 1, unitPrice: 5000, amount: 5000 },
    ],
    reminderCount: 1,
  },
  {
    id: "inv-8",
    invoiceNumber: "INV-2026-0044",
    title: "E-Commerce Checkout Flow Redesign",
    amount: 3200,
    amountMinor: 320000,
    currency: "USD",
    status: "DRAFT",
    issueDate: "2026-10-18",
    dueDate: "2026-11-18",
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Draft prepared for upcoming project kickoff.",
    lineItems: [
      { id: "li-12", description: "Frictionless checkout UX audit & prototype", quantity: 32, unitPrice: 100, amount: 3200 },
    ],
    reminderCount: 0,
  },

  // Client 1 (Acme Innovations): Paid invoices on time (reliable payment history)
  {
    id: "inv-h101",
    invoiceNumber: "INV-H101",
    title: "Q2 Design Sprint & Token Library",
    amount: 1500,
    amountMinor: 150000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-06-01",
    dueDate: "2026-06-30",
    paidAt: "2026-06-25T10:00:00.000Z", // On time (5 days early)
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Settled promptly via wire transfer.",
    lineItems: [
      { id: "li-h1", description: "Design tokens library setup", quantity: 15, unitPrice: 100, amount: 1500 },
    ],
    reminderCount: 0,
  },
  {
    id: "inv-h102",
    invoiceNumber: "INV-H102",
    title: "Product Identity & Guidelines Manual",
    amount: 2800,
    amountMinor: 280000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-07-01",
    dueDate: "2026-07-31",
    paidAt: "2026-07-28T14:00:00.000Z", // On time (3 days early)
    clientId: "client-1",
    clientName: "Sarah Jenkins",
    clientEmail: "sarah@acme.inc",
    clientCompany: "Acme Innovations",
    clientRisk: "LOW",
    notes: "Settled on time.",
    lineItems: [
      { id: "li-h2", description: "Product guidelines PDF and vector kit", quantity: 1, unitPrice: 2800, amount: 2800 },
    ],
    reminderCount: 0,
  },

  // Client 2 (HyperScale Labs): Paid invoices with delay (late payment history)
  {
    id: "inv-h201",
    invoiceNumber: "INV-H201",
    title: "Kubernetes Cluster Dashboard UI",
    amount: 2200,
    amountMinor: 220000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-05-20",
    dueDate: "2026-06-15",
    paidAt: "2026-07-05T09:00:00.000Z", // 20 days late
    clientId: "client-2",
    clientName: "Dave Miller",
    clientEmail: "dave@hyperscale.io",
    clientCompany: "HyperScale Labs",
    clientRisk: "HIGH",
    notes: "Settled after 2 overdue notices.",
    lineItems: [
      { id: "li-h3", description: "Cluster topology layout", quantity: 1, unitPrice: 2200, amount: 2200 },
    ],
    reminderCount: 2,
  },
  {
    id: "inv-h202",
    invoiceNumber: "INV-H202",
    title: "Cloud Observability Console Refactor",
    amount: 3100,
    amountMinor: 310000,
    currency: "USD",
    status: "PAID",
    issueDate: "2026-06-20",
    dueDate: "2026-07-15",
    paidAt: "2026-08-02T16:30:00.000Z", // 18 days late
    clientId: "client-2",
    clientName: "Dave Miller",
    clientEmail: "dave@hyperscale.io",
    clientCompany: "HyperScale Labs",
    clientRisk: "HIGH",
    notes: "Settled after follow-up check-in.",
    lineItems: [
      { id: "li-h4", description: "Observability console Next.js rework", quantity: 1, unitPrice: 3100, amount: 3100 },
    ],
    reminderCount: 1,
  },
];

export const initialReminders: ReminderItem[] = [
  {
    id: "rem-1",
    invoiceId: "inv-1",
    invoiceNumber: "INV-2026-0038",
    clientName: "Jordan Bell",
    clientCompany: "Apex Fintech",
    type: "FIRM",
    status: "SENT",
    scheduledFor: "2026-10-10",
    sentAt: "2026-10-10T14:30:00Z",
    subject: "Overdue Notice: Invoice #INV-2026-0038 ($4,200.00)",
    message: "Hi Jordan, this is a firm reminder that invoice #INV-2026-0038 for $4,200.00 was due on October 5th. Please let us know if there is any issue processing this payment.",
    invoiceAmount: 4200,
    channel: "PAYPAL_REMINDER",
    createdAt: "2026-10-08T09:00:00Z",
    approvedAt: "2026-10-10T14:00:00Z",
    updatedAt: "2026-10-10T14:30:00Z",
  },
  {
    id: "rem-2",
    invoiceId: "inv-4",
    invoiceNumber: "INV-2026-0043",
    clientName: "Dave Miller",
    clientCompany: "HyperScale Labs",
    type: "FRIENDLY",
    status: "SCHEDULED",
    scheduledFor: "2026-10-19",
    subject: "Payment Reminder: Upcoming Due Date for #INV-2026-0043",
    message: "Hi Dave, just a friendly note that invoice #INV-2026-0043 ($2,000.00) is scheduled for payment on October 20th. Thank you for your partnership!",
    invoiceAmount: 2000,
    channel: "PAYPAL_REMINDER",
    createdAt: "2026-10-18T10:00:00Z",
    approvedAt: "2026-10-18T11:00:00Z",
    updatedAt: "2026-10-18T11:00:00Z",
  },
  {
    id: "rem-3",
    invoiceId: "inv-2",
    invoiceNumber: "INV-2026-0041",
    clientName: "Elena Rostova",
    clientCompany: "Nimbus Cloud Systems",
    type: "GENTLE",
    status: "SCHEDULED",
    scheduledFor: "2026-10-20",
    subject: "Upcoming Payment Due: Invoice #INV-2026-0041",
    message: "Hi Elena, hope you are having a productive week. This is a gentle reminder that invoice #INV-2026-0041 for $3,750.00 will be due tomorrow. Let me know if you need any additional receipts.",
    invoiceAmount: 3750,
    channel: "PAYPAL_REMINDER",
    createdAt: "2026-10-19T08:00:00Z",
    approvedAt: "2026-10-19T09:00:00Z",
    updatedAt: "2026-10-19T09:00:00Z",
  },
  {
    id: "rem-4",
    invoiceId: "inv-5",
    invoiceNumber: "INV-2026-0035",
    clientName: "Marcus Chen",
    clientCompany: "Vantage Media Group",
    type: "GENTLE",
    status: "SENT",
    scheduledFor: "2026-09-20",
    sentAt: "2026-09-20T10:15:00Z",
    subject: "Friendly Check-in: Invoice #INV-2026-0035",
    message: "Hi Marcus, checking in on invoice #INV-2026-0035. Payment was received with thanks on Oct 2nd!",
    invoiceAmount: 5850,
    channel: "PAYPAL_REMINDER",
    createdAt: "2026-09-18T10:00:00Z",
    approvedAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T10:15:00Z",
  },
];
