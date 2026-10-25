// PayPal Sandbox Invoicing API Integration
// Server-side only - never expose credentials or tokens to the client
//
// STRICT ALLOWLIST (NO MONEY MOVEMENT: No refund, cancel, or record-payment functions):
// 1. createPayPalDraftInvoice (POST /v2/invoicing/invoices)
// 2. sendPayPalInvoice (POST /v2/invoicing/invoices/{id}/send)
// 3. sendPayPalInvoiceReminder (POST /v2/invoicing/invoices/{id}/remind)
// 4. getPayPalInvoice (GET /v2/invoicing/invoices/{id})
// 5. verifyWebhookSignature (POST /v1/notifications/verify-webhook-signature)

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  webhookId?: string;
  baseUrl: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in ms
}

let cachedToken: CachedToken | null = null;

export function getPayPalConfig(): PayPalConfig {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  // Sandbox only, never live
  const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PayPal sandbox credentials. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local"
    );
  }

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    webhookId: webhookId ? webhookId.trim() : undefined,
    baseUrl: baseUrl.trim().replace(/\/+$/, ""),
  };
}

export function arePayPalCredentialsConfigured(): boolean {
  try {
    const config = getPayPalConfig();
    return !!config.clientId && !!config.clientSecret;
  } catch {
    return false;
  }
}

/**
 * Fetch OAuth 2.0 access token from PayPal with in-memory caching until expiry
 */
export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  // Buffer of 60 seconds before actual token expiry
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret, baseUrl } = getPayPalConfig();
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const url = `${baseUrl}/v1/oauth2/token`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[PayPal OAuth Error] HTTP ${response.status}:`, responseText);
    let errorDetail = `Failed to obtain PayPal OAuth token (HTTP ${response.status})`;
    try {
      const errJson = JSON.parse(responseText);
      if (errJson.error_description) {
        errorDetail = `PayPal OAuth Error: ${errJson.error_description}`;
      } else if (errJson.error) {
        errorDetail = `PayPal OAuth Error: ${errJson.error}`;
      }
    } catch {
      // Use fallback
    }
    throw new Error(errorDetail);
  }

  const data = JSON.parse(responseText);
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + expiresIn * 1000,
  };

  return cachedToken.accessToken;
}

/**
 * Generic helper to call PayPal API with automatic auth, logging, and readable error handling
 */
export async function callPayPalApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { baseUrl } = getPayPalConfig();
  const token = await getPayPalAccessToken();

  const fullUrl = endpoint.startsWith("http")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[PayPal API Error] ${options.method || "GET"} ${fullUrl} -> HTTP ${response.status}:`, responseText);
    let readableError = `PayPal API Error (HTTP ${response.status})`;
    try {
      const errJson = JSON.parse(responseText);
      const name = errJson.name || "";
      const message = errJson.message || "";
      const details = Array.isArray(errJson.details)
        ? errJson.details.map((d: { issue?: string; description?: string }) => d.description || d.issue).filter(Boolean).join("; ")
        : "";
      const debugId = errJson.debug_id ? ` [debug_id: ${errJson.debug_id}]` : "";

      readableError = [name, message, details].filter(Boolean).join(" - ") + debugId;
    } catch {
      if (responseText) {
        readableError += `: ${responseText.slice(0, 200)}`;
      }
    }
    throw new Error(readableError);
  }

  if (!responseText || responseText.trim().length === 0) {
    return {} as T;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return responseText as unknown as T;
  }
}

export interface PayPalCreateInvoiceInput {
  invoiceNumber: string;
  title: string;
  amountMinor: number;
  currency: string;
  dueDate: string; // YYYY-MM-DD
  clientEmail: string;
  clientName?: string;
  notes?: string;
}

export interface PayPalInvoiceDetail {
  id: string;
  status: string;
  detail?: {
    invoice_number?: string;
    metadata?: {
      recipient_view_url?: string;
      invoicer_view_url?: string;
    };
  };
}

/**
 * 1. POST /v2/invoicing/invoices (Draft invoice creation)
 */
