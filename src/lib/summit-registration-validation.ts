import {
  calculateSummitPrice,
  type SummitCorporatePackageValue,
  type SummitPriceSummary,
  type SummitRegistrationType,
} from "@/lib/summit-pricing";
import { isRefundPolicyPublished } from "@/lib/legal";
import type { SummitRegistrationDetails } from "@/lib/summit-registration-records";
import {
  summitPaymentAmounts,
  type SummitPaymentMethod,
} from "@/lib/summit-bank-transfer";

export type SummitRegistrationPayload = {
  accessibilityNeeds?: unknown;
  attendeeCount?: unknown;
  consent?: unknown;
  corporatePackage?: unknown;
  country?: unknown;
  dietaryNotes?: unknown;
  email?: unknown;
  firstName?: unknown;
  hopes?: unknown;
  lastName?: unknown;
  manipulatedAmount?: unknown;
  organization?: unknown;
  paymentMethod?: unknown;
  phone?: unknown;
  policyAcceptance?: unknown;
  registrationType?: unknown;
  role?: unknown;
  website?: unknown;
};

export type ValidSummitRegistration = {
  details: SummitRegistrationDetails;
  paymentMethod: SummitPaymentMethod;
  paymentSummary: ReturnType<typeof summitPaymentAmounts>;
  pricing: SummitPriceSummary;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSummitRegistrationPayload(
  payload: SummitRegistrationPayload,
  now = new Date(),
):
  | { ok: true; registration: ValidSummitRegistration }
  | { ok: false; message: string } {
  const firstName = stringValue(payload.firstName);
  const lastName = stringValue(payload.lastName);
  const email = stringValue(payload.email).toLowerCase();
  const country = stringValue(payload.country);
  const organization = stringValue(payload.organization);
  const role = stringValue(payload.role);
  const paymentMethod = normalizePaymentMethod(payload.paymentMethod);
  const registrationType = stringValue(payload.registrationType) as SummitRegistrationType;
  const corporatePackage = stringValue(payload.corporatePackage) as SummitCorporatePackageValue;
  const attendeeCount = Number.parseInt(stringValue(payload.attendeeCount), 10);

  if (!firstName || !lastName || !email || !country || !organization || !role) {
    return { ok: false, message: "Please complete all required registration fields." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (!paymentMethod) {
    return { ok: false, message: "Please select a valid payment method." };
  }

  if (payload.policyAcceptance !== true) {
    return {
      ok: false,
      message: isRefundPolicyPublished()
        ? "Please confirm that you agree to the Terms and Conditions, Refund and Cancellation Policy, and Privacy Policy before continuing."
        : "Please confirm that you agree to the Terms and Conditions and Privacy Policy before continuing.",
    };
  }

  const pricing = calculateSummitPrice(
    {
      attendeeCount,
      corporatePackage,
      registrationType,
    },
    now,
  );

  if (!pricing.ok) {
    return pricing;
  }

  const paymentSummary = summitPaymentAmounts(pricing.summary, paymentMethod);

  return {
    ok: true,
    registration: {
      details: {
        accessibilityNeeds: stringValue(payload.accessibilityNeeds),
        country,
        dietaryNotes: stringValue(payload.dietaryNotes),
        email,
        firstName,
        hopes: stringValue(payload.hopes),
        lastName,
        organization,
        phone: stringValue(payload.phone),
        role,
      },
      paymentMethod,
      paymentSummary,
      pricing: pricing.summary,
    },
  };
}

export function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePaymentMethod(value: unknown): SummitPaymentMethod | null {
  const normalized = stringValue(value).toLowerCase();

  if (normalized === "paypal") {
    return "paypal";
  }

  if (normalized === "bank_transfer") {
    return "bank_transfer";
  }

  return null;
}
