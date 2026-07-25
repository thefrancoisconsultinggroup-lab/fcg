import {NextResponse} from "next/server";
import {requireAdminOrResponse} from "../_auth";

export async function POST(request: Request) {
  const auth = await requireAdminOrResponse(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  return NextResponse.json(
    {message: "Administrative PayPal reconciliation is not enabled until Summit admin authentication is configured."},
    {status: 501},
  );
}