export async function createPayPalDraftInvoice(
  input: PayPalCreateInvoiceInput
): Promise<{ id: string; status: string }> {
  // Amount converted from minor units to decimal string (e.g. 150000 -> "1500.00")
  const decimalAmount = (input.amountMinor / 100).toFixed(2);

  // Normalize due date to YYYY-MM-DD
  const dueDateFormatted = input.dueDate.includes("T")
    ? input.dueDate.split("T")[0]
    : input.dueDate;

  const names = (input.clientName || "Valued Client").trim().split(" ");
  const givenName = names[0] || "Valued";
  const surname = names.slice(1).join(" ") || "Client";

  const payload = {
    detail: {
      invoice_number: input.invoiceNumber,
      payment_term: {
        term_type: "DUE_ON_DATE_SPECIFIED",
        due_date: dueDateFormatted,
      },
      currency_code: input.currency.toUpperCase(),
      note: input.notes || "Thank you for your business.",
    },
    primary_recipients: [
      {
        billing_info: {
          name: {
            given_name: givenName,
            surname: surname,
          },
          email_address: input.clientEmail.trim(),
        },
      },
    ],
    items: [
      {
        name: input.title.trim() || "Professional Services",
        quantity: "1",
        unit_amount: {
          currency_code: input.currency.toUpperCase(),
          value: decimalAmount,
        },
      },
    ],
    amount: {
      currency_code: input.currency.toUpperCase(),
      value: decimalAmount,
      breakdown: {
        item_total: {
          currency_code: input.currency.toUpperCase(),
          value: decimalAmount,
        },
      },
    },
  };

  const response = await callPayPalApi<{ id: string; status: string; href?: string }>(
    "/v2/invoicing/invoices",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return {
    id: response.id,
    status: response.status || "DRAFT",
  };
}

/**
 * 2. POST /v2/invoicing/invoices/{id}/send
 */
export async function sendPayPalInvoice(paypalInvoiceId: string): Promise<void> {
  await callPayPalApi<void>(`/v2/invoicing/invoices/${encodeURIComponent(paypalInvoiceId)}/send`, {
    method: "POST",
    body: JSON.stringify({
      send_to_invoicer: false,
    }),
  });
}

/**
 * 3. POST /v2/invoicing/invoices/{id}/remind
 * Sends a polite payment reminder to the client with subject and note.
 */
export async function sendPayPalInvoiceReminder(
  paypalInvoiceId: string,
  subject: string,
  note: string
): Promise<void> {
  await callPayPalApi<void>(
    `/v2/invoicing/invoices/${encodeURIComponent(paypalInvoiceId)}/remind`,
    {
      method: "POST",
      body: JSON.stringify({
        subject: subject.trim(),
        note: note.trim(),
        send_to_invoicer: false,
      }),
    }
  );
}

/**
 * 4. GET /v2/invoicing/invoices/{id}
 */
export async function getPayPalInvoice(paypalInvoiceId: string): Promise<PayPalInvoiceDetail> {
  return await callPayPalApi<PayPalInvoiceDetail>(
    `/v2/invoicing/invoices/${encodeURIComponent(paypalInvoiceId)}`,
    {
      method: "GET",
    }
  );
}

/**
 * 4. Verify Webhook Signature via PayPal API:
 * POST /v1/notifications/verify-webhook-signature
 */
export async function verifyWebhookSignature(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string
): Promise<boolean> {
  const { webhookId } = getPayPalConfig();

  if (!webhookId) {
    console.warn("[PayPal Webhook] PAYPAL_WEBHOOK_ID is not configured in environment.");
    return false;
  }

  // Helper to extract header value regardless of case
  const getHeader = (key: string): string => {
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lowerKey) {
        return Array.isArray(v) ? v[0] : v || "";
      }
    }
    return "";
  };

  let webhookEventObj: unknown;
  try {
    webhookEventObj = JSON.parse(rawBody);
  } catch {
    console.error("[PayPal Webhook] Failed to parse webhook JSON body");
    return false;
  }

  const verificationPayload = {
    auth_algo: getHeader("paypal-auth-algo"),
    cert_url: getHeader("paypal-cert-url"),
    transmission_id: getHeader("paypal-transmission-id"),
    transmission_sig: getHeader("paypal-transmission-sig"),
    transmission_time: getHeader("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: webhookEventObj,
  };

  try {
    const result = await callPayPalApi<{ verification_status: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify(verificationPayload),
      }
    );

    return result.verification_status === "SUCCESS";
  } catch (error) {
    console.error("[PayPal Webhook Verification Error]:", error);
    return false;
  }
}
