import { NextResponse } from "next/server";
import { isHoneypotFilled, validateProgramInquiry, type ProgramInquiryPayload } from "@/lib/inquiry-validation";
import { escapeHtml, sendSiteEmail } from "@/lib/site-email";

const recipientEmail = process.env.PROGRAM_INQUIRY_RECIPIENT_EMAIL || "hello@francoisconsultinggroup.com";
const fromEmail = process.env.PROGRAM_INQUIRY_FROM_EMAIL || "inquiries@francoisconsultinggroup.com";

export async function POST(request: Request) {
  let payload: ProgramInquiryPayload;

  try {
    payload = (await request.json()) as ProgramInquiryPayload;
  } catch {
    return NextResponse.json({ message: "Please submit a valid program inquiry." }, { status: 400 });
  }

  if (isHoneypotFilled(payload)) {
    return NextResponse.json({ message: "Thank you. Your inquiry has been sent." });
  }

  const validated = validateProgramInquiry(payload);
  if (!validated.ok) {
    return NextResponse.json({ message: validated.message }, { status: 400 });
  }

  const { email, message, name, organization, packageName, phone, teamSize } = validated.data;
  const response = await sendSiteEmail({
    from: fromEmail,
    to: [recipientEmail],
    replyTo: email,
    subject: `${packageName} program inquiry from ${name}`,
    html: `
      <h1>Integrated Leadership &amp; Corporate Wellness Inquiry</h1>
      <p><strong>Selected package:</strong> ${escapeHtml(packageName)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p>
      <p><strong>Organization:</strong> ${escapeHtml(organization || "Not provided")}</p>
      <p><strong>Team size:</strong> ${escapeHtml(teamSize || "Not provided")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
    `,
    text: [
      "Integrated Leadership & Corporate Wellness Inquiry",
      `Selected package: ${packageName}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Organization: ${organization || "Not provided"}`,
      `Team size: ${teamSize || "Not provided"}`,
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

  return NextResponse.json({ message: "Thank you. Your inquiry has been sent." });
}
