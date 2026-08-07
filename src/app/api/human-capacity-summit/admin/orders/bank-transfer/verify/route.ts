import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/app/api/human-capacity-summit/admin/orders/_auth";
import { sendPendingSummitPaymentEmails } from "@/lib/summit-payment-completion";
import {
  getSummitPaymentRecordById,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

type VerifyBankTransferBody = {
  amountReceived?: unknown;
  bankTransactionReference?: unknown;
  currencyReceived?: unknown;
  dateReceived?: unknown;
  reconciliationNote?: unknown;
  registrationId?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireAdminOrResponse(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = (await request.json().catch(() => null)) as VerifyBankTransferBody | null;
  const registrationId = stringValue(body?.registrationId);
  const currencyReceived = normalizeCurrency(body?.currencyReceived);
  const bankTransactionReference = stringValue(body?.bankTransactionReference);
  const reconciliationNote = stringValue(body?.reconciliationNote);
  const dateReceived = stringValue(body?.dateReceived);
  const amountReceived = Number.parseFloat(stringValue(body?.amountReceived));

  if (!registrationId || !currencyReceived || !dateReceived || !Number.isFinite(amountReceived)) {
    return NextResponse.json(
      {
        message:
          "Registration ID, amount received, currency received, and date received are required before verifying a bank transfer.",
      },
      { status: 400 },
    );
  }

  const record = await getSummitPaymentRecordById(registrationId);

  if (!record || record.paymentMethod !== "bank_transfer") {
    return NextResponse.json({ message: "Bank-transfer registration could not be found." }, { status: 404 });
  }

  if (!["awaiting_bank_transfer", "payment_under_review"].includes(record.status)) {
    return NextResponse.json(
      {
        message: "This bank-transfer registration is no longer awaiting verification.",
      },
      { status: 409 },
    );
  }

  const amountMatches = Math.abs(amountReceived - record.amountDue) < 0.005;
  const currencyMatches = currencyReceived === record.currency;

  if (!amountMatches || !currencyMatches) {
    const updated = await updateSummitPaymentRecord(record.id, {
      amountReceived,
      bankTransactionReference: bankTransactionReference || undefined,
      bankTransferReceivedAt: toIsoDate(dateReceived),
      currencyReceived,
      manualReviewReason: "Received bank-transfer amount or currency did not match the expected payment.",
      paymentVerifiedBy: auth.admin,
      reconciliationNote: reconciliationNote || undefined,
      status: "payment_under_review",
    });

    return NextResponse.json({
      message: "Payment details recorded for review. The registration remains under review.",
      registrationId: updated?.id ?? record.id,
      status: "payment_under_review",
    });
  }

  const updated = await updateSummitPaymentRecord(record.id, {
    amountReceived,
    bankTransactionReference: bankTransactionReference || undefined,
    bankTransferReceivedAt: toIsoDate(dateReceived),
    currencyReceived,
    manualReviewReason: undefined,
    paymentVerifiedAt: new Date().toISOString(),
    paymentVerifiedBy: auth.admin,
    reconciliationNote: reconciliationNote || undefined,
    status: "paid",
  });

  if (!updated) {
    return NextResponse.json({ message: "The registration could not be updated." }, { status: 500 });
  }

  await sendPendingSummitPaymentEmails(updated);

  return NextResponse.json({
    message: "Bank transfer verified and registration confirmed.",
    registrationId: updated.id,
    status: "paid",
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCurrency(value: unknown) {
  const normalized = stringValue(value).toUpperCase();
  return normalized === "USD" || normalized === "TTD" ? normalized : "";
}

function toIsoDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}
