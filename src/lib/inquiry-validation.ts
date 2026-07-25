export type ContactInquiryPayload = {
  email?: unknown;
  message?: unknown;
  name?: unknown;
  organization?: unknown;
  phone?: unknown;
  website?: unknown;
};

export type ProgramInquiryPayload = ContactInquiryPayload & {
  packageName?: unknown;
  teamSize?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const packageNames = ["Gold", "Diamond", "Platinum"] as const;

export type ProgramPackageName = (typeof packageNames)[number];

export function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateContactInquiry(payload: ContactInquiryPayload) {
  const name = stringValue(payload.name);
  const email = stringValue(payload.email).toLowerCase();
  const phone = stringValue(payload.phone);
  const organization = stringValue(payload.organization);
  const message = stringValue(payload.message);

  if (!name || !email || !message) {
    return { ok: false as const, message: "Please add your name, email, and message." };
  }

  if (!emailPattern.test(email)) {
    return { ok: false as const, message: "Please enter a valid email address." };
  }

  return {
    ok: true as const,
    data: {
      email,
      message: limit(message, 4000),
      name: limit(name, 120),
      organization: limit(organization, 160),
      phone: limit(phone, 80),
    },
  };
}

export function validateProgramInquiry(payload: ProgramInquiryPayload) {
  const base = validateContactInquiry(payload);
  const packageName = stringValue(payload.packageName);
  const teamSize = stringValue(payload.teamSize);

  if (!base.ok) {
    return base;
  }

  if (!isProgramPackageName(packageName)) {
    return { ok: false as const, message: "Please select Gold, Diamond, or Platinum." };
  }

  return {
    ok: true as const,
    data: {
      ...base.data,
      packageName,
      teamSize: limit(teamSize, 80),
    },
  };
}

export function isHoneypotFilled(payload: ContactInquiryPayload) {
  return Boolean(stringValue(payload.website));
}

function isProgramPackageName(value: string): value is ProgramPackageName {
  return packageNames.includes(value as ProgramPackageName);
}

function limit(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}
