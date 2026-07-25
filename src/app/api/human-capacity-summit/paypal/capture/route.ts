import { NextResponse } from "next/server";
import { completeSummitPayment } from "@/lib/summit-payment-completion";
import { capturePayPalOrder, verifiedCaptureTotal } from "@/lib/paypal";
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
      verified.currency !== "USD"
    ) {
      await updateSummitPaymentRecord(record.id, { status: "failed" });
      return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
    }

    const completion = await completeSummitPayment({
      record,
      capture: {
        captureId: verified.captureId,
        currency: verified.currency,
        orderId: paypalOrderId,
        payerEmail: capture.payer?.email_address,
        status: capture.status,
        value: verified.value,
      },
    });

    if (!completion.ok) {
      await updateSummitPaymentRecord(record.id, { status: "failed" });
      return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
    }

    return NextResponse.redirect(
      `${redirectBase}?payment=success&registration=${record.id}#summit-registration`,
    );
  } catch {
    await updateSummitPaymentRecord(record.id, { status: "failed" });
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }
}
