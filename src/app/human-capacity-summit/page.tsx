import type { Metadata } from "next";
import { HumanCapacitySummitPage } from "@/components/summit/human-capacity-summit-page";
import { getSummitDirectBankTransferPublicConfig } from "@/lib/summit-bank-transfer";
import { getPayPalClientId, getPayPalEnvironment } from "@/lib/paypal";

const title = "The Human Capacity Summit";
const description =
  "Join The Human Capacity Summit on October 2, 2026—bringing together thought leaders, changemakers and visionaries to explore a future worth building together.";
const route = "/human-capacity-summit";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: route,
  },
  openGraph: {
    title: `${title} | Francois Consulting Group`,
    description,
    url: route,
    siteName: "Francois Consulting Group",
    type: "website",
    images: [
      {
        url: "/assets/summit/human-capacity-summit-hero.webp",
        width: 1920,
        height: 1080,
        alt: "The Human Capacity Summit",
      },
    ],
  },
};

const eventStructuredData = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "The Human Capacity Summit",
  description,
  startDate: "2026-10-02",
  image: "https://francoisconsultinggroup.com/assets/summit/human-capacity-summit-hero.webp",
  url: "https://francoisconsultinggroup.com/human-capacity-summit",
  organizer: {
    "@type": "Organization",
    name: "Francois Consulting Group",
    url: "https://francoisconsultinggroup.com",
  },
};

export default function Page() {
  const bankTransfer = getSummitDirectBankTransferPublicConfig();
  const paypalClientId = getPayPalClientId();
  const paypalEnvironment = getPayPalEnvironment();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData) }}
      />
      <HumanCapacitySummitPage
        bankTransferEnabled={bankTransfer.enabled}
        paypalClientId={paypalClientId}
        paypalEnvironment={paypalEnvironment}
      />
    </>
  );
}
