export const legalPolicyVersions = {
  privacy: {
    effectiveDate: "2026-08-06",
    lastUpdated: "2026-08-06",
    route: "/privacy-policy",
    title: "Privacy Policy",
    version: "2026-08-06",
  },
  refund: {
    effectiveDate: "2026-08-06",
    lastUpdated: "2026-08-06",
    published: true,
    route: "/refund-cancellation-policy",
    title: "Refund and Cancellation Policy",
    version: "2026-08-06",
  },
  terms: {
    effectiveDate: "2026-08-06",
    lastUpdated: "2026-08-06",
    route: "/terms-and-conditions",
    title: "Terms and Conditions",
    version: "2026-08-06",
  },
} as const;

export function isRefundPolicyPublished() {
  return legalPolicyVersions.refund.published;
}

export function formatPolicyDate(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

export function legalPageMetadata({
  description,
  route,
  title,
}: {
  description: string;
  route: string;
  title: string;
}) {
  return {
    title,
    description,
    alternates: {
      canonical: route,
    },
    openGraph: {
      title: `${title} | Francois Consulting Group`,
      description,
      siteName: "Francois Consulting Group",
      type: "website" as const,
      url: route,
    },
  };
}

export function summitPolicyAcceptanceSnapshot() {
  return {
    accepted: true as const,
    acceptedAt: new Date().toISOString(),
    privacyPolicyEffectiveDate: legalPolicyVersions.privacy.effectiveDate,
    privacyPolicyVersion: legalPolicyVersions.privacy.version,
    refundPolicyEffectiveDate: legalPolicyVersions.refund.published
      ? legalPolicyVersions.refund.effectiveDate
      : undefined,
    refundPolicyVersion: legalPolicyVersions.refund.published
      ? legalPolicyVersions.refund.version
      : undefined,
    termsEffectiveDate: legalPolicyVersions.terms.effectiveDate,
    termsVersion: legalPolicyVersions.terms.version,
  };
}
