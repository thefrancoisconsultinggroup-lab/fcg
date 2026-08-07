import { NextResponse } from "next/server";
import { summitPolicyAcceptanceSnapshot } from "@/lib/legal";
import {
  calculateBankTransferPaymentDueAt,
  generateSummitPaymentReference,
  getSummitDirectBankTransferConfig,
} from "@/lib/summit-bank-transfer";
import { sendPendingBankTransferEmails } from "@/lib/summit-payment-completion";
import {
  createSummitPaymentRecord,
  findLatestPendingBankTransferRegistration,
  getSummitPaymentRecordByReference,
} from "@/lib/summit-registration-records";
import {
  validateSummitRegistrationPayload,
  type SummitRegistrationPayload,
  stringValue,
} from "@/lib/summit-registration-validation";

export async function POST(request: Request) {
  const config = getSummitDirectBankTransferConfig();

  if (!config.enabled) {
    return NextResponse.json(
      {
        message:
          "Direct Bank Transfer is not available right now. Please use PayPal / Debit or Credit Card instead.",
      },
      { status: 503 },
    );
  }

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

  if (validated.registration.paymentMethod !== "bank_transfer") {
    return NextResponse.json(
      {
        message: "Please select Direct Bank Transfer before submitting this registration.",
      },
      { status: 400 },
    );
  }

  const duplicate = await findLatestPendingBankTransferRegistration({
    email: validated.registration.details.email,
    rateValue: validated.registration.pricing.rateValue,
  });

  if (duplicate) {
    return NextResponse.json(
      {
        message:
          "A bank-transfer registration is already awaiting payment for this attendee. Please check your email for the instructions or contact Francois Consulting Group.",
      },
      { status: 409 },
    );
  }

  const registrationId = crypto.randomUUID();
  const paymentReference = await uniquePaymentReference();
  const bankTransferRequestedAt = new Date().toISOString();
  const paymentDueAt = calculateBankTransferPaymentDueAt();

  const record = await createSummitPaymentRecord({
    amountDue: validated.registration.paymentSummary.amountDue,
    bankTransferRequestedAt,
    configuredExchangeRate: validated.registration.paymentSummary.configuredExchangeRate,
    currency: validated.registration.paymentSummary.currency,
    id: registrationId,
    localBankTransferEligibilityConfirmed: true,
    localBankTransferEligibilityConfirmedAt: new Date().toISOString(),
    originalUsdAmount: validated.registration.paymentSummary.originalUsdAmount,
    paymentDueAt,
    paymentMethod: "bank_transfer",
    paymentReference,
    policyAcceptance: summitPolicyAcceptanceSnapshot(),
    pricing: validated.registration.pricing,
    registration: validated.registration.details,
    status: "awaiting_bank_transfer",
  });

  await sendPendingBankTransferEmails(record);

  return NextResponse.json({
    message: "Registration received - awaiting bank transfer.",
    registrationId: record.id,
    thankYouUrl: `/human-capacity-summit/thank-you?registration=${encodeURIComponent(record.id)}&mode=bank-transfer`,
  });
}

async function uniquePaymentReference() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateSummitPaymentReference();
    const existing = await getSummitPaymentRecordByReference(candidate);

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("A unique bank-transfer payment reference could not be generated.");
}
