import type { SummitPriceSummary } from "@/lib/summit-pricing";
import type { SummitPaymentRecord, SummitRegistrationDetails } from "@/lib/summit-registration-records";
import { legalPolicyVersions } from "@/lib/legal";
import {
  formatSummitCurrency,
  getSummitDirectBankTransferConfig,
} from "@/lib/summit-bank-transfer";
import { formatSummitEventDateTime, getSummitEventConfig } from "@/lib/summit-event";
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

export async function sendSummitBankTransferInstructionsEmail(record: SummitPaymentRecord) {
  const message = buildSummitBankTransferInstructionsEmail(record);
  return sendSiteEmail(message);
}

export async function sendSummitBankTransferAdminNotificationEmail(record: SummitPaymentRecord) {
  const message = buildSummitBankTransferAdminNotificationEmail(record);
  return sendSiteEmail(message);
}

export async function sendSummitAccessEmail(record: SummitPaymentRecord) {
  const message = buildSummitAccessEmail(record);
  return sendSiteEmail(message);
}

export function buildSummitAttendeeConfirmationEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const fields = attendeeFields(record);
  const intro = [
    "Welcome to The Human Capacity Summit!",
    "Thank you for registering and for choosing to join this important global conversation.",
    "Together, we will explore the interconnected challenges and opportunities shaping our world today-and discover how each of us can strengthen human capacity to build a more hopeful, resilient, and thriving future.",
    "We are honoured to welcome you to a community of thought leaders, professionals, educators, healthcare practitioners, business leaders, and engaged citizens who share a commitment to thoughtful dialogue, practical insights, and meaningful action.",
    "Over the coming weeks, we'll share important event updates, speaker highlights, and information to help you prepare for an engaging Summit experience.",
    "We look forward to welcoming you on Friday, October 2, 2026.",
    "One Home.",
    "One Humanity.",
    "A Future Worth Building Together.",
  ];

  return {
    from: summitAttendeeFromEmail(),
    to: [record.registration.email],
    subject: "Your Human Capacity Summit Registration Is Confirmed",
    html: brandedEmailHtml({
      heading: "Registration Confirmed",
      intro,
      sections: [detailsSectionHtml("Registration Summary", fields)],
      supportFooter: summitSupportFooter(),
    }),
    text: plainTextEmail({
      heading: "Your Human Capacity Summit Registration Is Confirmed",
      intro,
      fields,
      supportFooter: summitSupportFooter(),
    }),
  };
}

export function buildSummitAdminNotificationEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const fullName = registrantName(record.registration);
  const fields = adminFields(record);
  const subjectPrefix = record.paymentMethod === "bank_transfer"
    ? "New Verified Bank Transfer Summit Registration"
    : "New Paid Summit Registration";
  const intro = record.paymentMethod === "bank_transfer"
    ? [
        "A Human Capacity Summit bank transfer has been received, verified, and marked paid.",
        "The registration is now confirmed and the attendee confirmation email has been sent.",
      ]
    : [
        "A new verified, paid Human Capacity Summit registration has been received.",
        "The payment has been captured, verified against the expected USD amount, and marked paid in the registration store.",
      ];

  return {
    from: summitAdminFromEmail(),
    to: [summitAdminRecipientEmail()],
    replyTo: record.registration.email,
    subject: `${subjectPrefix} - ${fullName}`,
    html: brandedEmailHtml({
      heading: subjectPrefix,
      intro,
      sections: [detailsSectionHtml("Registration Summary", fields)],
      supportFooter: false,
    }),
    text: plainTextEmail({
      heading: subjectPrefix,
      intro,
      fields,
      supportFooter: false,
    }),
  };
}

export function buildSummitBankTransferInstructionsEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const config = getSummitDirectBankTransferConfig();
  const fields: Array<[string, string]> = [
    ["Registrant", registrantName(record.registration)],
    ["Organisation", optionalValue(record.registration.organization)],
    ["Registration category", record.pricing.categoryLabel],
    ["Selected ticket / package", `${record.pricing.rateLabel} - ${record.pricing.rateDetail}`],
    ["Attendee count", String(record.pricing.attendeeCount)],
    ["Exact TTD amount due", formatSummitCurrency("TTD", record.amountDue)],
    ["Payment reference", record.paymentReference || "Not available"],
    ["Payment deadline", formatBankTransferDeadline(record.paymentDueAt, config.deadlineLabel)],
  ];
  const supportRows = [
    ["Terms and Conditions", policyUrl(legalPolicyVersions.terms.route)],
    ["Privacy Policy", policyUrl(legalPolicyVersions.privacy.route)],
    legalPolicyVersions.refund.published ? ["Refund and Cancellation Policy", policyUrl(legalPolicyVersions.refund.route)] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  return {
    from: summitAttendeeFromEmail(),
    to: [record.registration.email],
    subject: "Welcome to the Human Capacity Summit - Complete Your Bank Transfer",
    html: brandedEmailHtml({
      heading: "Complete Your Bank Transfer",
      intro: [
        `Welcome to the Human Capacity Summit, ${escapeHtml(record.registration.firstName || registrantName(record.registration))}!`,
        "We are delighted to have received your registration. Your registration is currently awaiting payment and will be completed only after your bank transfer has been received and verified.",
        "Please use the payment reference shown below when making your transfer. This reference allows us to identify your payment and match it to your registration.",
      ],
      sections: [
        highlightBlockHtml(
          "Your payment reference",
          record.paymentReference || "Not available",
          "Important: Please enter this exact reference in the reference, description or memo field of your bank transfer. Without it, confirming your registration may be delayed.",
        ),
        detailsSectionHtml("Banking Information", bankDetailsRows(config)),
        detailsSectionHtml("Registration Summary", fields),
        detailsSectionHtml("Policies", supportRows),
        noteBlockHtml(
          "Your registration remains pending until the transfer has been received and manually verified.",
        ),
      ],
      supportFooter: summitSupportFooter(),
    }),
    text: plainTextEmail({
      heading: "Welcome to the Human Capacity Summit - Complete Your Bank Transfer",
      intro: [
        `Welcome to the Human Capacity Summit, ${record.registration.firstName || registrantName(record.registration)}!`,
        "We are delighted to have received your registration. Your registration is currently awaiting payment and will be completed only after your bank transfer has been received and verified.",
        "Please use the payment reference shown below when making your transfer. This reference allows us to identify your payment and match it to your registration.",
        "",
        `Your payment reference: ${record.paymentReference || "Not available"}`,
        `Important: Please enter ${record.paymentReference || "this payment reference"} in the reference, description or memo field of your bank transfer. Without this reference, confirming your registration may be delayed.`,
        "",
        "Banking information:",
      ],
      fields: [
        ...fields,
        ...bankDetailsRows(config),
        ...supportRows,
      ],
      supportFooter: summitSupportFooter(),
    }),
  };
}

export function buildSummitBankTransferAdminNotificationEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const config = getSummitDirectBankTransferConfig();
  const fields: Array<[string, string]> = [
    ["Registrant / contact name", registrantName(record.registration)],
    ["Email address", record.registration.email],
    ["Telephone number", optionalValue(record.registration.phone)],
    ["Company / organization", record.registration.organization],
    ["Registration / package", `${record.pricing.rateLabel} - ${record.pricing.rateDetail}`],
    ["Attendee count", String(record.pricing.attendeeCount)],
    ["Original USD price", formatSummitCurrency("USD", record.originalUsdAmount)],
    ["Fixed conversion rate", "USD 1 = TTD 7"],
    ["TTD amount due", formatSummitCurrency("TTD", record.amountDue)],
    ["Payment reference", record.paymentReference || "Not available"],
    ["Payment deadline", formatBankTransferDeadline(record.paymentDueAt, config.deadlineLabel)],
    ["Status", "Awaiting bank transfer"],
    ["Internal registration reference", record.id],
  ];

  return {
    from: summitAdminFromEmail(),
    to: [config.organizerNotificationEmail],
    replyTo: record.registration.email,
    subject: `Awaiting Bank Transfer - ${registrantName(record.registration)}`,
    html: brandedEmailHtml({
      heading: "Awaiting Bank Transfer",
      intro: [
        "A new Human Capacity Summit registration has been submitted using Direct Bank Transfer.",
        "This registration is awaiting bank transfer and is not yet confirmed.",
      ],
      sections: [detailsSectionHtml("Registration Summary", fields)],
      supportFooter: false,
    }),
    text: plainTextEmail({
      heading: "Awaiting Bank Transfer",
      intro: [
        "A new Human Capacity Summit registration has been submitted using Direct Bank Transfer.",
        "This registration is awaiting bank transfer and is not yet confirmed.",
      ],
      fields,
      supportFooter: false,
    }),
  };
}

