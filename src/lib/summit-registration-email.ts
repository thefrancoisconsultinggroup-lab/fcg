import type { SummitPriceSummary } from "@/lib/summit-pricing";
import type { SummitPaymentRecord, SummitRegistrationDetails } from "@/lib/summit-registration-records";
import { escapeHtml, sendSiteEmail } from "@/lib/site-email";

export type SummitEmailResult = {
  adminNotification: boolean;
  attendeeConfirmation: boolean;
};

export type SummitEmailMessage = {
  from: string;
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string[];
};

export function summitAttendeeFromEmail() {
  return (
    process.env.SUMMIT_ATTENDEE_FROM_EMAIL ||
    process.env.SUMMIT_REGISTRATION_FROM_EMAIL ||
    "Francois Consulting Group <no-reply@francoisconsultinggroup.com>"
  );
}

export function summitAdminFromEmail() {
  return (
    process.env.SUMMIT_ADMIN_FROM_EMAIL ||
    process.env.SUMMIT_REGISTRATION_FROM_EMAIL ||
    "Human Capacity Summit <summit@francoisconsultinggroup.com>"
  );
}

export function summitAdminRecipientEmail() {
  return (
    process.env.SUMMIT_ADMIN_RECIPIENT_EMAIL ||
    process.env.SUMMIT_REGISTRATION_RECIPIENT_EMAIL ||
    "hello@francoisconsultinggroup.com"
  );
}

export async function sendSummitAttendeeConfirmationEmail(record: SummitPaymentRecord) {
  const message = buildSummitAttendeeConfirmationEmail(record);
  return sendSiteEmail(message);
}

export async function sendSummitAdminNotificationEmail(record: SummitPaymentRecord) {
  const message = buildSummitAdminNotificationEmail(record);
  return sendSiteEmail(message);
}

export function buildSummitAttendeeConfirmationEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const fullName = registrantName(record.registration);
  const fields = attendeeFields(record);

  return {
    from: summitAttendeeFromEmail(),
    to: [record.registration.email],
    subject: "Your Human Capacity Summit Registration Is Confirmed",
    html: brandedEmailHtml({
      heading: "Registration Confirmed",
      intro: [
        `Thank you for registering, ${escapeHtml(fullName)}.`,
        "Your PayPal payment was successfully verified and your Human Capacity Summit registration is confirmed.",
        "Please retain this email for your records. For registration questions, contact hello@francoisconsultinggroup.com.",
      ],
      table: detailsTableHtml(fields),
    }),
    text: plainTextEmail({
      heading: "Your Human Capacity Summit Registration Is Confirmed",
      intro: [
        `Thank you for registering, ${fullName}.`,
        "Your PayPal payment was successfully verified and your Human Capacity Summit registration is confirmed.",
        "Please retain this email for your records.",
        "For registration questions, contact hello@francoisconsultinggroup.com.",
      ],
      fields,
    }),
  };
}

export function buildSummitAdminNotificationEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const fullName = registrantName(record.registration);
  const fields = adminFields(record);

  return {
    from: summitAdminFromEmail(),
    to: [summitAdminRecipientEmail()],
    replyTo: record.registration.email,
    subject: `New Paid Summit Registration - ${fullName}`,
    html: brandedEmailHtml({
      heading: "New Paid Summit Registration",
      intro: [
        "A new verified, paid Human Capacity Summit registration has been received.",
        "The payment has been captured, verified against the expected USD amount, and marked paid in the registration store.",
      ],
      table: detailsTableHtml(fields),
    }),
    text: plainTextEmail({
      heading: "New Paid Summit Registration",
      intro: [
        "A new verified, paid Human Capacity Summit registration has been received.",
        "The payment has been captured, verified against the expected USD amount, and marked paid in the registration store.",
      ],
      fields,
    }),
  };
}

function attendeeFields(record: SummitPaymentRecord) {
  const rows: Array<[string, string]> = [
    ["Summit", "Human Capacity Summit"],
    ["Registrant", registrantName(record.registration)],
    ["Email address", record.registration.email],
    ["Mobile / WhatsApp", optionalValue(record.registration.phone)],
    ["Country", record.registration.country],
    ["Organization", record.registration.organization],
    ["Role / Title", record.registration.role],
    ["Registration category", record.pricing.categoryLabel],
    ["Rate / package", `${record.pricing.rateLabel} - ${record.pricing.rateDetail}`],
    ["Number attending", String(record.pricing.attendeeCount)],
    ...priceRows(record.pricing),
    ["Amount paid", money(record.pricing.total)],
    ["Currency", "USD"],
    ["PayPal order ID", record.paypalOrderId],
    ["PayPal transaction / capture reference", record.captureId ?? "Not available"],
    ["Payment date", formatDate(record.capturedAt)],
  ];

  return rows;
}

