import assert from "node:assert/strict";
import test from "node:test";
import { calculateSummitPrice } from "@/lib/summit-pricing";
import { isSummitPaymentCaptured } from "@/lib/summit-registration-records";
import { validateSummitRegistrationPayload } from "@/lib/summit-registration-validation";

const earlyBirdDate = new Date("2026-07-23T12:00:00.000Z");
const advanceDate = new Date("2026-08-16T12:00:00.000Z");
const standardDate = new Date("2026-09-16T12:00:00.000Z");

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

test("10 Advance attendees = US$750", () => {
  const result = calculateSummitPrice({ attendeeCount: 10, registrationType: "individual" }, advanceDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 750);
});

test("20 Standard attendees = US$2,100", () => {
  const result = calculateSummitPrice({ attendeeCount: 20, registrationType: "individual" }, standardDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 2100);
});

test("Corporate Group of 10 with 10 attendees = US$600", () => {
  const result = calculateSummitPrice({
    attendeeCount: 10,
    corporatePackage: "corporate-10",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 600);
});

test("Early Bird Corporate Group of 10 with 10 attendees = US$450", () => {
  const result = calculateSummitPrice({
    attendeeCount: 10,
    corporatePackage: "corporate-early-bird-10",
    registrationType: "corporate",
  });
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 450);
  assert.equal(result.ok && result.summary.originalPrice, 600);
});

test("Early Bird Corporate Group of 20 with 20 attendees = US$900", () => {
  const result = calculateSummitPrice({
    attendeeCount: 20,
    corporatePackage: "corporate-early-bird-20",
    registrationType: "corporate",
  });
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 900);
  assert.equal(result.ok && result.summary.originalPrice, 1200);
});

test("Regular Corporate packages are rejected during Early Bird", () => {
  const result = calculateSummitPrice(
    {
      attendeeCount: 10,
      corporatePackage: "corporate-10",
      registrationType: "corporate",
    },
    earlyBirdDate,
  );
  assert.equal(result.ok, false);
});

test("Early Bird Corporate packages are rejected after Early Bird ends", () => {
  const result = calculateSummitPrice(
    {
      attendeeCount: 10,
      corporatePackage: "corporate-early-bird-10",
      registrationType: "corporate",
    },
    advanceDate,
  );
  assert.equal(result.ok, false);
});

test("Corporate Group of 10 with 7 attendees = US$600", () => {
  const result = calculateSummitPrice({
    attendeeCount: 7,
    corporatePackage: "corporate-10",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 600);
});

test("Corporate Group of 10 with 11 attendees = rejected", () => {
  const result = calculateSummitPrice({
    attendeeCount: 11,
    corporatePackage: "corporate-10",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, false);
});

test("Corporate Group of 20 with 19 attendees = US$1,200", () => {
  const result = calculateSummitPrice({
    attendeeCount: 19,
    corporatePackage: "corporate-20",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 1200);
});

test("Corporate Group of 20 with 20 attendees = US$1,200", () => {
  const result = calculateSummitPrice({
    attendeeCount: 20,
    corporatePackage: "corporate-20",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.summary.total, 1200);
});

test("Corporate Group of 20 with 21 attendees = rejected", () => {
  const result = calculateSummitPrice({
    attendeeCount: 21,
    corporatePackage: "corporate-20",
    registrationType: "corporate",
  }, advanceDate);
  assert.equal(result.ok, false);
});

test("Switching from Corporate package to Individual registration recalculates total correctly", () => {
  const corporate = calculateSummitPrice({
    attendeeCount: 7,
    corporatePackage: "corporate-10",
    registrationType: "corporate",
  }, advanceDate);
  const individual = calculateSummitPrice(
    { attendeeCount: 7, corporatePackage: "corporate-10", registrationType: "individual" },
    earlyBirdDate,
  );

  assert.equal(corporate.ok && corporate.summary.total, 600);
  assert.equal(individual.ok && individual.summary.total, 315);
});

test("Browser-submitted manipulated amount is ignored", () => {
  const result = validateSummitRegistrationPayload(
    {
      attendeeCount: "10",
      consent: true,
      country: "US",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      manipulatedAmount: "1",
      organization: "Example Co",
      paymentMethod: "PayPal",
      registrationType: "individual",
      role: "Leader",
    },
    earlyBirdDate,
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.registration.pricing.total, 450);
});

test("Previously captured PayPal order cannot be processed twice", () => {
  assert.equal(isSummitPaymentCaptured({ captureId: "CAPTURE-1", status: "paid" }), true);
  assert.equal(isSummitPaymentCaptured({ captureId: undefined, status: "approved" }), false);
});
