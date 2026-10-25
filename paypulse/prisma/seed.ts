import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultFreelancer = {
  id: "freelancer-1",
  email: "alex.morgan@freelance.design",
  name: "Alex Morgan",
  businessName: "Morgan Creative Studio",
  currency: "USD",
};

const seedClients = [
  {
    id: "client-1",
    name: "Sarah Jenkins",
    email: "sarah@acme.inc",
    company: "Acme Innovations",
    phone: "+1 (555) 234-5678",
    riskLevel: "LOW" as const,
    paymentTerms: 30,
  },
  {
    id: "client-2",
    name: "Dave Miller",
    email: "dave@hyperscale.io",
    company: "HyperScale Labs",
    phone: "+1 (555) 890-1234",
    riskLevel: "HIGH" as const,
    paymentTerms: 15,
  },
  {
    id: "client-3",
    name: "Elena Rostova",
    email: "elena@nimbus.cloud",
    company: "Nimbus Cloud Systems",
    phone: "+1 (555) 456-7890",
    riskLevel: "MEDIUM" as const,
    paymentTerms: 30,
  },
  {
    id: "client-4",
    name: "Marcus Chen",
    email: "marcus@vantagemedia.com",
    company: "Vantage Media Group",
    phone: "+1 (555) 321-6540",
    riskLevel: "LOW" as const,
    paymentTerms: 14,
  },
  {
    id: "client-5",
    name: "Jordan Bell",
    email: "jbell@apexfin.co",
    company: "Apex Fintech",
    phone: "+1 (555) 789-0123",
    riskLevel: "HIGH" as const,
    paymentTerms: 30,
  },
];

interface SeedInvoice {
  invoiceNumber: string;
  title: string;
  amount: number;
  amountMinor: number;
  currency: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: Date;
  dueDate: Date;
  paidAt?: Date | null;
  clientId: string;
  notes?: string;
  paypalInvoiceId?: string | null;
  paypalPaymentUrl?: string | null;
  riskScore?: number | null;
  riskReason?: string | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | null;
  recommendedAction?: string | null;
  reminderTone?: "FRIENDLY" | "NEUTRAL" | "FIRM" | "URGENT" | null;
  riskAnalyzedAt?: Date | null;
  riskDataLimited?: boolean;
}

