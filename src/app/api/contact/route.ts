import { NextResponse } from "next/server";
import { isHoneypotFilled, validateContactInquiry, type ContactInquiryPayload } from "@/lib/inquiry-validation";
import { escapeHtml, sendSiteEmail } from "@/lib/site-email";

const recipientEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL || "hello@francoisconsultinggroup.com";
const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL || "contact@francoisconsultinggroup.com";

export async function POST(request: Request) {
  let payload: ContactInquiryPayload;

  try {
    payload = (await request.json()) as ContactInquiryPayload;
  } catch {
    return NextResponse.json({ message: "Please submit a valid contact form." }, { status: 400 });
  }

  if (isHoneypotFilled(payload)) {
    return NextResponse.json({ message: "Thank you. Your message has been sent." });
  }

  const validated = validateContactInquiry(payload);
  if (!validated.ok) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  const { email, message, name, organization, phone } = validated.data;
  const response = await sendSiteEmail({
    from: fromEmail,
    to: [recipientEmail],
    replyTo: email,
    subject: `Website contact inquiry from ${name}`,
    html: `
      <h1>Website Contact Inquiry</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
      <p><strong>Organization:</strong> ${escapeHtml(organization || "Not provided")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
    `,
    text: [
      "Website Contact Inquiry",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Organization: ${organization || "Not provided"}`,
      "",
      message,
    ].join("\n"),
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: "Email sending is not configured yet. Please try again later." },
      { status: response.status },
    );
  }

  return NextResponse.json({ message: "Thank you. Your message has been sent." });
}
