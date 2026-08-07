import { NextResponse } from "next/server";
import { sendScheduledSummitAccessEmails } from "@/lib/summit-payment-completion";

export async function POST(request: Request) {
  const configuredSecret = process.env.SUMMIT_SCHEDULER_SECRET;
  const authorization = request.headers.get("authorization") || "";

  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const result = await sendScheduledSummitAccessEmails();

  return NextResponse.json({
    attempted: result.attempted,
    message: "Summit access email job completed.",
    sent: result.sent,
    skipped: result.skipped,
  });
}
