export type SiteEmail = {
  from: string;
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string[];
};

export function hasResendConfig() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendSiteEmail({ from, html, replyTo, subject, text, to }: SiteEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      ok: false as const,
      status: 503,
      message: "Email sending is not configured yet.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      html,
      reply_to: replyTo,
      subject,
      text,
      to,
    }),
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      message: "Email could not be sent.",
    };
  }

  return { ok: true as const };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
