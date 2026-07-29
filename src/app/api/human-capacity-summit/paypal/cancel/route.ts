import { NextResponse } from "next/server";
import {
  getSummitPaymentRecordById,
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const registrationId = url.searchParams.get("registrationId") || "";

  await markRegistrationCancelled(registrationId);

  return NextResponse.redirect(
    `${url.origin}/human-capacity-summit?payment=cancelled&registration=${registrationId}#summit-registration`,
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { registrationId?: unknown } | null;
  const registrationId = typeof body?.registrationId === "string" ? body.registrationId : "";

  await markRegistrationCancelled(registrationId);

  return NextResponse.json({ ok: true, registrationId });
}

async function markRegistrationCancelled(registrationId: string) {
  if (!registrationId) {
    return;
  }

  const record = await getSummitPaymentRecordById(registrationId);
  if (record && !isSummitPaymentCaptured(record)) {
    await updateSummitPaymentRecord(registrationId, { status: "cancelled" });
  }
}
