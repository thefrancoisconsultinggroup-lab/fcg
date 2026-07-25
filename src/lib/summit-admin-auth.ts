export type SummitAdminUser = {
  email?: string;
  id: string;
  name?: string;
};

export type SummitAdminAuthResult =
  | { ok: true; admin: SummitAdminUser }
  | { ok: false; message: string; status: 401 | 403 | 501 };

export async function requireSummitAdmin(request: Request): Promise<SummitAdminAuthResult> {
  void request;

  return {
    ok: false,
    status: 501,
    message:
      "Summit order actions require server-verifiable administrator authentication before they can be enabled.",
  };
}
