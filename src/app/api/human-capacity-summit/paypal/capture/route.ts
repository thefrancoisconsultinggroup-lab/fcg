import { NextResponse } from "next/server";
import { completeSummitPayment } from "@/lib/summit-payment-completion";
import { capturePayPalOrder, PayPalApiError, verifiedCaptureTotal } from "@/lib/paypal";
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
  const thankYouUrl = `${redirectBase}/thank-you`;

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
      `${thankYouUrl}?registration=${record.id}`,
    );
  }

  try {
    await updateSummitPaymentRecord(record.id, { status: "approved" });
    let capture: Awaited<ReturnType<typeof capturePayPalOrder>>;

    try {
      capture = await capturePayPalOrder(paypalOrderId);
    } catch (error) {
      console.error("PayPal capture API failed for approved Summit order.", {
        body: error instanceof PayPalApiError ? error.details.body : undefined,
        error: error instanceof Error ? error.message : "Unknown error",
        paypalOrderId: redactId(paypalOrderId),
        status: error instanceof PayPalApiError ? error.details.status : undefined,
      });
      return NextResponse.redirect(`${redirectBase}?payment=processing#summit-registration`);
    }

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

    return NextResponse.redirect(`${thankYouUrl}?registration=${record.id}`);
  } catch (error) {
    console.error("Summit capture route failed after PayPal approval.", {
      error: error instanceof Error ? error.message : "Unknown error",
      paypalOrderId: redactId(paypalOrderId),
      registrationId: redactId(registrationId),
    });
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }
}

function redactId(value: string) {
  return value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "[redacted]";
}
