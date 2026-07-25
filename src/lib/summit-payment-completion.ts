import type { SummitPaymentRecord } from "@/lib/summit-registration-records";
import {
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";
import { sendSummitRegistrationEmails } from "@/lib/summit-registration-email";

export type CompletedCaptureInput = {
  captureId?: string;
  currency?: string;
  orderId?: string;
  payerEmail?: string;
  status?: string;
  value?: number;
};

export type CompletionResult =
  | { ok: true; duplicate: boolean; emailSent: boolean }
  | { ok: false; reason: "already_paid_different_capture" | "invalid_capture" };

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

    return { ok: true, duplicate: true, emailSent: Boolean(record.emailSentAt) };
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

  if (!updatedRecord.emailSentAt) {
    const emailResult = await sendSummitRegistrationEmails({
      captureId,
      paypalOrderId: record.paypalOrderId,
      pricing: updatedRecord.pricing,
      registration: updatedRecord.registration,
    });

    if (emailResult.ok) {
      await updateSummitPaymentRecord(record.id, { emailSentAt: new Date().toISOString() });
      return { ok: true, duplicate: false, emailSent: true };
    }
  }

  return { ok: true, duplicate: false, emailSent: Boolean(updatedRecord.emailSentAt) };
}

function amountsMatch(received: number | undefined, expected: number) {
  return typeof received === "number" && Number.isFinite(received) && Math.abs(received - expected) < 0.005;
}
