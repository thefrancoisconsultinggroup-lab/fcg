import { NextResponse } from "next/server";
import { createPayPalOrder, hasPayPalConfig, PayPalApiError, paypalRuntimeDiagnostics } from "@/lib/paypal";
import { reconcileSummitPayment } from "@/lib/summit-payment-completion";
import { canRetryPayment, customerPaymentStatus } from "@/lib/summit-payment-customer-status";
import {
  getSummitPaymentRecordById,
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { registrationId?: unknown } | null;
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId : "";
  const record = registrationId ? await getSummitPaymentRecordById(registrationId) : null;

  if (!record) {
    return NextResponse.json({ message: "Registration could not be found." }, { status: 404 });
  }

  if (isSummitPaymentCaptured(record)) {
    return NextResponse.json(
      {
        message: "This registration is already paid.",
        status: customerPaymentStatus(record),
      },
      { status: 409 },
    );
  }

  if (!canRetryPayment(record.status)) {
    await reconcileSummitPayment(record);
    const refreshed = (await getSummitPaymentRecordById(registrationId)) ?? record;

    if (!canRetryPayment(refreshed.status)) {
      return NextResponse.json(
        {
          message: customerPaymentStatus(refreshed).message,
          status: customerPaymentStatus(refreshed),
        },
        { status: 409 },
      );
    }
  }

  const retryableRecord = (await getSummitPaymentRecordById(registrationId)) ?? record;

  if (!hasPayPalConfig()) {
    return NextResponse.json(
      {
        message:
          "PayPal checkout is not configured yet. Please contact Francois Consulting Group directly to reserve your place.",
      },
      { status: 503 },
    );
  }

  const requestOrigin = new URL(request.url).origin;

  try {
    const order = await createPayPalOrder({
      pricing: retryableRecord.pricing,
      registrationId: retryableRecord.id,
      requestId: `summit-retry-${retryableRecord.id}-${Date.now()}`,
      requestOrigin,
    });

    await updateSummitPaymentRecord(retryableRecord.id, {
      captureId: undefined,
      capturedAt: undefined,
      lastPaymentDiagnostics: undefined,
      lastPaymentErrorAt: undefined,
      lastPaymentErrorCode: undefined,
      lastPaymentErrorMessage: undefined,
      manualReviewReason: undefined,
      payerEmail: undefined,
      paypalOrderHistory: [
        ...(retryableRecord.paypalOrderHistory ?? []),
        {
          failureCode: retryableRecord.lastPaymentErrorCode,
          failureReason: retryableRecord.lastPaymentErrorMessage,
          orderId: retryableRecord.paypalOrderId,
          recordedAt: new Date().toISOString(),
          status: retryableRecord.status,
        },
      ],
      paypalOrderId: order.orderId,
      status: "pending_approval",
    });

    return NextResponse.json({
      approvalUrl: order.approvalUrl,
      orderId: order.orderId,
      registrationId: retryableRecord.id,
    });
  } catch (error) {
    console.error("PayPal retry order creation failed for Summit registration.", {
      debugId: error instanceof PayPalApiError ? error.details.debugId : undefined,
      error: error instanceof Error ? error.message : "Unknown error",
      paypalRuntime: paypalRuntimeDiagnostics(),
      registrationId: redactId(registrationId),
    });

    await updateSummitPaymentRecord(retryableRecord.id, {
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: error instanceof PayPalApiError ? error.details.debugId : "PAYPAL_RETRY_ORDER_FAILED",
      lastPaymentErrorMessage: "We couldn't start PayPal checkout. Please try again.",
      status: "retry_ready",
    });

    return NextResponse.json(
      {
        message: "We couldn't start PayPal checkout. Please try again.",
      },
      { status: 502 },
    );
  }
}

function redactId(value: string) {
  return value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "[redacted]";
}
