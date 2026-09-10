import assert from "node:assert/strict";
import test from "node:test";
import { summitPaymentAmounts } from "@/lib/summit-bank-transfer";
import { calculateSummitPrice } from "@/lib/summit-pricing";
import { isSummitPaymentCaptured } from "@/lib/summit-registration-records";
import { validateSummitRegistrationPayload } from "@/lib/summit-registration-validation";

const earlyBirdDate = new Date("2026-07-23T12:00:00.000Z");
const extendedEarlyBirdDate = new Date("2026-09-29T12:00:00.000Z");

test("1 Early Bird attendee = US$45", () => {
  const result = calculateSummitPrice({ attendeeCount: 1, registrationType: "individual" }, earlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 45);
});

test("10 Early Bird attendees = US$450", () => {
  const result = calculateSummitPrice({ attendeeCount: 10, registrationType: "individual" }, earlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 450);
});

test("10 individual attendees remain US$450 during the extended Early Bird window", () => {
  const result = calculateSummitPrice(
    { attendeeCount: 10, registrationType: "individual" },
    extendedEarlyBirdDate,
  );
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 450);
});

test("20 individual attendees remain US$900 during the extended Early Bird window", () => {
  const result = calculateSummitPrice(
    { attendeeCount: 20, registrationType: "individual" },
    extendedEarlyBirdDate,
  );
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 900);
});

test("Early Bird Corporate Group of 10 with 10 attendees = US$450", () => {
  const result = calculateSummitPrice({
    attendeeCount: 10,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  }, earlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 450);
  assert.equal(result.ok && result.summary.originalPrice, undefined);
});

test("Early Bird Corporate Group of 20 with 20 attendees = US$900", () => {
  const result = calculateSummitPrice({
    attendeeCount: 20,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  }, earlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 900);
  assert.equal(result.ok && result.summary.originalPrice, undefined);
});

test("Individual and corporate bank-transfer totals use the advertised TTD prices", () => {
  const individual = calculateSummitPrice(
    { attendeeCount: 1, registrationType: "individual" },
    extendedEarlyBirdDate,
  );
  const corporate10 = calculateSummitPrice({
    attendeeCount: 10,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  const corporate20 = calculateSummitPrice({
    attendeeCount: 20,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);

  assert.equal(individual.ok && summitPaymentAmounts(individual.summary, "bank_transfer").amountDue, 315);
  assert.equal(corporate10.ok && summitPaymentAmounts(corporate10.summary, "bank_transfer").amountDue, 3150);
  assert.equal(corporate20.ok && summitPaymentAmounts(corporate20.summary, "bank_transfer").amountDue, 6300);
});

for (const [instant, registrationOpen] of [
  ["2026-10-01T00:00:00-04:00", true],
  ["2026-10-01T23:59:59.999-04:00", true],
  ["2026-10-02T00:00:00-04:00", false],
] as const) {
  test(`Individual Early Bird registration closes after October 1 in Trinidad: ${instant}`, () => {
    const result = calculateSummitPrice(
      { attendeeCount: 1, registrationType: "individual" },
      new Date(instant),
    );
    assert.equal(result.ok, registrationOpen);
    assert.equal(result.ok && result.summary.rateValue, registrationOpen ? "early-bird" : false);
    assert.equal(result.ok && result.summary.total, registrationOpen ? 45 : false);
  });

  test(`Corporate Early Bird registration closes after October 1 in Trinidad: ${instant}`, () => {
    for (const capacity of [10, 20] as const) {
      const earlyBird = calculateSummitPrice({
        attendeeCount: capacity,
        corporatePackage: `corporate-early-bird-${capacity}`,
        registrationType: "corporate",
      }, new Date(instant));
      assert.equal(earlyBird.ok, registrationOpen);
    }
  });
}

test("Corporate Group of 10 with 7 attendees = US$450", () => {
  const result = calculateSummitPrice({
    attendeeCount: 7,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 450);
});

test("Corporate Group of 10 with 11 attendees = rejected", () => {
  const result = calculateSummitPrice({
    attendeeCount: 11,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  assert.equal(result.ok, false);
});

test("Corporate Group of 20 with 19 attendees = US$900", () => {
  const result = calculateSummitPrice({
    attendeeCount: 19,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 900);
});

test("Corporate Group of 20 with 20 attendees = US$900", () => {
  const result = calculateSummitPrice({
    attendeeCount: 20,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 900);
});

test("Corporate Group of 20 with 21 attendees = rejected", () => {
  const result = calculateSummitPrice({
    attendeeCount: 21,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  assert.equal(result.ok, false);
});

test("Switching from Corporate package to Individual registration recalculates total correctly", () => {
  const corporate = calculateSummitPrice({
    attendeeCount: 7,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  }, extendedEarlyBirdDate);
  const individual = calculateSummitPrice(
    { attendeeCount: 7, corporatePackage: "corporate-early-bird-10", registrationType: "individual" },
    extendedEarlyBirdDate,
  );

  assert.equal(corporate.ok && corporate.summary.total, 450);
  assert.equal(individual.ok && individual.summary.total, 315);
});

test("Invalid registration type is rejected by server-side validation", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "1",
      country: "TT",
      email: "tester@example.com",
      firstName: "Test",
      lastName: "User",
      organization: "Example Co",
      paymentMethod: "paypal",
      phone: "+1 868 555 0100",
      registrationType: "live-test",
      role: "Leader",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, false);
});

test("Browser-submitted manipulated amount is ignored", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "10",
      country: "US",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      manipulatedAmount: "1",
      organization: "Example Co",
      paymentMethod: "paypal",
      phone: "+1 868 555 0100",
      policyAcceptance: true,
      registrationType: "individual",
      role: "Leader",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.registration.pricing.total, 450);
});

test("Organization and role are optional in server-side validation", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "1",
      country: "TT",
      email: "tester@example.com",
      firstName: "Test",
      lastName: "User",
      paymentMethod: "paypal",
      phone: "+1 868 555 0100",
      policyAcceptance: true,
      registrationType: "individual",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.registration.details.organization, "");
  assert.equal(result.ok && result.registration.details.role, "");
});

test("Mobile contact is required by server-side validation", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "1",
      country: "TT",
      email: "tester@example.com",
      firstName: "Test",
      lastName: "User",
      paymentMethod: "paypal",
      policyAcceptance: true,
      registrationType: "individual",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok ? "" : result.message, "Please complete all required registration fields.");
});

test("Server-side validation rejects missing policy acceptance", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "1",
      country: "US",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      organization: "Example Co",
      paymentMethod: "paypal",
      phone: "+1 868 555 0100",
      registrationType: "individual",
      role: "Leader",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, false);
});

test("Previously captured PayPal order cannot be processed twice", () => {
  assert.equal(isSummitPaymentCaptured({ captureId: "CAPTURE-1", paymentMethod: "paypal", status: "paid" }), true);
  assert.equal(isSummitPaymentCaptured({ captureId: undefined, paymentMethod: "paypal", status: "approved" }), false);
});
