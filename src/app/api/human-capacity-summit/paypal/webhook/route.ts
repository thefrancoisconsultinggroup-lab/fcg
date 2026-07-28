import { NextResponse } from "next/server";
import { completeSummitPayment } from "@/lib/summit-payment-completion";
import { hasPayPalWebhookConfig, verifyPayPalWebhookSignature } from "@/lib/paypal";
import {
  getSummitPaymentRecordByOrderId,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

type PayPalWebhookEvent = {
  id?: string;
  summary?: string;
  event_type?: string;
  resource?: {
    amount?: {
      currency_code?: string;
      value?: string;
    };
    custom_id?: string;
    id?: string;
    payer?: {
      email_address?: string;
    };
    status?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

const supportedEvents = new Set([
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.DECLINED",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
]);

export async function POST(request: Request) {
  const event = (await request.json().catch(() => null)) as PayPalWebhookEvent | null;

  if (!event) {
    return NextResponse.json({ message: "Invalid webhook payload." }, { status: 400 });
  }

  if (!hasPayPalWebhookConfig()) {
    console.warn(
      "PayPal webhook processing is disabled because the configured PayPal webhook ID is not set for this environment.",
    );
    return NextResponse.json(
      {
        disabled: true,
        message: "PayPal webhook processing is disabled for this environment.",
        received: true,
      },
      { status: 202 },
    );
  }

  const verified = await verifyPayPalWebhookSignature({
    body: event,
    headers: request.headers,
  });

  if (!verified) {
    return NextResponse.json({ message: "Webhook signature verification failed." }, { status: 401 });
  }

  if (!event.event_type || !supportedEvents.has(event.event_type)) {
    return NextResponse.json({ ignored: true, received: true });
  }

  const orderId =
    event.resource?.supplementary_data?.related_ids?.order_id ??
    event.resource?.id ??
    "";

  const record = orderId ? await getSummitPaymentRecordByOrderId(orderId) : null;
  if (!record) {
    return NextResponse.json({ received: true });
  }

  if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
    await updateSummitPaymentRecord(record.id, { status: "approved" });
  }

  if (event.event_type === "PAYMENT.CAPTURE.PENDING") {
    await updateSummitPaymentRecord(record.id, { status: "payment_processing" });
  }

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const completion = await completeSummitPayment({
      record,
      capture: {
        captureId: event.resource?.id,
        currency: event.resource?.amount?.currency_code,
        orderId,
        payerEmail: event.resource?.payer?.email_address,
        status: event.resource?.status,
        value: Number.parseFloat(event.resource?.amount?.value ?? ""),
      },
    });

    if (!completion.ok) {
      console.warn("Rejected PayPal completed-capture webhook because payment details did not match the stored registration.");
      return NextResponse.json({ message: "Webhook payment details did not match." }, { status: 422 });
    }
  }

  if (
    event.event_type === "CHECKOUT.PAYMENT-APPROVAL.REVERSED" ||
    event.event_type === "PAYMENT.CAPTURE.REVERSED"
  ) {
    await updateSummitPaymentRecord(record.id, {
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: event.event_type,
      lastPaymentErrorMessage: "PayPal reported a reversed payment event.",
      manualReviewReason: "PayPal reported a payment reversal after checkout.",
      status: "reversed",
    });
  }

  if (
    event.event_type === "PAYMENT.CAPTURE.DENIED" ||
    event.event_type === "PAYMENT.CAPTURE.DECLINED"
  ) {
    const diagnostics = {
      captureId: event.resource?.id,
      finalCaptureStatus: event.resource?.status,
      paypalOrderId: orderId,
      recordedAt: new Date().toISOString(),
      source: "capture_webhook" as const,
      webhookEventId: event.id,
      webhookEventType: event.event_type,
      webhookSummary: event.summary,
    };

    console.warn("PayPal capture declined webhook received for Summit registration.", {
      diagnostics,
      paypalOrderId: orderId ? `${orderId.slice(0, 4)}...${orderId.slice(-4)}` : "[redacted]",
      registrationId: `${record.id.slice(0, 4)}...${record.id.slice(-4)}`,
    });

    await updateSummitPaymentRecord(record.id, {
      lastPaymentDiagnostics: diagnostics,
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: event.event_type,
      lastPaymentErrorMessage: "PayPal could not complete the payment.",
      status: "declined",
    });
  }

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    await updateSummitPaymentRecord(record.id, {
      manualReviewReason: "PayPal reported a refund for this registration payment.",
      status: "refunded",
    });
  }

  return NextResponse.json({ received: true });
}
