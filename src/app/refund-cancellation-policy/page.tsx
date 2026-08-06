import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import {
  legalPageMetadata,
  legalPolicyVersions,
} from "@/lib/legal";

const description =
  "Draft refund and cancellation policy structure for The Human Capacity Summit.";

export const metadata: Metadata = legalPageMetadata({
  description,
  route: legalPolicyVersions.refund.route,
  title: legalPolicyVersions.refund.title,
});

export default function RefundCancellationPolicyPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <LegalPage
      title="Refund and Cancellation Policy"
      effectiveDate=""
      lastUpdated=""
    >
      <section>
        <h2>Draft status</h2>
        <p>
          This route is intentionally unpublished in production until approved refund,
          cancellation, postponement, relocation, and transfer rules are provided by the client.
        </p>
      </section>

      <section>
        <h2>Client decisions required before publication</h2>
        <ul>
          <li>Customer cancellation deadline.</li>
          <li>Refund percentage or amount at each deadline.</li>
          <li>Whether any registration fees or PayPal fees are non-refundable.</li>
          <li>Whether registrations may be transferred to another attendee.</li>
          <li>Transfer deadline and transfer procedure.</li>
          <li>How duplicate payments will be handled.</li>
          <li>How failed or declined payments will be handled.</li>
          <li>Whether no-shows are refundable.</li>
          <li>Rules for postponement, relocation, and organiser cancellation.</li>
          <li>How programme or speaker changes affect refunds, if at all.</li>
          <li>Force majeure treatment.</li>
          <li>Refund request method, required information, and processing timeframe.</li>
          <li>Whether currency-conversion differences remain the payer&apos;s responsibility.</li>
          <li>How chargebacks and payment disputes should be handled.</li>
          <li>Final refund-policy contact email.</li>
        </ul>
      </section>
    </LegalPage>
  );
}
