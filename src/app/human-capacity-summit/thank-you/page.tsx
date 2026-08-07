import type { Metadata } from "next";
import Link from "next/link";
import { SummitThankYouSync } from "@/components/summit/summit-thank-you-sync";
import { getSummitPaymentRecordById } from "@/lib/summit-registration-records";

export const metadata: Metadata = {
  title: "Thank You | The Human Capacity Summit",
  description: "Your Human Capacity Summit registration has been received.",
  robots: {
    follow: false,
    index: false,
  },
};

export default async function SummitThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; preview?: string; registration?: string }>;
}) {
  const { mode, preview, registration } = await searchParams;
  const previewEnabled = preview === "1" && process.env.NODE_ENV !== "production";
  const record = registration ? await getSummitPaymentRecordById(registration) : null;
  const isBankTransfer =
    mode === "bank-transfer" &&
    (previewEnabled || record?.paymentMethod === "bank_transfer");

  return (
    <main className="min-h-screen bg-[#f7e0b3] px-5 py-28 text-[#3f2a07] sm:px-8">
      {!isBankTransfer ? <SummitThankYouSync registrationId={registration} /> : null}
      <section className="mx-auto grid min-h-[62vh] max-w-3xl content-center justify-items-start gap-7">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.28em] text-[#9b6b17]">
          {isBankTransfer ? "Awaiting Bank Transfer" : "Registration Confirmed"}
        </p>
        <div>
          <h1 className="m-0 font-display text-5xl font-normal tracking-[-0.03em] sm:text-6xl">
            Thank You!
          </h1>
          <div className="mt-5 grid max-w-3xl gap-5 text-lg leading-8 text-[#5f4518]">
            {isBankTransfer ? (
              <>
                <p className="m-0">
                  Thank you for choosing the Bank-to-Bank Transfer payment option.
                </p>
                <p className="m-0">
                  Please check your email for the Human Capacity Summit banking details and payment
                  instructions.
                </p>
                <p className="m-0">
                  If you require any assistance, we would be pleased to help. Please contact us via
                  WhatsApp at (868) 313-3744 or email support@francoisconsultinggroup.com.
                </p>
                <p className="m-0">
                  Once your payment has been confirmed, you will receive your Summit registration
                  confirmation and your Zoom Webinar access details will be sent to you closer to
                  the date.
                </p>
                <p className="m-0">
                  We look forward to welcoming you to this important global conversation on Friday,
                  October 2, 2026.
                </p>
                <p className="m-0">
                  One Home.
                  <br />
                  One Humanity.
                  <br />A Future Worth Building Together.
                </p>
              </>
            ) : (
              <>
                <p className="m-0">
                  Thank you for registering for the Human Capacity Summit.
                </p>
                <p className="m-0">
                  Please check your email for the summary of your registration.
                </p>
                <p className="m-0">
                  If you require any assistance, we would be pleased to help. Please contact us via
                  WhatsApp at (868) 313-3744 or email support@francoisconsultinggroup.com.
                </p>
                <p className="m-0">
                  Your Zoom Webinar access details will be sent to you closer to the date.
                </p>
                <p className="m-0">
                  We look forward to welcoming you to this important global conversation on Friday,
                  October 2, 2026.
                </p>
                <p className="m-0">
                  One Home.
                  <br />
                  One Humanity.
                  <br />A Future Worth Building Together.
                </p>
              </>
            )}
          </div>
        </div>
        <Link
          href="/human-capacity-summit"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#3f2a07] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#65420b] focus-visible:outline-[#3f2a07]"
        >
          Return to Summit Page
        </Link>
      </section>
    </main>
  );
}