function adminFields(record: SummitPaymentRecord) {
  const rows: Array<[string, string]> = [
    ["Registrant / contact name", registrantName(record.registration)],
    ["Email address", record.registration.email],
    ["Telephone number", optionalValue(record.registration.phone)],
    ["Country", record.registration.country],
    ["Company / organization", record.registration.organization],
    ["Job title / role", record.registration.role],
    ["Registration category", record.pricing.categoryLabel],
    ["Individual rate or corporate package", `${record.pricing.rateLabel} - ${record.pricing.rateDetail}`],
    ["Actual number attending", String(record.pricing.attendeeCount)],
    ...priceRows(record.pricing),
    ["Special dietary notes", optionalValue(record.registration.dietaryNotes)],
    ["Accessibility needs", optionalValue(record.registration.accessibilityNeeds)],
    ["Submitted notes / hopes", optionalValue(record.registration.hopes)],
    ["Amount paid", money(record.pricing.total)],
    ["Currency", "USD"],
    ["PayPal order ID", record.paypalOrderId],
    ["PayPal capture / transaction ID", record.captureId ?? "Not available"],
    ["Payment date and time", formatDate(record.capturedAt)],
    ["Internal registration reference", record.id],
  ];

  return rows;
}

function priceRows(pricing: SummitPriceSummary) {
  return [
    pricing.unitPrice ? ["Price per attendee", money(pricing.unitPrice)] : null,
    pricing.fixedPackagePrice ? ["Fixed package price", money(pricing.fixedPackagePrice)] : null,
  ].filter((row): row is [string, string] => Boolean(row));
}

function brandedEmailHtml({
  heading,
  intro,
  table,
}: {
  heading: string;
  intro: string[];
  table: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f7f8;color:#172326;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">Human Capacity Summit payment confirmation from Francois Consulting Group.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f8;border-collapse:collapse;width:100%;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #dbe5e7;border-collapse:collapse;max-width:640px;width:100%;">
            <tr>
              <td style="background:#0f2f35;padding:24px 26px;">
                ${logoHeaderHtml()}
              </td>
            </tr>
            <tr>
              <td style="padding:30px 26px 10px;">
                <h1 style="color:#0f2f35;font-size:26px;line-height:1.2;margin:0 0 16px;">${escapeHtml(heading)}</h1>
                ${intro.map((paragraph) => `<p style="color:#304246;font-size:15px;line-height:1.65;margin:0 0 14px;">${paragraph}</p>`).join("")}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 26px 30px;">
                ${table}
              </td>
            </tr>
            <tr>
              <td style="background:#edf5f6;color:#4d6267;font-size:12px;line-height:1.6;padding:18px 26px;">
                Francois Consulting Group<br>
                This transactional email was sent because a Human Capacity Summit PayPal payment was verified by the server.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function logoHeaderHtml() {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:0 14px 0 0;vertical-align:middle;">
        <img src="${escapeHtml(publicLogoUrl())}" width="72" height="72" alt="Francois Consulting Group logo icon" style="border:0;display:block;height:72px;width:72px;">
      </td>
      <td style="background:#21b8d1;font-size:0;line-height:0;width:2px;">&nbsp;</td>
      <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0;line-height:1.05;padding:0 0 0 14px;text-transform:uppercase;vertical-align:middle;">
        Francois<br>Consulting<br>Group
      </td>
    </tr>
  </table>`;
}

function detailsTableHtml(rows: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #d9e4e6;border-collapse:collapse;width:100%;">
    ${rows.map(([label, value]) => `<tr>
      <th align="left" style="background:#f7fbfb;border-bottom:1px solid #d9e4e6;color:#0f2f35;font-size:13px;line-height:1.45;padding:11px 12px;vertical-align:top;width:38%;">${escapeHtml(label)}</th>
      <td style="border-bottom:1px solid #d9e4e6;color:#26383c;font-size:13px;line-height:1.55;padding:11px 12px;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`).join("")}
  </table>`;
}

function plainTextEmail({
  fields,
  heading,
  intro,
}: {
  fields: Array<[string, string]>;
  heading: string;
  intro: string[];
}) {
  return [
    heading,
    "",
    ...intro,
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");
}

export function publicLogoUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://francoisconsultinggroup.com";
  const logoPath = "/assets/migrated/shared/brand-francois-logo.png";

  return `${siteUrl}${logoPath}`;
}

function registrantName(registration: SummitRegistrationDetails) {
  return `${registration.firstName} ${registration.lastName}`.trim();
}

function optionalValue(value: string) {
  return value || "Not provided";
}

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
