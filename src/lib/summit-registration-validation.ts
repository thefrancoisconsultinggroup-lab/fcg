import {
  calculateSummitPrice,
  type SummitCorporatePackageValue,
  type SummitPriceSummary,
  type SummitRegistrationType,
} from "@/lib/summit-pricing";
import type { SummitRegistrationDetails } from "@/lib/summit-registration-records";

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
  registrationType?: unknown;
  role?: unknown;
  website?: unknown;
};

export type ValidSummitRegistration = {
  details: SummitRegistrationDetails;
  paymentMethod: "PayPal";
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
  const paymentMethod = stringValue(payload.paymentMethod);
  const registrationType = stringValue(payload.registrationType) as SummitRegistrationType;
  const corporatePackage = stringValue(payload.corporatePackage) as SummitCorporatePackageValue;
  const attendeeCount = Number.parseInt(stringValue(payload.attendeeCount), 10);

  if (!firstName || !lastName || !email || !country || !organization || !role) {
    return { ok: false, message: "Please complete all required registration fields." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (paymentMethod !== "PayPal") {
    return { ok: false, message: "Please select PayPal as the payment method." };
  }

  if (payload.consent !== true) {
    return { ok: false, message: "Please confirm consent before submitting." };
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
      paymentMethod: "PayPal",
      pricing: pricing.summary,
    },
  };
}

export function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
