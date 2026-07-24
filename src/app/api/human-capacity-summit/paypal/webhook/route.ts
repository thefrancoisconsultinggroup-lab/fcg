import { NextResponse } from "next/server";
import { hasPayPalWebhookConfig, verifyPayPalWebhookSignature } from "@/lib/paypal";
import {
  getSummitPaymentRecordByOrderId,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

type PayPalWebhookEvent = {
  event_type?: string;
  resource?: {
    custom_id?: string;
    id?: string;
    status?: string;
    supplementary_data?: {
      related_ids?: {
        order_id?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const event = (await request.json().catch(() => null)) as PayPalWebhookEvent | null;

  if (!event) {
    return NextResponse.json({ message: "Invalid webhook payload." }, { status: 400 });
  }

  if (!hasPayPalWebhookConfig()) {
    console.warn(
      "PayPal webhook processing is disabled because PAYPAL_WEBHOOK_ID is not configured.",
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

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    await updateSummitPaymentRecord(record.id, {
      captureId: event.resource?.id,
      capturedAt: new Date().toISOString(),
      status: "paid",
    });
  }

  if (
    event.event_type === "PAYMENT.CAPTURE.DENIED" ||
    event.event_type === "PAYMENT.CAPTURE.DECLINED"
  ) {
    await updateSummitPaymentRecord(record.id, { status: "failed" });
  }

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
    await updateSummitPaymentRecord(record.id, { status: "refunded" });
  }

  return NextResponse.json({ received: true });
}
