import type { SummitPriceSummary } from "@/lib/summit-pricing";

type PayPalAccessTokenResponse = {
  access_token?: string;
};

type PayPalOrderResponse = {
  id?: string;
  links?: Array<{
    href: string;
    rel: string;
  }>;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<PayPalCapturePayment>;
    };
  }>;
  status?: string;
};

type PayPalCapturePayment = {
  amount?: {
    currency_code?: string;
    value?: string;
  };
  id?: string;
  status?: string;
};

export type PayPalCaptureResponse = {
  id?: string;
  payer?: {
    email_address?: string;
  };
  purchase_units?: Array<{
    payments?: {
      captures?: Array<PayPalCapturePayment>;
    };
  }>;
  status?: string;
};

type PayPalErrorBody = {
  details?: Array<{
    description?: string;
    issue?: string;
  }>;
  message?: string;
  name?: string;
};

export class PayPalApiError extends Error {
  constructor(
    message: string,
    readonly details: {
      body?: string;
      debugId?: string;
      status: number;
    },
  ) {
    super(message);
    this.name = "PayPalApiError";
  }
}

export function hasPayPalConfig() {
  const credentials = paypalCredentials();
  return Boolean(credentials.clientId && credentials.clientSecret);
}

export function getPayPalWebhookId() {
  const environment = paypalEnvironment();

  if (environment === "live") {
    return process.env.PAYPAL_WEBHOOK_ID || "";
  }

  return process.env.PAYPAL_SANDBOX_WEBHOOK_ID || "";
}

export function hasPayPalWebhookConfig() {
  return Boolean(getPayPalWebhookId());
}

export function paypalRuntimeDiagnostics() {
  const environment = paypalEnvironment();
  const baseUrl = paypalBaseUrl();
  const credentials = paypalCredentials();
  const isLiveMode = environment === "live";

  return {
    apiHost: safeHost(baseUrl),
    environment: environment || "[default-sandbox]",
    hasBaseUrlOverride: Boolean(process.env.PAYPAL_BASE_URL),
    hasClientId: Boolean(credentials.clientId),
    hasClientSecret: Boolean(credentials.clientSecret),
    hasSandboxClientId: Boolean(process.env.PAYPAL_SANDBOX_CLIENT_ID),
    hasSandboxSecret:
      Boolean(process.env.PAYPAL_SANDBOX_CLIENT_SECRET) || Boolean(process.env.PAYPAL_SANDBOX_SECRET_KEY),
    hasSandboxWebhookId: Boolean(process.env.PAYPAL_SANDBOX_WEBHOOK_ID),
    hasLiveWebhookId: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    usingSandboxCredentialFamily: !isLiveMode,
  };
}

export function paypalErrorDetails(error: PayPalApiError | null | undefined) {
  if (!error?.details.body) {
    return null;
  }

  try {
    const parsed = JSON.parse(error.details.body) as PayPalErrorBody;
    const issue = parsed.details?.find((detail) => typeof detail.issue === "string")?.issue;
    const description = parsed.details?.find((detail) => typeof detail.description === "string")?.description;

    return {
      debugId: error.details.debugId,
      description,
      issue,
      message: parsed.message,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

export function captureOutcomeSummary(capture: PayPalCaptureResponse) {
  const captures = capture.purchase_units?.flatMap((unit) => unit.payments?.captures ?? []) ?? [];
  const payment = captures.find((item) => item.id || item.status);

  return {
    captureId: payment?.id,
    captureStatus: payment?.status ?? (captures.length > 0 ? capture.status ?? "" : ""),
    orderStatus: capture.status ?? "",
  };
}

export function isPayPalFundingDeclined(error: PayPalApiError | null | undefined) {
  const details = paypalErrorDetails(error);
  const code = details?.issue ?? details?.name ?? "";

  return ["INSTRUMENT_DECLINED", "PAYER_ACTION_REQUIRED"].includes(code.toUpperCase());
}

export async function createPayPalOrder({
  pricing,
  registrationId,
  requestId,
  requestOrigin,
}: {
  pricing: SummitPriceSummary;
  registrationId: string;
  requestId?: string;
  requestOrigin: string;
}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": requestId ?? `summit-create-${registrationId}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: pricing.total.toFixed(2),
          },
          custom_id: registrationId,
          description: "Human Capacity Summit registration",
        },
      ],
      application_context: {
        brand_name: "Francois Consulting Group",
        landing_page: "LOGIN",
        return_url: `${requestOrigin}/api/human-capacity-summit/paypal/capture?registrationId=${registrationId}`,
        cancel_url: `${requestOrigin}/api/human-capacity-summit/paypal/cancel?registrationId=${registrationId}`,
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new PayPalApiError(`PayPal order creation failed with status ${response.status}`, {
      body,
      debugId: paypalDebugId(body),
      status: response.status,
    });
  }

  const order = (await response.json()) as PayPalOrderResponse;
  const approvalUrl = order.links?.find((link) => link.rel === "approve")?.href;

  if (!order.id || !approvalUrl) {
    throw new Error("PayPal did not return an approval URL.");
  }

  return { approvalUrl, orderId: order.id };
}