const seedInvoices: SeedInvoice[] = [
  // 5 realistic freelance invoices (Feature 7)
  {
    invoiceNumber: "INV-0001",
    title: "Brand Identity & Design System",
    amount: 2400,
    amountMinor: 240000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-09-28"),
    dueDate: new Date("2026-10-12"), // Overdue (SENT & dueDate < today)
    paidAt: null,
    clientId: "client-1",
    notes: "Deliverables: Design tokens, vector assets, and brand guidelines manual.",
  },
  {
    invoiceNumber: "INV-0002",
    title: "Mobile App Wireframing & Prototyping",
    amount: 1850,
    amountMinor: 185000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-09-30"),
    dueDate: new Date("2026-10-15"),
    paidAt: new Date("2026-10-14T11:20:00Z"), // Paid
    clientId: "client-2",
    notes: "Paid in full via Stripe direct transfer.",
  },
  {
    invoiceNumber: "INV-0003",
    title: "Full-Stack Next.js Dashboard Development",
    amount: 85000,
    amountMinor: 8500000,
    currency: "INR",
    status: "SENT" as const,
    issueDate: new Date("2026-10-07"),
    dueDate: new Date("2026-10-22"), // Due in 3 days (due soon)
    paidAt: null,
    clientId: "client-3",
    notes: "Milestone 1 frontend & server actions delivery.",
  },
  {
    invoiceNumber: "INV-0004",
    title: "E-Commerce Checkout UX Redesign",
    amount: 3200,
    amountMinor: 320000,
    currency: "EUR",
    status: "SENT" as const,
    issueDate: new Date("2026-10-10"),
    dueDate: new Date("2026-11-02"), // Future active invoice
    paidAt: null,
    clientId: "client-4",
    notes: "International wire transfer (EUR SEPA).",
  },
  {
    invoiceNumber: "INV-0005",
    title: "Q4 Marketing Landing Pages & SEO Audit",
    amount: 1200,
    amountMinor: 120000,
    currency: "USD",
    status: "DRAFT" as const,
    issueDate: new Date("2026-10-18"),
    dueDate: new Date("2026-11-15"), // Draft
    paidAt: null,
    clientId: "client-5",
    notes: "Draft estimate pending client scope approval.",
  },
  {
    invoiceNumber: "INV-0006",
    title: "AI Payment Gateway Architecture & Compliance Audit",
    amount: 3500,
    amountMinor: 350000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-09-20"),
    dueDate: new Date("2026-10-10"), // Overdue -> High Risk
    paidAt: null,
    clientId: "client-2",
    notes: "PayPal Sandbox testing invoice. Replace paypalInvoiceId placeholder with an active Sandbox invoice ID if needed.",
    paypalInvoiceId: "INV2-SANDBOX-TEST-001",
    paypalPaymentUrl: "https://www.sandbox.paypal.com/invoice/p/#INV2-SANDBOX-TEST-001",
    riskScore: 85,
    riskLevel: "HIGH" as const,
    riskReason: "High Risk: Payment is 14 days overdue and client has a documented history of delayed settlements.",
    recommendedAction: "Send formal payment reminder via PayPal with a 48-hour resolution request.",
    reminderTone: "FIRM" as const,
    riskAnalyzedAt: new Date("2026-10-20T12:00:00Z"),
    riskDataLimited: false,
  },
  // Existing invoices retained:
  {
    invoiceNumber: "INV-2026-0038",
    title: "Q3 Design System & Mobile Refactor",
    amount: 4200,
    amountMinor: 420000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-09-05"),
    dueDate: new Date("2026-10-05"),
    paidAt: null,
    clientId: "client-5",
    notes: "Includes React Native UI token overhaul and Figma library sync.",
  },
  {
    invoiceNumber: "INV-2026-0041",
    title: "Infrastructure UI Dashboard",
    amount: 3750,
    amountMinor: 375000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-09-21"),
    dueDate: new Date("2026-10-21"),
    paidAt: null,
    clientId: "client-3",
    notes: "Milestone 2 frontend implementation completed.",
  },
  {
    invoiceNumber: "INV-2026-0042",
    title: "Brand Guidelines & Asset Pack",
    amount: 2500,
    amountMinor: 250000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-09-23"),
    dueDate: new Date("2026-10-23"),
    paidAt: null,
    clientId: "client-1",
    notes: "Final approved vector exports and typography styleguide.",
  },
  {
    invoiceNumber: "INV-2026-0043",
    title: "API Documentation Portal UI",
    amount: 2000,
    amountMinor: 200000,
    currency: "USD",
    status: "SENT" as const,
    issueDate: new Date("2026-10-05"),
    dueDate: new Date("2026-10-20"),
    paidAt: null,
    clientId: "client-2",
    notes: "Net 15 terms. Client has history of delayed settlements.",
  },
  {
    invoiceNumber: "INV-2026-0035",
    title: "Motion Graphics & Landing Page",
    amount: 5850,
    amountMinor: 585000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-08-15"),
    dueDate: new Date("2026-09-15"),
    paidAt: new Date("2026-10-02"),
    clientId: "client-4",
    notes: "Recovered successfully after scheduled automated nudge.",
  },
  // Client 1 (Acme Innovations): Paid invoices on time (reliable payment history)
  {
    invoiceNumber: "INV-H101",
    title: "Q2 Design Sprint & Token Library",
    amount: 1500,
    amountMinor: 150000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-06-01"),
    dueDate: new Date("2026-06-30"),
    paidAt: new Date("2026-06-25"), // On time (5 days early)
    clientId: "client-1",
    notes: "Settled promptly via wire transfer.",
  },
  {
    invoiceNumber: "INV-H102",
    title: "Product Identity & Guidelines Manual",
    amount: 2800,
    amountMinor: 280000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-07-01"),
    dueDate: new Date("2026-07-31"),
    paidAt: new Date("2026-07-28"), // On time (3 days early)
    clientId: "client-1",
    notes: "Settled on time.",
  },
  // Client 2 (HyperScale Labs): Paid invoices with delay (late payment history)
  {
    invoiceNumber: "INV-H201",
    title: "Kubernetes Cluster Dashboard UI",
    amount: 2200,
    amountMinor: 220000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-05-20"),
    dueDate: new Date("2026-06-15"),
    paidAt: new Date("2026-07-05"), // 20 days late
    clientId: "client-2",
    notes: "Settled after 2 overdue notices.",
  },
  {
    invoiceNumber: "INV-H202",
    title: "Cloud Observability Console Refactor",
    amount: 3100,
    amountMinor: 310000,
    currency: "USD",
    status: "PAID" as const,
    issueDate: new Date("2026-06-20"),
    dueDate: new Date("2026-07-15"),
    paidAt: new Date("2026-08-02"), // 18 days late
    clientId: "client-2",
    notes: "Settled after follow-up check-in.",
  },
];

export async function main() {
  console.log("Starting PayPulse database seeding...");

  try {
    // 1. Upsert Freelancer
    const freelancer = await prisma.freelancer.upsert({
      where: { email: defaultFreelancer.email },
      update: {
        name: defaultFreelancer.name,
        businessName: defaultFreelancer.businessName,
      },
      create: defaultFreelancer,
    });
    console.log(`✓ Freelancer ready: ${freelancer.name} (${freelancer.email})`);

    // 2. Upsert Clients (re-runnable without duplicates)
    for (const client of seedClients) {
      await prisma.client.upsert({
        where: { id: client.id },
        update: {
          name: client.name,
          email: client.email,
          company: client.company,
          phone: client.phone,
          riskLevel: client.riskLevel,
          paymentTerms: client.paymentTerms,
        },
        create: {
          ...client,
          freelancerId: freelancer.id,
        },
      });
    }
    console.log(`✓ ${seedClients.length} clients seeded without duplicates`);

    // 3. Upsert Invoices (re-runnable without duplicates)
    for (const inv of seedInvoices) {
      await prisma.invoice.upsert({
        where: { invoiceNumber: inv.invoiceNumber },
        update: {
          title: inv.title,
          amount: inv.amount,
          amountMinor: inv.amountMinor,
          currency: inv.currency,
          status: inv.status,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          paidAt: inv.paidAt,
          notes: inv.notes,
          clientId: inv.clientId,
          paypalInvoiceId: inv.paypalInvoiceId,
          paypalPaymentUrl: inv.paypalPaymentUrl,
          riskScore: inv.riskScore,
          riskReason: inv.riskReason,
          riskLevel: inv.riskLevel,
          recommendedAction: inv.recommendedAction,
          reminderTone: inv.reminderTone,
          riskAnalyzedAt: inv.riskAnalyzedAt,
          riskDataLimited: inv.riskDataLimited ?? false,
        },
        create: {
          ...inv,
          freelancerId: freelancer.id,
        },
      });
    }
    console.log(`✓ ${seedInvoices.length} invoices seeded without duplicates`);
    console.log("Seeding finished successfully!");
  } catch (error) {
    console.warn("Database connection not active or Prisma seed ran in offline mode:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
