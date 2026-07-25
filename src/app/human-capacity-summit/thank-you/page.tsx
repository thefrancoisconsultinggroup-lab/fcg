import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank You | The Human Capacity Summit",
  description: "Your Human Capacity Summit registration has been received.",
  robots: {
    follow: false,
    index: false,
  },
};

export default function SummitThankYouPage() {
  return (
    <main className="min-h-screen bg-[#f7e0b3] px-5 py-28 text-[#3f2a07] sm:px-8">
      <section className="mx-auto grid min-h-[62vh] max-w-3xl content-center justify-items-start gap-7">
        <p className="m-0 text-xs font-bold uppercase tracking-[0.28em] text-[#9b6b17]">
          Registration Confirmed
        </p>
        <div>
          <h1 className="m-0 font-display text-5xl font-normal tracking-[-0.03em] sm:text-6xl">
            Thank You
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f4518]">
            Your Human Capacity Summit registration has been received. A confirmation
            email from Francois Consulting Group will be sent to the email address used
            during registration.
          </p>
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
