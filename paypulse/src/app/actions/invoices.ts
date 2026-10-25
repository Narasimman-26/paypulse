"use server";

import { revalidatePath } from "next/cache";
import {
  addInvoice,
  updateInvoiceStatus,
  getInvoice,
  updateInvoicePayPalDetails,
  InvoiceItem,
} from "@/lib/data-store";
import {
  createPayPalDraftInvoice,
  sendPayPalInvoice,
  getPayPalInvoice,
  arePayPalCredentialsConfigured,
} from "@/lib/paypal";
import {
  createInvoiceSchema,
  CreateInvoiceInput,
  updateInvoiceStatusSchema,
} from "@/lib/validations";

export interface InvoiceActionResult {
  success: boolean;
  invoice?: InvoiceItem;
  errors?: {
    title?: string[];
    amount?: string[];
    currency?: string[];
    dueDate?: string[];
    clientId?: string[];
    general?: string;
  };
  message?: string;
}

export async function createInvoiceAction(
  data: CreateInvoiceInput
): Promise<InvoiceActionResult> {
  const result = createInvoiceSchema.safeParse(data);

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    return {
      success: false,
      errors: {
        title: fieldErrors.title,
        amount: fieldErrors.amount,
        currency: fieldErrors.currency,
        dueDate: fieldErrors.dueDate,
        clientId: fieldErrors.clientId,
      },
    };
  }

  const { title, amount, currency, dueDate, clientId, notes } = result.data;

  try {
    // Store as amountMinor in minor units (cents / paise)
    const amountMinor = Math.round(amount * 100);

    const newInvoice = addInvoice({
      title,
      amount,
      amountMinor,
      currency,
      dueDate,
      clientId,
      status: "DRAFT", // Default status DRAFT
      notes,
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${newInvoice.id}`);
    revalidatePath("/");

    return {
      success: true,
      invoice: newInvoice,
      message: `Invoice #${newInvoice.invoiceNumber} created successfully.`,
    };
  } catch {
    return {
      success: false,
      errors: {
        general: "Failed to create invoice. Please try again.",
      },
    };
  }
}

export async function updateInvoiceStatusAction(data: {
  id: string;
  status: "DRAFT" | "SENT" | "PAID";
}): Promise<InvoiceActionResult> {
  const result = updateInvoiceStatusSchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: {
        general: result.error.issues[0]?.message || "Invalid status update",
      },
    };
  }

  const { id, status } = result.data;
  const existing = getInvoice(id);

  if (!existing) {
    return {
      success: false,
      errors: {
        general: "Invoice not found",
      },
    };
  }

  try {
    const updated = updateInvoiceStatus(id, status);

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${id}`);
    revalidatePath(`/invoices/${existing.invoiceNumber}`);
    revalidatePath("/");

    return {
      success: true,
      invoice: updated || undefined,
      message: `Invoice #${existing.invoiceNumber} status updated to ${status}.`,
    };
  } catch {
    return {
      success: false,
      errors: {
        general: "Failed to update invoice status. Please try again.",
      },
    };
  }
}

export async function sendViaPayPalAction(invoiceId: string): Promise<InvoiceActionResult> {
  const invoice = getInvoice(invoiceId);

  if (!invoice) {
    return {
      success: false,
      errors: {
        general: "Invoice not found.",
      },
    };
  }

  // Only allowed for DRAFT invoices with no paypalInvoiceId
  if (invoice.status !== "DRAFT") {
    return {
      success: false,
      errors: {
        general: `Cannot send via PayPal: invoice is currently in '${invoice.status}' status (must be DRAFT).`,
      },
    };
  }

  if (invoice.paypalInvoiceId) {
    return {
      success: false,
      errors: {
        general: `Invoice has already been registered with PayPal (ID: ${invoice.paypalInvoiceId}).`,
      },
    };
  }

  if (!arePayPalCredentialsConfigured()) {
    return {
      success: false,
      errors: {
        general:
          "Missing PayPal sandbox credentials. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local",
      },
    };
  }

  // 1. Create Draft invoice via PayPal
  let draftResult: { id: string; status: string };
  try {
    draftResult = await createPayPalDraftInvoice({
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      amountMinor: invoice.amountMinor,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      clientEmail: invoice.clientEmail,
      clientName: invoice.clientName,
      notes: invoice.notes,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to create PayPal draft invoice";
    return {
      success: false,
      errors: {
        general: errorMsg,
      },
    };
  }

  // 2. Send the invoice via PayPal
  try {
    await sendPayPalInvoice(draftResult.id);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send invoice via PayPal";
    // Handle partial failure: save draft paypalInvoiceId, but maintain status as DRAFT
    // DB never says SENT if the send failed
    updateInvoicePayPalDetails(invoice.id, {
      paypalInvoiceId: draftResult.id,
      status: "DRAFT",
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath(`/invoices/${invoice.invoiceNumber}`);

    return {
      success: false,
      errors: {
        general: `PayPal draft created (${draftResult.id}), but sending failed: ${errorMsg}. Status remains DRAFT.`,
      },
    };
  }

  // 3. GET /v2/invoicing/invoices/{id} and store detail.metadata.recipient_view_url as paypalPaymentUrl
  let recipientPaymentUrl: string | undefined;
  try {
    const detail = await getPayPalInvoice(draftResult.id);
    recipientPaymentUrl = detail.detail?.metadata?.recipient_view_url;
  } catch (detailErr) {
    console.warn("Could not retrieve recipient_view_url from PayPal detail, using direct sandbox fallback link:", detailErr);
    recipientPaymentUrl = `https://www.sandbox.paypal.com/invoice/p/#${draftResult.id}`;
  }

  const finalPaymentUrl = recipientPaymentUrl || `https://www.sandbox.paypal.com/invoice/p/#${draftResult.id}`;

  // Save paypalInvoiceId, set status SENT
  const updated = updateInvoicePayPalDetails(invoice.id, {
    paypalInvoiceId: draftResult.id,
    paypalPaymentUrl: finalPaymentUrl,
    status: "SENT",
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/invoices/${invoice.invoiceNumber}`);
  revalidatePath("/");

  return {
    success: true,
    invoice: updated || undefined,
    message: `Invoice #${invoice.invoiceNumber} successfully sent to ${invoice.clientEmail} via PayPal Sandbox!`,
  };
}