export async function capturePayPalOrder(paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `summit-capture-${paypalOrderId}`,
    },
  });

  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new PayPalApiError(`PayPal capture failed with status ${response.status}`, {
      body,
      debugId: paypalDebugId(body),
      status: response.status,
    });
  }

  return (await response.json()) as PayPalCaptureResponse;
}

export async function getPayPalOrder(paypalOrderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await safeResponseText(response);
    throw new PayPalApiError(`PayPal order lookup failed with status ${response.status}`, {
      body,
      debugId: paypalDebugId(body),
      status: response.status,
    });
  }

  return (await response.json()) as PayPalCaptureResponse;
}

export function verifiedCaptureTotal(capture: PayPalCaptureResponse) {
  const capturedPayment = capture.purchase_units
    ?.flatMap((unit) => unit.payments?.captures ?? [])
    .find((payment) => payment.status === "COMPLETED");

  if (!capturedPayment?.amount || !capturedPayment.id) {
    return null;
  }

  return {
    captureId: capturedPayment.id,
    currency: capturedPayment.amount.currency_code ?? "",
    value: Number.parseFloat(capturedPayment.amount.value ?? ""),
  };
}

export function capturePaymentSummary(capture: PayPalCaptureResponse) {
  const capturedPayment = capture.purchase_units
    ?.flatMap((unit) => unit.payments?.captures ?? [])
    .find((payment) => payment.id || payment.status);

  if (!capturedPayment) {
    return null;
  }

  return {
    captureId: capturedPayment.id,
    currency: capturedPayment.amount?.currency_code ?? "",
    status: capturedPayment.status ?? capture.status ?? "",
    value: Number.parseFloat(capturedPayment.amount?.value ?? ""),
  };
}

export async function verifyPayPalWebhookSignature({
  body,
  headers,
}: {
  body: unknown;
  headers: Headers;
}) {
  const webhookId = getPayPalWebhookId();
  if (!webhookId) {
    return false;
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_event: body,
      webhook_id: webhookId,
    }),
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { verification_status?: string };
  return result.verification_status === "SUCCESS";
}

async function getPayPalAccessToken() {
  const { clientId, clientSecret } = paypalCredentials();

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials are not configured.");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new PayPalApiError(`PayPal token request failed with status ${response.status}`, {
      body: await safeResponseText(response),
      status: response.status,
    });
  }

  const token = (await response.json()) as PayPalAccessTokenResponse;
  if (!token.access_token) {
    throw new Error("PayPal token response did not include an access token.");
  }

  return token.access_token;
}

async function safeResponseText(response: Response) {
  try {
    return (await response.text()).slice(0, 1200);
  } catch {
    return undefined;
  }
}

export function paypalDebugId(body?: string) {
  if (!body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(body) as { debug_id?: unknown };
    return typeof parsed.debug_id === "string" ? parsed.debug_id : undefined;
  } catch {
    return undefined;
  }
}

function paypalBaseUrl() {
  if (process.env.PAYPAL_BASE_URL) {
    return process.env.PAYPAL_BASE_URL;
  }

  const environment = paypalEnvironment();

  return environment === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return "[invalid-url]";
  }
}

function paypalCredentials() {
  const environment = paypalEnvironment();
  const isSandbox = environment !== "live";

  return {
    clientId: isSandbox
      ? process.env.PAYPAL_SANDBOX_CLIENT_ID || process.env.PAYPAL_CLIENT_ID
      : process.env.PAYPAL_CLIENT_ID,
    clientSecret: isSandbox
      ? process.env.PAYPAL_SANDBOX_CLIENT_SECRET ||
        process.env.PAYPAL_SANDBOX_SECRET_KEY ||
        process.env.PAYPAL_CLIENT_SECRET
      : process.env.PAYPAL_CLIENT_SECRET,
  };
}

function paypalEnvironment() {
  return process.env.PAYPAL_ENVIRONMENT ?? process.env.PAYPAL_ENV ?? "sandbox";
}
