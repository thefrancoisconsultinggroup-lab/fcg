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
  isPayPalPayerActionRequired,
  PayPalApiError,
  paypalErrorDetails,
  paypalPayerActionHref,
  paypalRuntimeDiagnostics,
  verifiedCaptureTotal,
} from "@/lib/paypal";
import {
  getSummitPaymentRecordById,
  getSummitPaymentRecordByOrderId,
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

type CaptureProcessResult =
  | { kind: "success"; registrationId: string }
  | { kind: "status"; message?: string; payment: "declined" | "failed" | "manual_review" | "pending" | "verification_required"; registrationId: string }
  | { debugId?: string; description?: string; issue?: string; kind: "restart"; registrationId: string }
  | { debugId?: string; description?: string; issue?: string; kind: "payer_action"; payerActionUrl: string; registrationId: string };

type CaptureRouteBody = {
  orderId?: unknown;
  registrationId?: unknown;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paypalOrderId = url.searchParams.get("token") || "";
  const registrationId = url.searchParams.get("registrationId") || "";
  const redirectBase = `${url.origin}/human-capacity-summit`;
  const thankYouUrl = `${redirectBase}/thank-you`;

  const result = await processCapture({ paypalOrderId, registrationId });

  if (!result) {
    return NextResponse.redirect(`${redirectBase}?payment=failed#summit-registration`);
  }

  if (result.kind === "success") {
    return NextResponse.redirect(`${thankYouUrl}?registration=${result.registrationId}`);
  }

  if (result.kind === "payer_action") {
    return NextResponse.redirect(result.payerActionUrl);
  }

  return NextResponse.redirect(
    `${redirectBase}?payment=${result.kind === "restart" ? "declined" : result.payment}&registration=${result.registrationId}#summit-registration`,
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CaptureRouteBody | null;
  const paypalOrderId = typeof body?.orderId === "string" ? body.orderId : "";
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId : "";

  if (!paypalOrderId || !registrationId) {
    return NextResponse.json(
      { message: "We couldn't verify the PayPal payment.", details: [{ issue: "INVALID_CAPTURE_REQUEST" }] },
      { status: 400 },
    );
  }

  const result = await processCapture({ paypalOrderId, registrationId });

  if (!result) {
    return NextResponse.json(
      { message: "We couldn't verify the PayPal payment.", details: [{ issue: "PAYPAL_CAPTURE_NOT_FOUND" }] },
      { status: 404 },
    );
  }

  if (result.kind === "success") {
    return NextResponse.json({
      registrationId: result.registrationId,
      status: "COMPLETED",
      thankYouUrl: `/human-capacity-summit/thank-you?registration=${encodeURIComponent(result.registrationId)}`,
    });
  }

  if (result.kind === "restart") {
    return NextResponse.json(
      {
        debug_id: result.debugId,
        details: [
          {
            description:
              result.description ||
              "PayPal could not complete the payment with the selected funding source.",
            issue: result.issue || "INSTRUMENT_DECLINED",
          },
        ],
        registrationId: result.registrationId,
      },
      { status: 409 },
    );
  }

  if (result.kind === "payer_action") {
    return NextResponse.json(
      {
        debug_id: result.debugId,
        details: [
          {
            description:
              result.description ||
              "PayPal needs an extra verification step before the payment can be completed.",
            issue: result.issue || "PAYER_ACTION_REQUIRED",
          },
        ],
        payerActionUrl: result.payerActionUrl,
        registrationId: result.registrationId,
      },
      { status: 409 },
    );
  }

  return NextResponse.json(
    {
      details: [
        {
          description: buyerMessageForPayment(result.payment, result.message),
          issue: issueForPayment(result.payment),
        },
      ],
      registrationId: result.registrationId,
      status: paymentStatusForBuyer(result.payment),
    },
    { status: httpStatusForPayment(result.payment) },
  );
}

async function processCapture({
  paypalOrderId,
  registrationId,
}: {
  paypalOrderId: string;
  registrationId: string;
}): Promise<CaptureProcessResult | null> {
  const record =
    (await getSummitPaymentRecordById(registrationId)) ??
    (await getSummitPaymentRecordByOrderId(paypalOrderId));

  if (!record || record.paypalOrderId !== paypalOrderId) {
    return null;
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
    return { kind: "success", registrationId: record.id };
  }

  try {
    await updateSummitPaymentRecord(record.id, { status: "approved" });
    let capture: Awaited<ReturnType<typeof capturePayPalOrder>>;

    try {
      capture = await capturePayPalOrder(paypalOrderId);
    } catch (error) {
      const diagnostics = await captureErrorDiagnostics(paypalOrderId, error);
      const errorDetails = error instanceof PayPalApiError ? paypalErrorDetails(error) : null;

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
        return {
          debugId: diagnostics.paypalDebugId,
          description: diagnostics.paypalDescription,
          issue: diagnostics.paypalIssue || "INSTRUMENT_DECLINED",
          kind: "restart",
          registrationId: record.id,
        };
      }

      if (error instanceof PayPalApiError && isPayPalPayerActionRequired(error)) {
        const payerActionUrl = paypalPayerActionHref(error);

        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorCode: diagnostics.paypalIssue || "PAYER_ACTION_REQUIRED",
          lastPaymentErrorMessage:
            diagnostics.paypalDescription ||
            "PayPal needs additional verification before the payment can be completed.",
          status: "verification_required",
        });

        if (payerActionUrl) {
          return {
            debugId: diagnostics.paypalDebugId,
            description: diagnostics.paypalDescription,
            issue: diagnostics.paypalIssue || "PAYER_ACTION_REQUIRED",
            kind: "payer_action",
            payerActionUrl,
            registrationId: record.id,
          };
        }
      }

      if (
        errorDetails?.issue === "COMPLIANCE_VIOLATION" ||
        errorDetails?.name === "COMPLIANCE_VIOLATION"
      ) {
        console.error("PayPal capture failed with a nonrecoverable Summit payment error.", {
          diagnostics,
          error: error instanceof Error ? error.message : "Unknown error",
          paypalOrderId: redactId(paypalOrderId),
          paypalRuntime: paypalRuntimeDiagnostics(),
          registrationId: redactId(record.id),
        });
        await updateSummitPaymentRecord(record.id, {
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorCode: errorDetails.issue || errorDetails.name || "PAYPAL_CAPTURE_FAILED",
          lastPaymentErrorMessage:
            errorDetails.description || "PayPal could not complete the payment.",
          manualReviewReason: "PayPal rejected the capture with a nonrecoverable error.",
          status: "manual_review",
        });
        return {
          kind: "status",
          message: errorDetails.description,
          payment: "manual_review",
          registrationId: record.id,
        };
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
      return {
        kind: "status",
        payment: paymentForReconciliation(reconciliation),
        registrationId: record.id,
      };
    }

    const verified = verifiedCaptureTotal(capture);

    if (capture.status !== "COMPLETED" || !verified) {
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
        return { kind: "status", payment: "pending", registrationId: record.id };
      }

      if (isDeclinedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status,
          lastPaymentErrorMessage: "PayPal could not complete the payment.",
          status: "declined",
        });
        return {
          kind: "restart",
          issue: status,
          registrationId: record.id,
        };
      }

      if (isFailedPayPalStatus(status)) {
        await updateSummitPaymentRecord(record.id, {
          lastPaymentDiagnostics: diagnostics,
          lastPaymentErrorAt: new Date().toISOString(),
          lastPaymentErrorCode: status || "PAYPAL_CAPTURE_FAILED",
          lastPaymentErrorMessage: "PayPal reported that the payment was not completed.",
          status: "payment_failed",
        });
        return { kind: "status", payment: "failed", registrationId: record.id };
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
      return {
        kind: "status",
        payment: paymentForReconciliation(reconciliation),
        registrationId: record.id,
      };
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
      return { kind: "status", payment: "manual_review", registrationId: record.id };
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
      return { kind: "status", payment: "manual_review", registrationId: record.id };
    }

    return { kind: "success", registrationId: record.id };
  } catch (error) {
    console.error("Summit capture route failed after PayPal approval.", {
      error: error instanceof Error ? error.message : "Unknown error",
      paypalOrderId: redactId(paypalOrderId),
      paypalRuntime: paypalRuntimeDiagnostics(),
      registrationId: redactId(registrationId),
    });
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
    return { kind: "status", payment: "verification_required", registrationId: record.id };
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

function paymentForReconciliation(result: Awaited<ReturnType<typeof reconcileSummitPayment>>) {
  if (!result.ok) {
    return "manual_review" as const;
  }

  if (result.status === "paid") {
    return "verification_required" as const;
  }

  if (result.status === "payment_failed") {
    return "failed" as const;
  }

  return result.status;
}

function buyerMessageForPayment(
  payment: "declined" | "failed" | "manual_review" | "pending" | "verification_required",
  message?: string,
) {
  if (payment === "declined") {
    return message || "PayPal could not complete the payment with the selected funding source.";
  }

  if (payment === "pending") {
    return "Your payment is still being processed. Your registration will be confirmed once PayPal completes the payment.";
  }

  if (payment === "verification_required") {
    return "We're still verifying your payment. Please do not try to pay again yet.";
  }

  if (payment === "manual_review") {
    return (
      message ||
      "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment."
    );
  }

  return message || "PayPal could not complete your payment. Please try again.";
}

function issueForPayment(
  payment: "declined" | "failed" | "manual_review" | "pending" | "verification_required",
) {
  if (payment === "declined") {
    return "INSTRUMENT_DECLINED";
  }

  if (payment === "pending") {
    return "PAYMENT_PENDING";
  }

  if (payment === "verification_required") {
    return "PAYMENT_VERIFICATION_REQUIRED";
  }

  if (payment === "manual_review") {
    return "PAYPAL_MANUAL_REVIEW";
  }

  return "PAYPAL_CAPTURE_FAILED";
}

function paymentStatusForBuyer(
  payment: "declined" | "failed" | "manual_review" | "pending" | "verification_required",
) {
  if (payment === "declined") {
    return "DECLINED";
  }

  if (payment === "pending") {
    return "PENDING";
  }

  if (payment === "verification_required") {
    return "VERIFICATION_REQUIRED";
  }

  if (payment === "manual_review") {
    return "MANUAL_REVIEW";
  }

  return "FAILED";
}

function httpStatusForPayment(
  payment: "declined" | "failed" | "manual_review" | "pending" | "verification_required",
) {
  if (payment === "pending") {
    return 202;
  }

  if (payment === "manual_review") {
    return 422;
  }

  return 409;
}
