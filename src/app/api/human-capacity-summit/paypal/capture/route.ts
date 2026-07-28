import { NextResponse } from "next/server";
import {
  completeSummitPayment,
  isDeclinedPayPalStatus,
  isFailedPayPalStatus,
  isPendingPayPalStatus,
  reconcileSummitPayment,
} from "@/lib/summit-payment-completion";
import {
  captureOutcomeSummary,
  capturePayPalOrder,
  capturePaymentSummary,
  getPayPalOrder,
  isPayPalFundingDeclined,
  PayPalApiError,
  paypalErrorDetails,
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
      const diagnostics = await captureErrorDiagnostics(paypalOrderId, error);

      if (error instanceof PayPalApiError && isPayPalFundingDeclined(error)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorCode: diagnostics.paypalIssue || "INSTRUMENT_DECLINED",
          lastPaymentErrorMessage:
            diagnostics.paypalDescription ||
            "PayPal could not complete the payment with the selected funding source.",
          status: "declined",
        });
        console.warn("PayPal capture declined for Summit registration.", {
          diagnostics,
          paypalOrderId: redactId(paypalOrderId),
          registrationId: redactId(record.id),
        });
        return NextResponse.redirect(`${redirectBase}?payment=declined&registration=${record.id}#summit-registration`);
      }

      console.error("PayPal capture API failed for approved Summit order.", {
        diagnostics,
        error: error instanceof Error ? error.message : "Unknown error",
        paypalOrderId: redactId(paypalOrderId),
        paypalRuntime: paypalRuntimeDiagnostics(),
        registrationId: redactId(record.id),
      });
      await updateSummitPaymentRecord(record.id, {
        lastPaymentDiagnostics: diagnostics,
      });
      const reconciliation = await settleUncertainCaptureOutcome(record);
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
      const diagnostics = captureResponseDiagnostics(paypalOrderId, capture);

      console.warn("PayPal capture returned a non-completed Summit payment state.", {
        diagnostics,
        paypalOrderId: redactId(paypalOrderId),
        registrationId: redactId(record.id),
      });

      if (isPendingPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentDiagnostics: diagnostics,
          status: "payment_processing",
        });
        return NextResponse.redirect(`${redirectBase}?payment=pending&registration=${record.id}#summit-registration`);
      }

      if (isDeclinedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status,
          lastPaymentErrorMessage: "PayPal could not complete the payment.",
          status: "declined",
        });
        return NextResponse.redirect(`${redirectBase}?payment=declined&registration=${record.id}#summit-registration`);
      }

      if (isFailedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status || "PAYPAL_CAPTURE_FAILED",
          lastPaymentErrorMessage: "PayPal reported that the payment was not completed.",
          status: "payment_failed",
        });
        return NextResponse.redirect(`${redirectBase}?payment=failed&registration=${record.id}#summit-registration`);
      }

      await updateSummitPaymentRecord(record.id, {
        lastPaymentDiagnostics: diagnostics,
        lastPaymentErrorAt: new Date().toISOString(),
        lastPaymentErrorCode: status || "PAYPAL_CAPTURE_UNVERIFIED",
        lastPaymentErrorMessage: "PayPal capture could not be verified.",
        status: "verification_required",
      });
      const reconciliation = await settleUncertainCaptureOutcome(
        (await getSummitPaymentRecordById(record.id)) ?? record,
      );
      return NextResponse.redirect(
        `${redirectBase}?payment=${paymentParamForReconciliation(reconciliation)}&registration=${record.id}#summit-registration`,
      );
    }

    if (verified.currency !== "USD") {
      await updateSummitPaymentRecord(record.id, {
        lastPaymentDiagnostics: captureResponseDiagnostics(paypalOrderId, capture),
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
        lastPaymentDiagnostics: captureResponseDiagnostics(paypalOrderId, capture),
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
        lastPaymentDiagnostics: {
          paypalOrderId,
          recordedAt: new Date().toISOString(),
          source: "capture_api_error",
        },
        lastPaymentErrorMessage: "Payment capture result could not be verified.",
        status: "verification_required",
      });
      return NextResponse.redirect(`${redirectBase}?payment=verification_required&registration=${record.id}#summit-registration`);
    }
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }
}

function captureResponseDiagnostics(
  paypalOrderId: string,
  capture: Awaited<ReturnType<typeof capturePayPalOrder>>,
) {
  const outcome = captureOutcomeSummary(capture);

  return {
    captureHttpStatus: 200,
    captureId: outcome.captureId,
    finalCaptureStatus: outcome.captureStatus || undefined,
    finalOrderStatus: outcome.orderStatus || undefined,
    paypalOrderId,
    recordedAt: new Date().toISOString(),
    source: "capture_response" as const,
  };
}

async function captureErrorDiagnostics(paypalOrderId: string, error: unknown) {
  const errorDetails = error instanceof PayPalApiError ? paypalErrorDetails(error) : null;
  const diagnostics = {
    captureHttpStatus: error instanceof PayPalApiError ? error.details.status : undefined,
    captureId: undefined as string | undefined,
    finalCaptureStatus: undefined as string | undefined,
    finalOrderStatus: undefined as string | undefined,
    paypalDebugId: errorDetails?.debugId,
    paypalDescription: errorDetails?.description,
    paypalIssue: errorDetails?.issue,
    paypalName: errorDetails?.name,
    paypalOrderId,
    recordedAt: new Date().toISOString(),
    source: "capture_api_error" as const,
  };

  try {
    const order = await getPayPalOrder(paypalOrderId);
    const outcome = captureOutcomeSummary(order);

    return {
      ...diagnostics,
      captureId: outcome.captureId,
      finalCaptureStatus: outcome.captureStatus || undefined,
      finalOrderStatus: outcome.orderStatus || undefined,
    };
  } catch {
    return diagnostics;
  }
}

async function settleUncertainCaptureOutcome(record: NonNullable<Awaited<ReturnType<typeof getSummitPaymentRecordById>>>) {
  let currentRecord = record;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (currentRecord.status === "declined") {
      return { ok: true as const, status: "declined" as const };
    }

    if (currentRecord.status === "payment_failed") {
      return { ok: true as const, status: "payment_failed" as const };
    }

    if (isSummitPaymentCaptured(currentRecord)) {
      return {
        ok: true as const,
        status: "paid" as const,
        completed: await completeSummitPayment({
          record: currentRecord,
          capture: {
            captureId: currentRecord.captureId,
            currency: "USD",
            orderId: currentRecord.paypalOrderId,
            payerEmail: currentRecord.payerEmail,
            status: "COMPLETED",
            value: currentRecord.pricing.total,
          },
        }),
      };
    }

    const reconciliation = await reconcileSummitPayment(currentRecord);
    if (!reconciliation.ok || reconciliation.status !== "verification_required" || attempt === 3) {
      return reconciliation;
    }

    await waitForCaptureSettlement(1500);
    currentRecord = (await getSummitPaymentRecordById(record.id)) ?? currentRecord;
  }

  return { ok: true as const, status: "verification_required" as const };
}

function waitForCaptureSettlement(timeoutMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
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
