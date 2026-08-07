export type SummitAdminUser = {
  email?: string;
  id: string;
  name?: string;
};

export type SummitAdminAuthResult =
  | { ok: true; admin: SummitAdminUser }
  | { ok: false; message: string; status: 401 | 403 | 501 };

export async function requireSummitAdmin(request: Request): Promise<SummitAdminAuthResult> {
  const configuredToken = process.env.SUMMIT_ADMIN_API_TOKEN;

  if (!configuredToken) {
    return {
      ok: false,
      status: 501,
      message:
        "Summit order actions require server-verifiable administrator authentication before they can be enabled.",
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const expected = `Bearer ${configuredToken}`;

  if (authorization !== expected) {
    return {
      ok: false,
      status: 401,
      message: "Administrator authentication is required for this Summit action.",
    };
  }

  return {
    ok: true,
    admin: {
      email: process.env.SUMMIT_ADMIN_AUTH_EMAIL || process.env.SUMMIT_ADMIN_RECIPIENT_EMAIL,
      id: process.env.SUMMIT_ADMIN_AUTH_ID || "summit-admin-token",
      name: process.env.SUMMIT_ADMIN_AUTH_NAME || "Summit Administrator",
    },
  };
}
