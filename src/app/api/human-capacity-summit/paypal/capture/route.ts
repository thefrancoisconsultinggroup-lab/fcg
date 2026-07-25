import { NextResponse } from "next/server";
import {
  completeSummitPayment,
  isDeclinedPayPalStatus,
  isFailedPayPalStatus,
  isPendingPayPalStatus,
  reconcileSummitPayment,
} from "@/lib/summit-payment-completion";
import {
  capturePayPalOrder,
  capturePaymentSummary,
  isPayPalFundingDeclined,
  PayPalApiError,
  paypalRuntimeDiagnostics,
  verifiedCaptureTotal,
} from "@/lib/paypal";
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
    await completeSummitPayment({
      record,
      capture: {
        captureId: record.captureId,
        currency: "USD",
        orderId: paypalOrderId,
        payerEmail: record.payerEmail,
        status: "COMPLETED",
        value: record.pricing.total,
      },
    });
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
      if (error instanceof PayPalApiError && isPayPalFundingDeclined(error)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: "INSTRUMENT_DECLINED",
          lastPaymentErrorMessage: "PayPal could not complete the payment with the selected funding source.",
          status: "declined",
        });
        return NextResponse.redirect(`${redirectBase}?payment=declined&registration=${record.id}#summit-registration`);
      }

      console.error("PayPal capture API failed for approved Summit order.", {
        body: error instanceof PayPalApiError ? error.details.body : undefined,
        error: error instanceof Error ? error.message : "Unknown error",
        paypalOrderId: redactId(paypalOrderId),
        paypalRuntime: paypalRuntimeDiagnostics(),
        status: error instanceof PayPalApiError ? error.details.status : undefined,
      });
      const reconciliation = await reconcileSummitPayment(record);
      return NextResponse.redirect(
        `${redirectBase}?payment=${paymentParamForReconciliation(reconciliation)}&registration=${record.id}#summit-registration`,
      );
    }

    const verified = verifiedCaptureTotal(capture);

    if (
      capture.status !== "COMPLETED" ||
      !verified
    ) {
      const summary = capturePaymentSummary(capture);
      const status = summary?.status || capture.status || "";

      if (isPendingPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, { status: "payment_processing" });
        return NextResponse.redirect(`${redirectBase}?payment=pending&registration=${record.id}#summit-registration`);
      }

      if (isDeclinedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status,
          lastPaymentErrorMessage: "PayPal could not complete the payment.",
          status: "declined",
        });
        return NextResponse.redirect(`${redirectBase}?payment=declined&registration=${record.id}#summit-registration`);
      }

      if (isFailedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status || "PAYPAL_CAPTURE_FAILED",
          lastPaymentErrorMessage: "PayPal reported that the payment was not completed.",
          status: "payment_failed",
        });
        return NextResponse.redirect(`${redirectBase}?payment=failed&registration=${record.id}#summit-registration`);
      }

      await updateSummitPaymentRecord(record.id, {
        lastPaymentErrorAt: new Date().toISOString(),
        lastPaymentErrorCode: status || "PAYPAL_CAPTURE_UNVERIFIED",
        lastPaymentErrorMessage: "PayPal capture could not be verified.",
        status: "verification_required",
      });
      return NextResponse.redirect(`${redirectBase}?payment=verification_required&registration=${record.id}#summit-registration`);
    }

    if (verified.currency !== "USD") {
      await updateSummitPaymentRecord(record.id, {
        lastPaymentErrorAt: new Date().toISOString(),
        lastPaymentErrorCode: "PAYPAL_CURRENCY_MISMATCH",
        lastPaymentErrorMessage: "PayPal capture currency did not match the expected Summit registration currency.",
        manualReviewReason: "PayPal capture returned an unexpected currency.",
        status: "manual_review",
      });
      return NextResponse.redirect(`${redirectBase}?payment=manual_review&registration=${record.id}#summit-registration`);
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
      await updateSummitPaymentRecord(record.id, {
        lastPaymentErrorAt: new Date().toISOString(),
        lastPaymentErrorCode: completion.reason,
        lastPaymentErrorMessage: "PayPal capture did not match the stored Summit registration.",
        manualReviewReason: "PayPal completed capture failed Summit registration verification.",
        status: "manual_review",
      });
      return NextResponse.redirect(`${redirectBase}?payment=manual_review&registration=${record.id}#summit-registration`);
    }

    return NextResponse.redirect(`${thankYouUrl}?registration=${record.id}`);
  } catch (error) {
    console.error("Summit capture route failed after PayPal approval.", {
      error: error instanceof Error ? error.message : "Unknown error",
      paypalOrderId: redactId(paypalOrderId),
      paypalRuntime: paypalRuntimeDiagnostics(),
      registrationId: redactId(registrationId),
    });
    if (record) {
      await updateSummitPaymentRecord(record.id, {
        lastPaymentErrorAt: new Date().toISOString(),
        lastPaymentErrorCode: "CAPTURE_HANDLER_ERROR",
        lastPaymentErrorMessage: "Payment capture result could not be verified.",
        status: "verification_required",
      });
      return NextResponse.redirect(`${redirectBase}?payment=verification_required&registration=${record.id}#summit-registration`);
    }
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }
}

function redactId(value: string) {
  return value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-4)}` : "[redacted]";
}

function paymentParamForReconciliation(result: Awaited<ReturnType<typeof reconcileSummitPayment>>) {
  if (!result.ok) {
    return "manual_review";
  }

  if (result.status === "paid") {
    return "success";
  }

  if (result.status === "pending") {
    return "pending";
  }

  return result.status;
}
