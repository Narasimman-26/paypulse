import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  getPayPalInvoice,
} from "@/lib/paypal";
import {
  getInvoiceByPayPalId,
  updateInvoiceStatus,
  hasWebhookEvent,
  addWebhookEvent,
  cancelPendingRemindersForInvoice,
} from "@/lib/data-store";

export const runtime = "nodejs";

/**
 * POST /api/paypal/webhook
 * Handles incoming PayPal Sandbox Invoicing Webhooks
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body text
    const rawBody = await req.text();

    if (!rawBody || rawBody.trim().length === 0) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Convert headers to lower-cased record for signature verification
    const headersRecord: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    // 2. Verify signature via PayPal API with PAYPAL_WEBHOOK_ID
    const isValid = await verifyWebhookSignature(headersRecord, rawBody);
    if (!isValid) {
      console.warn("[PayPal Webhook] Signature verification failed or rejected with HTTP 400.");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // Parse event
    let event: {
      id?: string;
      event_type?: string;
      resource?: {
        id?: string;
        status?: string;
        detail?: {
          invoice_number?: string;
        };
      };
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const eventId = event.id;
    const eventType = event.event_type;

    if (!eventId || !eventType) {
      return NextResponse.json(
        { error: "Missing event ID or event_type" },
        { status: 400 }
      );
    }

    // 3. Skip duplicate event IDs (Idempotency check via WebhookEvent)
    if (hasWebhookEvent(eventId)) {
      console.log(`[PayPal Webhook] Duplicate event ${eventId} (${eventType}) received - skipping.`);
      return NextResponse.json(
        { message: "Duplicate event already processed", eventId },
        { status: 200 }
      );
    }

    // Record WebhookEvent for idempotency
    addWebhookEvent(eventId, eventType);

    // Extract PayPal invoice ID from resource
    const paypalInvoiceId = event.resource?.id;
    if (!paypalInvoiceId) {
      console.log(`[PayPal Webhook] Event ${eventType} has no resource.id - processed.`);
      return NextResponse.json(
        { received: true, eventId, eventType },
        { status: 200 }
      );
    }

    // 4. Match local invoice by paypalInvoiceId
    const localInvoice = getInvoiceByPayPalId(paypalInvoiceId);
    if (!localInvoice) {
      console.warn(
        `[PayPal Webhook] No matching local invoice found for paypalInvoiceId: ${paypalInvoiceId}`
      );
      // Return 200 quickly per webhook protocol
      return NextResponse.json(
        { received: true, matched: false, paypalInvoiceId },
        { status: 200 }
      );
    }

    console.log(
      `[PayPal Webhook] Processing event '${eventType}' for invoice #${localInvoice.invoiceNumber} (PayPal ID: ${paypalInvoiceId})`
    );

    // 5. Handle event types
    switch (eventType) {
      case "INVOICING.INVOICE.PAID": {
        // Fetch invoice details via API, mark local PAID with paidAt only if PayPal status is PAID
        try {
          const remoteInvoice = await getPayPalInvoice(paypalInvoiceId);
          if (remoteInvoice.status === "PAID") {
            updateInvoiceStatus(localInvoice.id, "PAID");
            // Set all DRAFT/APPROVED/SCHEDULED reminders to CANCELLED
            const cancelledCount = cancelPendingRemindersForInvoice(localInvoice.id);
            console.log(
              `[PayPal Webhook] Successfully marked invoice #${localInvoice.invoiceNumber} as PAID and cancelled ${cancelledCount} pending reminder(s)`
            );
          } else {
            console.warn(
              `[PayPal Webhook] Remote status was '${remoteInvoice.status}', expected 'PAID'. Status not updated.`
            );
          }
        } catch (fetchErr) {
          console.error(
            `[PayPal Webhook] Failed to fetch remote invoice details for ${paypalInvoiceId}:`,
            fetchErr
          );
        }
        break;
      }

      case "INVOICING.INVOICE.SENT": {
        if (localInvoice.status === "DRAFT") {
          updateInvoiceStatus(localInvoice.id, "SENT");
          console.log(
            `[PayPal Webhook] Successfully marked invoice #${localInvoice.invoiceNumber} as SENT`
          );
        }
        break;
      }

      case "INVOICING.INVOICE.CANCELLED": {
        updateInvoiceStatus(localInvoice.id, "CANCELLED");
        console.log(
          `[PayPal Webhook] Successfully marked invoice #${localInvoice.invoiceNumber} as CANCELLED`
        );
        break;
      }

      case "INVOICING.INVOICE.REFUNDED": {
        const note = `PayPal Refund received on ${new Date().toISOString().split("T")[0]}`;
        updateInvoiceStatus(localInvoice.id, localInvoice.status, note);
        console.log(
          `[PayPal Webhook] Logged refund note for invoice #${localInvoice.invoiceNumber}: ${note}`
        );
        break;
      }

      default: {
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
        break;
      }
    }

    // Return 200 quickly
    return NextResponse.json(
      {
        received: true,
        eventId,
        eventType,
        paypalInvoiceId,
        invoiceNumber: localInvoice.invoiceNumber,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal webhook error";
    console.error("[PayPal Webhook Exception]:", err);
    return NextResponse.json(
      { error: "Webhook handler failed", detail: errorMsg },
      { status: 500 }
    );
  }
}