export function buildSummitAccessEmail(record: SummitPaymentRecord): SummitEmailMessage {
  const eventConfig = getSummitEventConfig();
  const accessUrl = record.summitAccessUrl || "";
  const intro = [
    `Hello ${escapeHtml(record.registration.firstName || registrantName(record.registration))},`,
    "The Human Capacity Summit begins tomorrow, and we look forward to welcoming you.",
    "Use the private access link below to join the Summit. This link is assigned to your registration and must not be shared or forwarded.",
  ];
  const fields: Array<[string, string]> = [
    ["Event date and time", formatSummitEventDateTime(eventConfig.startAt, eventConfig.timezone)],
    ["Timezone", eventConfig.timezone],
    ["Registration", `${record.pricing.rateLabel} - ${record.pricing.rateDetail}`],
    ["Payment reference", record.paymentReference || "Not available"],
    ["Access link", accessUrl],
  ];

  return {
    from: summitAttendeeFromEmail(),
    to: [record.registration.email],
    subject: "Your Human Capacity Summit Access Link",
    html: brandedEmailHtml({
      heading: "Your Summit Access Link",
      intro,
      sections: [
        buttonBlockHtml("Join the Human Capacity Summit", accessUrl),
        detailsSectionHtml("Access Details", fields),
        noteBlockHtml(
          "Please join 10-15 minutes early. If you have not received everything you need to attend, contact Francois Consulting Group using the support details above.",
        ),
      ],
      supportFooter: summitSupportFooter(),
    }),
    text: plainTextEmail({
      heading: "Your Human Capacity Summit Access Link",
      intro: [
        `Hello ${record.registration.firstName || registrantName(record.registration)},`,
        "The Human Capacity Summit begins tomorrow, and we look forward to welcoming you.",
        "Use the private access link below to join the Summit. This link is assigned to your registration and must not be shared or forwarded.",
        `Join the Human Capacity Summit: ${accessUrl}`,
        "Please join 10-15 minutes early.",
      ],
      fields,
      supportFooter: summitSupportFooter(),
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
    ["Original USD price", formatSummitCurrency("USD", record.originalUsdAmount)],
    ["Amount paid", formatSummitCurrency(record.currency, record.amountDue)],
    ["Currency", record.currency],
    ["Payment method", paymentMethodLabel(record)],
    [paymentReferenceLabel(record), paymentReferenceValue(record)],
    ["Payment date", formatDate(record.paymentVerifiedAt || record.capturedAt)],
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
    ["Original USD price", formatSummitCurrency("USD", record.originalUsdAmount)],
    ["Amount paid", formatSummitCurrency(record.currency, record.amountDue)],
    ["Currency", record.currency],
    ["Payment method", paymentMethodLabel(record)],
    [paymentReferenceLabel(record), paymentReferenceValue(record)],
    ["Payment date and time", formatDate(record.paymentVerifiedAt || record.capturedAt)],
    ["Internal registration reference", record.id],
  ];

  return rows;
}

function priceRows(pricing: SummitPriceSummary) {
  return [
    pricing.unitPrice ? ["Price per attendee", formatSummitCurrency("USD", pricing.unitPrice)] : null,
    pricing.fixedPackagePrice ? ["Fixed package price", formatSummitCurrency("USD", pricing.fixedPackagePrice)] : null,
  ].filter((row): row is [string, string] => Boolean(row));
}

function brandedEmailHtml({
  heading,
  intro,
  sections,
  supportFooter,
}: {
  heading: string;
  intro: string[];
  sections: string[];
  supportFooter?: false | ReturnType<typeof summitSupportFooter>;
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
                ${sections.join("")}
                ${supportFooter ? supportFooterHtml(supportFooter) : ""}
              </td>
            </tr>
            <tr>
              <td style="background:#edf5f6;color:#4d6267;font-size:12px;line-height:1.6;padding:18px 26px;">
                Francois Consulting Group<br>
                This transactional email was sent in connection with a Human Capacity Summit registration or verified payment.
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

function supportFooterHtml(support: ReturnType<typeof summitSupportFooter>) {
  return `<div style="border-top:1px solid #d9e4e6;margin-top:26px;padding-top:18px;">
    <p style="color:#0f2f35;font-size:12px;font-weight:700;letter-spacing:0.14em;line-height:1.5;margin:0 0 10px;text-transform:uppercase;">Need Assistance?</p>
    <p style="color:#304246;font-size:14px;line-height:1.75;margin:0;">
      If you have any questions about your Summit registration, please contact us at
      <a href="mailto:${escapeHtml(support.email)}" style="color:#9b6b17;text-decoration:underline;">${escapeHtml(support.email)}</a>
      or WhatsApp
      <a href="${escapeHtml(support.whatsAppHref)}" style="color:#9b6b17;text-decoration:underline;">${escapeHtml(support.whatsAppDisplay)}</a>.
    </p>
  </div>`;
}

function detailsSectionHtml(title: string, rows: Array<[string, string]>) {
  return `<div style="margin:0 0 18px;">
    <p style="color:#0f2f35;font-size:12px;font-weight:700;letter-spacing:0.14em;line-height:1.5;margin:0 0 10px;text-transform:uppercase;">${escapeHtml(title)}</p>
    ${detailsTableHtml(rows)}
  </div>`;
}

function highlightBlockHtml(title: string, value: string, note: string) {
  return `<div style="background:#fff7e8;border:1px solid #e7c987;margin:0 0 18px;padding:18px 18px 16px;">
    <p style="color:#9b6b17;font-size:12px;font-weight:700;letter-spacing:0.14em;line-height:1.5;margin:0 0 8px;text-transform:uppercase;">${escapeHtml(title)}</p>
    <p style="color:#0f2f35;font-size:24px;font-weight:700;letter-spacing:0.04em;line-height:1.2;margin:0 0 10px;">${escapeHtml(value)}</p>
    <p style="color:#304246;font-size:14px;line-height:1.65;margin:0;">${escapeHtml(note)}</p>
  </div>`;
}

function noteBlockHtml(message: string) {
  return `<div style="background:#edf5f6;border:1px solid #d9e4e6;margin:0 0 18px;padding:16px 18px;">
    <p style="color:#304246;font-size:14px;line-height:1.65;margin:0;">${escapeHtml(message)}</p>
  </div>`;
}

function buttonBlockHtml(label: string, href: string) {
  const safeHref = escapeHtml(href);

  return `<div style="margin:0 0 18px;">
    <a href="${safeHref}" style="background:#0f2f35;border-radius:999px;color:#ffffff;display:inline-block;font-size:14px;font-weight:700;line-height:1.2;padding:14px 22px;text-decoration:none;">${escapeHtml(label)}</a>
    <p style="color:#304246;font-size:14px;line-height:1.65;margin:14px 0 0;">${safeHref}</p>
  </div>`;
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
  supportFooter,
}: {
  fields: Array<[string, string]>;
  heading: string;
  intro: string[];
  supportFooter?: false | ReturnType<typeof summitSupportFooter>;
}) {
  return [
    heading,
    "",
    ...intro,
    "",
    ...fields.map(([label, value]) => `${label}: ${value}`),
    ...(supportFooter
      ? [
          "",
          "Need Assistance?",
          `Email: ${supportFooter.email}`,
          `WhatsApp: ${supportFooter.whatsAppDisplay}`,
        ]
      : []),
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

function paymentMethodLabel(record: SummitPaymentRecord) {
  return record.paymentMethod === "bank_transfer"
    ? "Direct Bank Transfer"
    : "PayPal / Debit or Credit Card";
}

function paymentReferenceLabel(record: SummitPaymentRecord) {
  return record.paymentMethod === "bank_transfer"
    ? "Payment reference"
    : "PayPal transaction / capture reference";
}

function paymentReferenceValue(record: SummitPaymentRecord) {
  if (record.paymentMethod === "bank_transfer") {
    return record.paymentReference || "Not available";
  }

  return record.captureId || record.paypalOrderId || "Not available";
}

function bankDetailsRows(config: ReturnType<typeof getSummitDirectBankTransferConfig>) {
  return [
    ["Account-holder name", config.bankDetails.accountHolderName],
    ["Bank name", config.bankDetails.bankName],
    ["Account number", config.bankDetails.accountNumber],
    ["Account type", config.bankDetails.accountType],
    config.bankDetails.branchInformation ? ["Branch information", config.bankDetails.branchInformation] : null,
    config.bankDetails.supportsLocalTtdTransfers ? ["TTD account information", config.bankDetails.supportsLocalTtdTransfers] : null,
    config.bankDetails.instructions ? ["Bank transfer instructions", config.bankDetails.instructions] : null,
  ].filter((row): row is [string, string] => Boolean(row));
}

function formatBankTransferDeadline(value: string | undefined, fallbackLabel: string) {
  if (!value) {
    return fallbackLabel;
  }

  return formatDate(value);
}

function summitSupportFooter() {
  const config = getSummitDirectBankTransferConfig();
  const whatsAppDisplay = config.supportWhatsApp || "868-313-3744";
  const whatsAppHref = `https://wa.me/${whatsAppDisplay.replace(/\D/g, "")}`;

  return {
    email: config.supportEmail,
    whatsAppDisplay,
    whatsAppHref,
  };
}

function policyUrl(route: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://francoisconsultinggroup.com";
  return `${siteUrl}${route}`;
}
