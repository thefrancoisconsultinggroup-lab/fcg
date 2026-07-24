import type { SummitPriceSummary } from "@/lib/summit-pricing";
import type { SummitRegistrationDetails } from "@/lib/summit-registration-records";

export async function sendSummitRegistrationEmails({
  captureId,
  paypalOrderId,
  pricing,
  registration,
}: {
  captureId: string;
  paypalOrderId: string;
  pricing: SummitPriceSummary;
  registration: SummitRegistrationDetails;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.SUMMIT_REGISTRATION_RECIPIENT_EMAIL;
  const from = process.env.SUMMIT_REGISTRATION_FROM_EMAIL;

  if (!apiKey || !recipient || !from) {
    return {
      ok: false as const,
      message:
        "Payment was captured, but registration email is not configured. Please contact Francois Consulting Group with your PayPal confirmation.",
    };
  }

  const fullName = `${registration.firstName} ${registration.lastName}`;
  const emailResponse = await sendEmail({
    apiKey,
    from,
    to: [recipient],
    replyTo: registration.email,
    subject: `Paid Human Capacity Summit registration: ${fullName}`,
    html: registrationHtml({ captureId, paypalOrderId, pricing, registration }),
    text: registrationText({ captureId, paypalOrderId, pricing, registration }),
  });

  if (!emailResponse.ok) {
    return {
      ok: false as const,
      message:
        "Payment was captured, but we could not send the registration email. Please contact Francois Consulting Group with your PayPal confirmation.",
    };
  }

  await sendEmail({
    apiKey,
    from,
    to: [registration.email],
    subject: "Your Human Capacity Summit payment and registration are confirmed",
    html: acknowledgementHtml(fullName, pricing),
    text: acknowledgementText(fullName, pricing),
  }).catch(() => undefined);

  return { ok: true as const };
}

async function sendEmail({
  apiKey,
  from,
  to,
  replyTo,
  subject,
  html,
  text,
}: {
  apiKey: string;
  from: string;
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string[];
}) {
  return fetch("https://api.resend.com/emails", {
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
}

function registrationHtml({
  captureId,
  paypalOrderId,
  pricing,
  registration,
}: {
  captureId: string;
  paypalOrderId: string;
  pricing: SummitPriceSummary;
  registration: SummitRegistrationDetails;
}) {
  return `
    <h1>Paid Human Capacity Summit Registration</h1>
    <p><strong>Name:</strong> ${escapeHtml(registration.firstName)} ${escapeHtml(registration.lastName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(registration.email)}</p>
    <p><strong>Mobile / WhatsApp:</strong> ${escapeHtml(registration.phone || "Not provided")}</p>
    <p><strong>Country:</strong> ${escapeHtml(registration.country)}</p>
    <p><strong>Organization:</strong> ${escapeHtml(registration.organization)}</p>
    <p><strong>Role:</strong> ${escapeHtml(registration.role)}</p>
    <p><strong>Category:</strong> ${escapeHtml(pricing.categoryLabel)}</p>
    <p><strong>Rate / package:</strong> ${escapeHtml(pricing.rateLabel)} - ${escapeHtml(pricing.rateDetail)}</p>
    <p><strong>People attending:</strong> ${pricing.attendeeCount}</p>
    ${pricing.unitPrice ? `<p><strong>Price per attendee:</strong> $${pricing.unitPrice}</p>` : ""}
    ${pricing.fixedPackagePrice ? `<p><strong>Fixed package price:</strong> $${pricing.fixedPackagePrice.toLocaleString("en-US")}</p>` : ""}
    <p><strong>Total paid:</strong> $${pricing.total.toLocaleString("en-US")}</p>
    <p><strong>PayPal order ID:</strong> ${escapeHtml(paypalOrderId)}</p>
    <p><strong>PayPal capture ID:</strong> ${escapeHtml(captureId)}</p>
    <p><strong>Dietary notes:</strong> ${escapeHtml(registration.dietaryNotes || "None provided")}</p>
    <p><strong>Accessibility needs:</strong> ${escapeHtml(registration.accessibilityNeeds || "None provided")}</p>
    <p><strong>Hopes for the Summit:</strong> ${escapeHtml(registration.hopes || "None provided")}</p>
  `;
}

function registrationText({
  captureId,
  paypalOrderId,
  pricing,
  registration,
}: {
  captureId: string;
  paypalOrderId: string;
  pricing: SummitPriceSummary;
  registration: SummitRegistrationDetails;
}) {
  return [
    "Paid Human Capacity Summit Registration",
    `Name: ${registration.firstName} ${registration.lastName}`,
    `Email: ${registration.email}`,
    `Mobile / WhatsApp: ${registration.phone || "Not provided"}`,
    `Country: ${registration.country}`,
    `Organization: ${registration.organization}`,
    `Role: ${registration.role}`,
    `Category: ${pricing.categoryLabel}`,
    `Rate / package: ${pricing.rateLabel} - ${pricing.rateDetail}`,
    `People attending: ${pricing.attendeeCount}`,
    pricing.unitPrice ? `Price per attendee: $${pricing.unitPrice}` : "",
    pricing.fixedPackagePrice
      ? `Fixed package price: $${pricing.fixedPackagePrice.toLocaleString("en-US")}`
      : "",
    `Total paid: $${pricing.total.toLocaleString("en-US")}`,
    `PayPal order ID: ${paypalOrderId}`,
    `PayPal capture ID: ${captureId}`,
    `Dietary notes: ${registration.dietaryNotes || "None provided"}`,
    `Accessibility needs: ${registration.accessibilityNeeds || "None provided"}`,
    `Hopes for the Summit: ${registration.hopes || "None provided"}`,
  ].filter(Boolean).join("\n");
}

function acknowledgementHtml(fullName: string, pricing: SummitPriceSummary) {
  return `
    <h1>Thank you, ${escapeHtml(fullName)}</h1>
    <p>Your Human Capacity Summit registration and payment have been confirmed.</p>
    <p><strong>Total paid:</strong> $${pricing.total.toLocaleString("en-US")} USD</p>
  `;
}

function acknowledgementText(fullName: string, pricing: SummitPriceSummary) {
  return [
    `Thank you, ${fullName}.`,
    "Your Human Capacity Summit registration and payment have been confirmed.",
    `Total paid: $${pricing.total.toLocaleString("en-US")} USD`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
