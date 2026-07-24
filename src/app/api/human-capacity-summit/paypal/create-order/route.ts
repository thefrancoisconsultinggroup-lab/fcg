import { NextResponse } from "next/server";
import { createPayPalOrder, hasPayPalConfig } from "@/lib/paypal";
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

  try {
    const order = await createPayPalOrder({
      pricing: validated.registration.pricing,
      registrationId,
      requestOrigin,
    });

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
  } catch {
    return NextResponse.json(
      {
        message:
          "We could not open PayPal checkout just yet. Please try again or contact Francois Consulting Group directly.",
      },
      { status: 502 },
    );
  }
}
