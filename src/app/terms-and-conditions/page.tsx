import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import {
  formatPolicyDate,
  legalPageMetadata,
  legalPolicyVersions,
} from "@/lib/legal";

const description =
  "Terms and Conditions for website use and Human Capacity Summit registrations.";

export const metadata: Metadata = legalPageMetadata({
  description,
  route: legalPolicyVersions.terms.route,
  title: legalPolicyVersions.terms.title,
});

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      effectiveDate={formatPolicyDate(legalPolicyVersions.terms.effectiveDate)}
      lastUpdated={formatPolicyDate(legalPolicyVersions.terms.lastUpdated)}
    >
      <section>
        <h2>1. Operator and organiser</h2>
        <p>
          This website and The Human Capacity Summit are operated by Francois Consulting Group. For
          questions about these Terms, please contact hello@francoisconsultinggroup.com.
        </p>
      </section>

      <section>
        <h2>2. Acceptance of these Terms</h2>
        <p>
          By using this website, submitting an enquiry, or registering for The Human Capacity
          Summit, you agree to these Terms and Conditions, the{" "}
          <Link href={legalPolicyVersions.refund.route}>Refund and Cancellation Policy</Link>, and
          the related <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>3. Website use</h2>
        <p>
          You may use this website only for lawful purposes, genuine enquiries, and legitimate
          event or service engagement. You must not misuse the website, interfere with its
          operation, attempt unauthorised access, or submit false, abusive, or misleading content.
        </p>
      </section>

      <section>
        <h2>4. Intellectual property</h2>
        <p>
          Website content, branding, graphics, editorial content, and event materials remain the
          property of Francois Consulting Group or the relevant rights holders unless otherwise
          stated.
        </p>
      </section>

      <section>
        <h2>5. Information accuracy and availability</h2>
        <p>
          Reasonable efforts are made to keep the website accurate and available, but content may
          change and uninterrupted availability is not guaranteed.
        </p>
      </section>

      <section>
        <h2>6. Third-party services and links</h2>
        <p>
          This website may link to third-party services, including PayPal. Francois Consulting
          Group is not responsible for third-party content, availability, or independent terms.
        </p>
      </section>

      <section>
        <h2>7. No professional reliance</h2>
        <p>
          General website content is provided for informational purposes and should not be treated
          as legal, financial, medical, or other regulated professional advice.
        </p>
      </section>

      <section>
        <h2>8. Summit registration terms</h2>
        <ul>
          <li>
            Event: The Human Capacity Summit, scheduled for October 2, 2026, online.
          </li>
          <li>Organiser: Francois Consulting Group.</li>
          <li>Registrants must provide accurate attendee and billing information and keep it updated.</li>
          <li>All prices displayed on the site are in USD.</li>
          <li>PayPal / Debit or Credit Card registrations remain priced and charged in USD worldwide.</li>
          <li>Direct Bank Transfer is available only for payments sent in TTD from a Trinidad and Tobago bank account.</li>
          <li>Direct Bank Transfer registrations are priced in TTD using the fixed Summit rate of USD 1 = TTD 7.</li>
          <li>Individual rates are charged per attendee.</li>
          <li>Corporate packages are offered for up to 10 or up to 20 attendees.</li>
          <li>Corporate package prices are flat package prices and are not multiplied by attendee count.</li>
        </ul>
      </section>

      <section>
        <h2>9. Payment terms</h2>
        <ul>
          <li>Payments may be made by PayPal / Debit or Credit Card or, where offered, Direct Bank Transfer.</li>
          <li>
            Submission of a registration form or creation of a PayPal order does not by itself
            create a completed or paid registration.
          </li>
          <li>
            Submission of a Direct Bank Transfer registration does not confirm payment or secure a confirmed place.
          </li>
          <li>
            Registration is confirmed only after the payment is successfully captured and a
            confirmation is issued.
          </li>
          <li>
            Direct Bank Transfer registrations remain pending until the funds are received and verified by Francois Consulting Group.
          </li>
          <li>
            Customers must use the payment reference supplied after a Direct Bank Transfer registration is submitted.
          </li>
          <li>
            A bank-transfer payment deadline applies. Deadline handling after expiry remains{" "}
            <strong>[CLIENT TO CONFIRM]</strong>.
          </li>
          <li>
            Underpayments, overpayments, incorrect references, and bank-charge responsibility remain{" "}
            <strong>[CLIENT TO CONFIRM]</strong> and may require manual review.
          </li>
          <li>
            Failed, declined, reversed, disputed, incomplete, or otherwise unverified payments do
            not create a confirmed registration.
          </li>
        </ul>
      </section>

      <section>
        <h2>10. Cancellation, refund, and transfer policy</h2>
        <p>
          Refund, cancellation, event-cancellation, and non-transferability rules for Summit
          registrations are governed by the separate{" "}
          <Link href={legalPolicyVersions.refund.route}>Refund and Cancellation Policy</Link>,
          which forms part of these Terms.
        </p>
      </section>

      <section>
        <h2>11. Event changes</h2>
        <p>
          Speakers, programme details, scheduling, and venue or delivery arrangements may change
          where reasonably necessary. Refund rights relating to organiser cancellation are set out
          in the <Link href={legalPolicyVersions.refund.route}>Refund and Cancellation Policy</Link>.
        </p>
      </section>

      <section>
        <h2>12. Attendee conduct</h2>
        <p>
          Francois Consulting Group may refuse or remove participation where behaviour is
          dangerous, abusive, unlawful, fraudulent, or seriously disruptive.
        </p>
      </section>

      <section>
        <h2>13. Photography and recording</h2>
        <p>
          Photography, recording, or media use at the event may be subject to additional event
          guidelines communicated by the organiser.
        </p>
      </section>

      <section>
        <h2>14. Accessibility and accommodation requests</h2>
        <p>
          Accessibility or accommodation requests should be submitted through the organiser
          contact details used for registration.
        </p>
      </section>

      <section>
        <h2>15. Travel and personal expenses</h2>
        <p>
          Unless expressly stated otherwise, attendees are responsible for their own travel, visa,
          accommodation, transport, and incidental costs.
        </p>
      </section>

      <section>
        <h2>16. Personal property</h2>
        <p>Attendees remain responsible for their own devices, credentials, and personal property.</p>
      </section>

      <section>
        <h2>17. Force majeure</h2>
        <p>
          Francois Consulting Group is not responsible for delay or failure caused by events
          outside its reasonable control, including infrastructure failures, government action,
          severe weather, utility outages, or similar disruption.
        </p>
      </section>

      <section>
        <h2>18. Liability</h2>
        <p>
          To the fullest extent permitted by law, Francois Consulting Group is not liable for
          indirect, incidental, special, or consequential loss arising from use of this website or
          participation in the event.
        </p>
      </section>

      <section>
        <h2>19. Privacy Policy</h2>
        <p>
          Use of personal information is also governed by the{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>20. Governing law and disputes</h2>
        <p>
          These Terms are governed by the laws applicable to Francois Consulting Group and its
          operations.
        </p>
      </section>

      <section>
        <h2>21. Severability, waiver, and changes</h2>
        <p>
          If any part of these Terms is found unenforceable, the remaining sections should remain
          in effect to the extent permitted. A failure to enforce any provision is not a waiver of
          later enforcement. These Terms may be updated by posting a revised version on this page.
        </p>
      </section>
    </LegalPage>
  );
}
