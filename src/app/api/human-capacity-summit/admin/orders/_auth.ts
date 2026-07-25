import {NextResponse} from "next/server";
import {requireSummitAdmin} from "@/lib/summit-admin-auth";

export async function requireAdminOrResponse(request: Request) {
  const auth = await requireSummitAdmin(request);

  if (auth.ok) {
    return auth;
  }

  return NextResponse.json({message: auth.message}, {status: auth.status});
}
