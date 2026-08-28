import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import {
  formatPolicyDate,
  legalPageMetadata,
  legalPolicyVersions,
} from "@/lib/legal";

const description =
  "Refund and cancellation policy for Human Capacity Summit registrations.";

export const metadata: Metadata = legalPageMetadata({
  description,
  route: legalPolicyVersions.refund.route,
  title: legalPolicyVersions.refund.title,
});

export default function RefundCancellationPolicyPage() {
  return (
    <LegalPage
      title="Refund and Cancellation Policy"
      effectiveDate={formatPolicyDate(legalPolicyVersions.refund.effectiveDate)}
      lastUpdated={formatPolicyDate(legalPolicyVersions.refund.lastUpdated)}
    >
      <section>
        <h2>Our Commitment to You</h2>
        <p>
          At Francois Consulting Group, we are committed to creating an exceptional Summit
          experience. We understand that plans can change, and we will do our best to assist while
          also honoring the significant planning and production commitments required to deliver a
          high-quality global event.
        </p>
      </section>

      <section>
        <h2>Refund Schedule</h2>
        <article>
          <h3>Early Bird Registration (through September 7, 2026)</h3>
          <p>
            Registrations may be cancelled for a <strong>full refund</strong> if the request is
            received within <strong>14 days of the original purchase date</strong> and no later
            than <strong>September 7, 2026</strong>.
          </p>
        </article>
        <article>
          <h3>Advanced Registration (September 8 to September 25, 2026)</h3>
          <p>
            Registrations may be cancelled for a <strong>50% refund</strong> if the request is
            received on or before <strong>September 25, 2026</strong>.
          </p>
        </article>
        <article>
          <h3>Standard Registration (September 26 to October 1, 2026)</h3>
          <p>
            Registrations purchased during the Standard Registration period are{" "}
            <strong>non-refundable</strong>.
          </p>
        </article>
      </section>

      <section>
        <h2>Registration Policy</h2>
        <p>
          Summit registrations are issued to the original purchaser and{" "}
          <strong>may not be transferred</strong> to another individual.
        </p>
      </section>

      <section>
        <h2>Programme Changes</h2>
        <p>
          Every effort will be made to present the advertised programme, speakers, session topics,
          and schedule. However, Francois Consulting Group reserves the right to make changes where
          circumstances require. Such changes do not constitute grounds for a refund.
        </p>
      </section>

      <section>
        <h2>Event Cancellation</h2>
        <p>
          If the Human Capacity Summit is cancelled by Francois Consulting Group, registered
          attendees will be offered the option of:
        </p>
        <ul>
          <li>A <strong>full refund</strong> of the registration fee.</li>
          <li>
            A transfer of the registration to the rescheduled Human Capacity Summit.
          </li>
        </ul>
      </section>

      <section>
        <h2>Technical Requirements</h2>
        <p>
          Attendees are responsible for ensuring they have a reliable internet connection, a
          compatible device, and the ability to access the virtual event platform. Technical issues
          arising from an attendee&apos;s equipment, internet service, or system configuration do
          not qualify for a refund.
        </p>
      </section>

      <section>
        <h2>Exceptional Circumstances</h2>
        <p>
          Requests arising from exceptional circumstances may be considered at the sole discretion
          of Francois Consulting Group.
        </p>
      </section>

      <section>
        <h2>Refund Processing</h2>
        <p>
          Approved refunds will be issued to the original method of payment and processed within{" "}
          <strong>10 to 14 business days</strong> of approval.
        </p>
      </section>

      <section>
        <h2>Related Policies</h2>
        <p>
          This policy should be read together with the{" "}
          <Link href={legalPolicyVersions.terms.route}>Terms and Conditions</Link> and{" "}
          <Link href={legalPolicyVersions.privacy.route}>Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
