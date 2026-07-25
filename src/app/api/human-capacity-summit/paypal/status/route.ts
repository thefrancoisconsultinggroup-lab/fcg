import { NextResponse } from "next/server";
import { reconcileSummitPayment, sendPendingSummitPaymentEmails } from "@/lib/summit-payment-completion";
import { customerPaymentStatus } from "@/lib/summit-payment-customer-status";
import type { SummitPaymentRecord } from "@/lib/summit-registration-records";
import { getSummitPaymentRecordById, isSummitPaymentCaptured } from "@/lib/summit-registration-records";

export async function GET(request: Request) {
  const registrationId = new URL(request.url).searchParams.get("registrationId") || "";
  const record = registrationId ? await getSummitPaymentRecordById(registrationId) : null;

  if (!record) {
    return NextResponse.json({
      action: "none",
      message: "",
      state: "idle",
    });
  }

  if (isSummitPaymentCaptured(record) && shouldRetryPaidEmails(record)) {
    await sendPendingSummitPaymentEmails(record);
  }

  const refreshed = await getSummitPaymentRecordById(registrationId);
  return NextResponse.json(customerPaymentStatus(refreshed ?? record));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { registrationId?: unknown } | null;
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId : "";
  const record = registrationId ? await getSummitPaymentRecordById(registrationId) : null;

  if (!record) {
    return NextResponse.json({ message: "Registration could not be found." }, { status: 404 });
  }

  if (isSummitPaymentCaptured(record) && shouldRetryPaidEmails(record)) {
    await sendPendingSummitPaymentEmails(record);
  } else if (
    record.status === "payment_processing" ||
    record.status === "capture_pending" ||
    record.status === "verification_required" ||
    record.status === "approved" ||
    record.status === "approval_pending" ||
    record.status === "pending_approval" ||
    record.status === "pending" ||
    record.status === "manual_review"
  ) {
    await reconcileSummitPayment(record);
  }

  const refreshed = await getSummitPaymentRecordById(registrationId);
  return NextResponse.json(customerPaymentStatus(refreshed ?? record));
}

function shouldRetryPaidEmails(record: SummitPaymentRecord) {
  return !record.attendeeConfirmationSentAt || !record.adminNotificationSentAt;
}
