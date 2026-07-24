import { NextResponse } from "next/server";
import { capturePayPalOrder, verifiedCaptureTotal } from "@/lib/paypal";
import { sendSummitRegistrationEmails } from "@/lib/summit-registration-email";
import {
  getSummitPaymentRecordById,
  getSummitPaymentRecordByOrderId,
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paypalOrderId = url.searchParams.get("token") || "";
  const registrationId = url.searchParams.get("registrationId") || "";
  const redirectBase = `${url.origin}/human-capacity-summit`;

  if (!paypalOrderId || !registrationId) {
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }

  const record =
    (await getSummitPaymentRecordById(registrationId)) ??
    (await getSummitPaymentRecordByOrderId(paypalOrderId));

  if (!record || record.paypalOrderId !== paypalOrderId) {
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }

  if (isSummitPaymentCaptured(record)) {
    return NextResponse.redirect(
      `${redirectBase}?payment=success&registration=${record.id}#summit-registration`,
    );
  }

  try {
    await updateSummitPaymentRecord(record.id, { status: "approved" });
    const capture = await capturePayPalOrder(paypalOrderId);
    const verified = verifiedCaptureTotal(capture);

    if (
      capture.status !== "COMPLETED" ||
      !verified ||
      verified.currency !== "USD" ||
      verified.value !== record.pricing.total
    ) {
      await updateSummitPaymentRecord(record.id, { status: "failed" });
      return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
    }

    const updatedRecord = await updateSummitPaymentRecord(record.id, {
      captureId: verified.captureId,
      capturedAt: new Date().toISOString(),
      payerEmail: capture.payer?.email_address,
      status: "paid",
    });

    if (updatedRecord) {
      await sendSummitRegistrationEmails({
        captureId: verified.captureId,
        paypalOrderId,
        pricing: updatedRecord.pricing,
        registration: updatedRecord.registration,
      });
    }

    return NextResponse.redirect(
      `${redirectBase}?payment=success&registration=${record.id}#summit-registration`,
    );
  } catch {
    await updateSummitPaymentRecord(record.id, { status: "failed" });
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }
}
