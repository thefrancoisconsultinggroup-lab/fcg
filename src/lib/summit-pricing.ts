export type SummitRegistrationType = "individual" | "corporate";
export type SummitIndividualRateValue = "early-bird" | "advance" | "standard";
export type SummitCorporateRateWindow = "early-bird" | "standard";
export type SummitCorporatePackageValue =
  | "corporate-early-bird-10"
  | "corporate-early-bird-20"
  | "corporate-10"
  | "corporate-20";

export const summitTimeZone = "America/Port_of_Spain";
export const summitDateLabel = "October 2, 2026";
export const summitStartIso = "2026-10-02T00:00:00-04:00";

export type SummitPricingSelection = {
  attendeeCount: number;
  corporatePackage?: SummitCorporatePackageValue;
  registrationType: SummitRegistrationType;
};

export type SummitPriceSummary = {
  attendeeCount: number;
  categoryLabel: string;
  corporateCapacity?: number;
  fixedPackagePrice?: number;
  originalPrice?: number;
  rateDetail: string;
  rateLabel: string;
  rateValue: SummitIndividualRateValue | SummitCorporatePackageValue;
  total: number;
  unitPrice?: number;
};

export const summitIndividualRates = [
  {
    value: "early-bird",
    label: "Early Bird",
    detail: "Ends August 15, 2026",
    price: 45,
    endsOn: "2026-08-15",
  },
  {
    value: "advance",
    label: "Advance Registration",
    detail: "Ends September 15, 2026",
    price: 75,
    endsOn: "2026-09-15",
  },
  {
    value: "standard",
    label: "Standard Registration",
    detail: "Ends October 1, 2026",
    price: 105,
    endsOn: "2026-10-01",
  },
] as const satisfies ReadonlyArray<{
  detail: string;
  endsOn: string;
  label: string;
  price: number;
  value: SummitIndividualRateValue;
}>;

export const summitCorporatePackages = [
  {
    value: "corporate-early-bird-10",
    label: "Early Bird Corporate Group of up to 10",
    detail: "Ends August 15, 2026",
    capacity: 10,
    endsOn: "2026-08-15",
    price: 450,
    rateWindow: "early-bird",
    startsOn: undefined,
    originalPrice: 600,
  },
  {
    value: "corporate-early-bird-20",
    label: "Early Bird Corporate Group of up to 20",
    detail: "Ends August 15, 2026",
    capacity: 20,
    endsOn: "2026-08-15",
    price: 900,
    rateWindow: "early-bird",
    startsOn: undefined,
    originalPrice: 1200,
  },
  {
    value: "corporate-10",
    label: "Corporate Group of up to 10",
    detail: "Regular corporate package",
    capacity: 10,
    endsOn: "2026-10-01",
    originalPrice: undefined,
    price: 600,
    rateWindow: "standard",
    startsOn: "2026-08-16",
  },
  {
    value: "corporate-20",
    label: "Corporate Group of up to 20",
    detail: "Regular corporate package",
    capacity: 20,
    endsOn: "2026-10-01",
    originalPrice: undefined,
    price: 1200,
    rateWindow: "standard",
    startsOn: "2026-08-16",
  },
] as const satisfies ReadonlyArray<{
  capacity: number;
  detail: string;
  endsOn: string;
  label: string;
  originalPrice?: number;
  price: number;
  rateWindow: SummitCorporateRateWindow;
  startsOn?: string;
  value: SummitCorporatePackageValue;
}>;

export function getActiveSummitIndividualRate(now = new Date()) {
  const today = trinidadDateKey(now);
  return summitIndividualRates.find((rate) => today <= rate.endsOn) ?? null;
}

export function getActiveSummitCorporatePackages(now = new Date()) {
  const today = trinidadDateKey(now);
  return summitCorporatePackages.filter((corporatePackage) => {
    const startsOn = corporatePackage.startsOn ?? "0000-01-01";
    return today >= startsOn && today <= corporatePackage.endsOn;
  });
}

export function isSummitIndividualRateActive(
  rateValue: SummitIndividualRateValue,
  now = new Date(),
) {
  return getActiveSummitIndividualRate(now)?.value === rateValue;
}

export function isSummitCorporatePackageActive(
  packageValue: SummitCorporatePackageValue,
  now = new Date(),
) {
  return getActiveSummitCorporatePackages(now).some(
    (corporatePackage) => corporatePackage.value === packageValue,
  );
}

export function calculateSummitPrice(selection: SummitPricingSelection, now = new Date()):
  | { ok: true; summary: SummitPriceSummary }
  | { ok: false; message: string } {
  const attendeeCount = normalizedAttendeeCount(selection.attendeeCount);

  if (!attendeeCount || attendeeCount < 1 || attendeeCount > 500) {
    return { ok: false, message: "Please enter a valid number of people attending." };
  }

  if (selection.registrationType === "individual") {
    const rate = getActiveSummitIndividualRate(now);

    if (!rate) {
      return { ok: false, message: "Summit registration is no longer available online." };
    }

    return {
      ok: true,
      summary: {
        attendeeCount,
        categoryLabel: "Individual registration",
        rateDetail: rate.detail,
        rateLabel: rate.label,
        rateValue: rate.value,
        total: rate.price * attendeeCount,
        unitPrice: rate.price,
      },
    };
  }

  if (selection.registrationType === "corporate") {
    const selectedPackage = summitCorporatePackages.find(
      (corporatePackage) => corporatePackage.value === selection.corporatePackage,
    );

    if (!selectedPackage) {
      return { ok: false, message: "Please select a valid corporate package." };
    }

    if (!isSummitCorporatePackageActive(selectedPackage.value, now)) {
      return {
        ok: false,
        message: `${selectedPackage.label} is not available in the current registration window.`,
      };
    }

    if (attendeeCount > selectedPackage.capacity) {
      return {
        ok: false,
        message: `The ${selectedPackage.label} package allows a maximum of ${selectedPackage.capacity} attendees.`,
      };
    }

    return {
      ok: true,
      summary: {
        attendeeCount,
        categoryLabel: "Corporate group registration",
        corporateCapacity: selectedPackage.capacity,
        fixedPackagePrice: selectedPackage.price,
        originalPrice: selectedPackage.originalPrice,
        rateDetail: selectedPackage.detail,
        rateLabel: selectedPackage.label,
        rateValue: selectedPackage.value,
        total: selectedPackage.price,
      },
    };
  }

  return { ok: false, message: "Please select a valid registration category." };
}

function normalizedAttendeeCount(value: number) {
  return Number.isInteger(value) ? value : Number.NaN;
}

export function trinidadDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: summitTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
