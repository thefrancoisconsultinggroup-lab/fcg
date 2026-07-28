import type { SummitPaymentRecord } from "@/lib/summit-registration-records";
import {
  claimSummitPaymentEmailSend,
  isSummitPaymentCaptured,
  markSummitPaymentEmailSent,
  recordSummitPaymentEmailFailure,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";
import {
  capturePaymentSummary,
  getPayPalOrder,
  PayPalApiError,
  verifiedCaptureTotal,
} from "@/lib/paypal";
import {
  sendSummitAdminNotificationEmail,
  sendSummitAttendeeConfirmationEmail,
  type SummitEmailResult,
} from "@/lib/summit-registration-email";

export type CompletedCaptureInput = {
  captureId?: string;
  currency?: string;
  orderId?: string;
  payerEmail?: string;
  status?: string;
  value?: number;
};

export type CompletionResult =
  | { ok: true; duplicate: boolean; emails: SummitEmailResult }
  | { ok: false; reason: "already_paid_different_capture" | "invalid_capture" };

export type ReconciliationResult =
  | { ok: true; status: "paid"; completed: CompletionResult }
  | { ok: true; status: "pending" | "verification_required" | "declined" | "payment_failed" }
  | { ok: false; status: "manual_review"; reason: string };

export function validateCompletedCaptureForRecord(
  record: SummitPaymentRecord,
  capture: CompletedCaptureInput,
) {
  if (
    !capture.captureId ||
    capture.orderId !== record.paypalOrderId ||
    capture.status !== "COMPLETED" ||
    capture.currency !== "USD" ||
    !amountsMatch(capture.value, record.pricing.total)
  ) {
    return false;
  }

  return true;
}

export async function completeSummitPayment({
  capture,
  record,
}: {
  capture: CompletedCaptureInput;
  record: SummitPaymentRecord;
}): Promise<CompletionResult> {
  if (!validateCompletedCaptureForRecord(record, capture)) {
    return { ok: false, reason: "invalid_capture" };
  }

  if (isSummitPaymentCaptured(record)) {
    if (record.captureId !== capture.captureId) {
      return { ok: false, reason: "already_paid_different_capture" };
    }

    const retryEmails = await sendPendingSummitPaymentEmails(record);
    return { ok: true, duplicate: true, emails: retryEmails };
  }

  const captureId = capture.captureId;
  if (!captureId) {
    return { ok: false, reason: "invalid_capture" };
  }

  const updatedRecord = await updateSummitPaymentRecord(record.id, {
    captureId,
    capturedAt: new Date().toISOString(),
    payerEmail: capture.payerEmail,
    status: "paid",
  });

  if (!updatedRecord) {
    return { ok: false, reason: "invalid_capture" };
  }

  const emails = await sendPendingSummitPaymentEmails(updatedRecord);
  return { ok: true, duplicate: false, emails };
}

export async function reconcileSummitPayment(record: SummitPaymentRecord): Promise<ReconciliationResult> {
  if (isSummitPaymentCaptured(record)) {
    const completed = await completeSummitPayment({
      record,
      capture: {
        captureId: record.captureId,
        currency: "USD",
        orderId: record.paypalOrderId,
        payerEmail: record.payerEmail,
        status: "COMPLETED",
        value: record.pricing.total,
      },
    });
    return { ok: true, status: "paid", completed };
  }

  let order: Awaited<ReturnType<typeof getPayPalOrder>>;

  try {
    order = await getPayPalOrder(record.paypalOrderId);
  } catch (error) {
    await updateSummitPaymentRecord(record.id, {
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: error instanceof PayPalApiError ? error.details.debugId : "PAYPAL_ORDER_LOOKUP_FAILED",
      lastPaymentErrorMessage: "PayPal order status could not be verified.",
      manualReviewReason: "PayPal order status lookup failed after an uncertain payment outcome.",
      status: "manual_review",
    });
    return { ok: false, status: "manual_review", reason: "paypal_lookup_failed" };
  }

  const completedCapture = verifiedCaptureTotal(order);
  if (completedCapture) {
    const completed = await completeSummitPayment({
      record,
      capture: {
        captureId: completedCapture.captureId,
        currency: completedCapture.currency,
        orderId: record.paypalOrderId,
        payerEmail: order.payer?.email_address,
        status: "COMPLETED",
        value: completedCapture.value,
      },
    });

    if (completed.ok) {
      return { ok: true, status: "paid", completed };
    }

    await updateSummitPaymentRecord(record.id, {
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: completed.reason,
      lastPaymentErrorMessage: "PayPal completed capture did not match the stored Summit registration.",
      manualReviewReason: "PayPal completed capture could not be matched safely.",
      status: "manual_review",
    });
    return { ok: false, status: "manual_review", reason: completed.reason };
  }

  const summary = capturePaymentSummary(order);
  const status = summary?.status || order.status || "";
  const diagnostics = {
    captureHttpStatus: 200,
    captureId: summary?.captureId,
    finalCaptureStatus: summary?.status || undefined,
    finalOrderStatus: order.status || undefined,
    paypalOrderId: record.paypalOrderId,
    recordedAt: new Date().toISOString(),
    source: "capture_response" as const,
  };

  if (isPendingPayPalStatus(status)) {
    await updateSummitPaymentRecord(record.id, {
      lastPaymentDiagnostics: diagnostics,
      lastPaymentErrorAt: undefined,
      lastPaymentErrorCode: undefined,
      lastPaymentErrorMessage: undefined,
      status: "payment_processing",
    });
    return { ok: true, status: "pending" };
  }

  if (isDeclinedPayPalStatus(status)) {
    await updateSummitPaymentRecord(record.id, {
      lastPaymentDiagnostics: diagnostics,
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: status,
      lastPaymentErrorMessage: "PayPal could not complete the payment.",
      status: "declined",
    });
    return { ok: true, status: "declined" };
  }

  if (isFailedPayPalStatus(status)) {
    await updateSummitPaymentRecord(record.id, {
      lastPaymentDiagnostics: diagnostics,
      lastPaymentErrorAt: new Date().toISOString(),
      lastPaymentErrorCode: status || "PAYPAL_CAPTURE_FAILED",
      lastPaymentErrorMessage: "PayPal reported that the payment was not completed.",
      status: "payment_failed",
    });
    return { ok: true, status: "payment_failed" };
  }

  await updateSummitPaymentRecord(record.id, {
    lastPaymentDiagnostics: diagnostics,
    lastPaymentErrorAt: new Date().toISOString(),
    lastPaymentErrorCode: status || "PAYPAL_STATUS_UNCERTAIN",
    lastPaymentErrorMessage: "PayPal payment status is still being verified.",
    status: "verification_required",
  });
  return { ok: true, status: "verification_required" };
}

function amountsMatch(received: number | undefined, expected: number) {
  return typeof received === "number" && Number.isFinite(received) && Math.abs(received - expected) < 0.005;
}

export function isPendingPayPalStatus(status: string) {
  return ["PENDING", "PROCESSING"].includes(status.toUpperCase());
}

export function isDeclinedPayPalStatus(status: string) {
  return ["DENIED", "DECLINED"].includes(status.toUpperCase());
}

export function isFailedPayPalStatus(status: string) {
  return ["FAILED", "VOIDED", "REVERSED"].includes(status.toUpperCase());
}

export async function sendPendingSummitPaymentEmails(record: SummitPaymentRecord): Promise<SummitEmailResult> {
  const result: SummitEmailResult = {
    adminNotification: Boolean(record.adminNotificationSentAt || record.emailSentAt),
    attendeeConfirmation: Boolean(record.attendeeConfirmationSentAt || record.emailSentAt),
  };

  if (!result.attendeeConfirmation) {
    const claimed = await claimSummitPaymentEmailSend(record.id, "attendeeConfirmation");

    if (claimed) {
      try {
        const email = await sendSummitAttendeeConfirmationEmail(record);

        if (email.ok) {
          await markSummitPaymentEmailSent(record.id, "attendeeConfirmation");
          result.attendeeConfirmation = true;
        } else {
          await recordSummitPaymentEmailFailure(record.id, "attendeeConfirmation", email.message);
        }
      } catch (error) {
        await recordSummitPaymentEmailFailure(
          record.id,
          "attendeeConfirmation",
          error instanceof Error ? error.message : "Attendee confirmation email failed.",
        );
      }
    }
  }

  if (!result.adminNotification) {
    const claimed = await claimSummitPaymentEmailSend(record.id, "adminNotification");

    if (claimed) {
      try {
        const email = await sendSummitAdminNotificationEmail(record);

        if (email.ok) {
          await markSummitPaymentEmailSent(record.id, "adminNotification");
          result.adminNotification = true;
        } else {
          await recordSummitPaymentEmailFailure(record.id, "adminNotification", email.message);
        }
      } catch (error) {
        await recordSummitPaymentEmailFailure(
          record.id,
          "adminNotification",
          error instanceof Error ? error.message : "Admin notification email failed.",
        );
      }
    }
  }

  return result;
}
