import { NextResponse } from "next/server";
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

  return NextResponse.json(
    {
      message:
        "Please complete secure PayPal checkout before the Summit registration can be confirmed.",
    },
    { status: 409 },
  );
}
