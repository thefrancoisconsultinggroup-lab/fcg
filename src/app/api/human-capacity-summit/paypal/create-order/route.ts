import { NextResponse } from "next/server";
import { createPayPalOrder, hasPayPalConfig, PayPalApiError, paypalRuntimeDiagnostics } from "@/lib/paypal";
import { createSummitPaymentRecord } from "@/lib/summit-registration-records";
import {
  validateSummitRegistrationPayload,
  type SummitRegistrationPayload,
  stringValue,
} from "@/lib/summit-registration-validation";

export async function POST(request: Request) {
  let payload: SummitRegistrationPayload;

  try {
    payload = (await request.json()) as SummitRegistrationPayload;
  } catch {
    return NextResponse.json({ message: "Please submit a valid registration form." }, { status: 400 });
  }

  if (stringValue(payload.website)) {
    return NextResponse.json({
      message: "Thank you. Your Human Capacity Summit registration has been received.",
    });
  }

  const validated = validateSummitRegistrationPayload(payload);
  if (!validated.ok) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  if (!hasPayPalConfig()) {
    return NextResponse.json(
      {
        message:
          "PayPal checkout is not configured yet. Please contact Francois Consulting Group directly to reserve your place.",
      },
      { status: 503 },
    );
  }

  const registrationId = crypto.randomUUID();
  const requestOrigin = new URL(request.url).origin;
  let order: Awaited<ReturnType<typeof createPayPalOrder>>;

  try {
    order = await createPayPalOrder({
      pricing: validated.registration.pricing,
      registrationId,
      requestOrigin,
    });
  } catch (error) {
    console.error("PayPal order creation failed for Summit registration.", {
      debugId: error instanceof PayPalApiError ? error.details.debugId : undefined,
      error: error instanceof Error ? error.message : "Unknown error",
      paypalRuntime: paypalRuntimeDiagnostics(),
    });
    return NextResponse.json(
      {
        message: "We couldn't start PayPal checkout. Please try again.",
      },
      { status: 502 },
    );
  }

  try {
    await createSummitPaymentRecord({
      id: registrationId,
      paypalOrderId: order.orderId,
      pricing: validated.registration.pricing,
      registration: validated.registration.details,
      status: "pending_approval",
    });

    return NextResponse.json({
      approvalUrl: order.approvalUrl,
      orderId: order.orderId,
      registrationId,
    });
  } catch (error) {
    console.error("Summit payment record could not be saved after PayPal order creation.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        message:
          "We could not save the Summit registration before opening PayPal checkout. Please try again or contact Francois Consulting Group directly.",
      },
      { status: 502 },
    );
  }
}
