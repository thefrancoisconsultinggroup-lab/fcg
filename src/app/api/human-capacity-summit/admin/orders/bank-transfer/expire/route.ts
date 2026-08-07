import { NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/app/api/human-capacity-summit/admin/orders/_auth";
import {
  getSummitPaymentRecordById,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

export async function POST(request: Request) {
  const auth = await requireAdminOrResponse(request);

  if (auth instanceof Response) {
    return auth;
  }

  const body = (await request.json().catch(() => null)) as {
    note?: unknown;
    registrationId?: unknown;
  } | null;
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!registrationId) {
    return NextResponse.json({ message: "Registration ID is required." }, { status: 400 });
  }

  const record = await getSummitPaymentRecordById(registrationId);

  if (!record || record.paymentMethod !== "bank_transfer") {
    return NextResponse.json({ message: "Bank-transfer registration could not be found." }, { status: 404 });
  }

  if (record.status === "paid") {
    return NextResponse.json(
      { message: "A paid bank-transfer registration cannot be expired automatically." },
      { status: 409 },
    );
  }

  const updated = await updateSummitPaymentRecord(record.id, {
    expiredAt: new Date().toISOString(),
    paymentVerifiedBy: auth.admin,
    reconciliationNote: note || record.reconciliationNote,
    status: "expired",
  });

  return NextResponse.json({
    message: "Bank-transfer registration marked as expired.",
    registrationId: updated?.id ?? record.id,
    status: "expired",
  });
}
