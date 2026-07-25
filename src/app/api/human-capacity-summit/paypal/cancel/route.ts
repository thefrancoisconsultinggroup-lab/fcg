import { NextResponse } from "next/server";
import {
  getSummitPaymentRecordById,
  isSummitPaymentCaptured,
  updateSummitPaymentRecord,
} from "@/lib/summit-registration-records";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const registrationId = url.searchParams.get("registrationId") || "";

  if (registrationId) {
    const record = await getSummitPaymentRecordById(registrationId);
    if (record && !isSummitPaymentCaptured(record)) {
      await updateSummitPaymentRecord(registrationId, { status: "cancelled" });
    }
  }

  return NextResponse.redirect(
    `${url.origin}/human-capacity-summit?payment=cancelled&registration=${registrationId}#summit-registration`,
  );
}
