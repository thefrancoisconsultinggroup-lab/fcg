import assert from "node:assert/strict";
import test from "node:test";
import {
  completeSummitPayment,
  validateCompletedCaptureForRecord,
} from "@/lib/summit-payment-completion";
import type { SummitPaymentRecord } from "@/lib/summit-registration-records";

const baseRecord: SummitPaymentRecord = {
  createdAt: "2026-07-24T00:00:00.000Z",
  id: "registration-1",
  paypalOrderId: "ORDER-1",
  pricing: {
    attendeeCount: 1,
    categoryLabel: "Individual",
    rateDetail: "Early Bird",
    rateLabel: "Early Bird",
    rateValue: "early-bird",
    total: 45,
    unitPrice: 45,
  },
  registration: {
    accessibilityNeeds: "",
    country: "TT",
    dietaryNotes: "",
    email: "test@example.com",
    firstName: "Test",
    hopes: "",
    lastName: "User",
    organization: "Example Co",
    phone: "",
    role: "Leader",
  },
  status: "approved",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

test("valid completed capture matches the stored registration", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 45,
    }),
    true,
  );
});

test("invalid signature is not treated as payment validation", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "",
      currency: "USD",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 45,
    }),
    false,
  );
});

test("wrong currency is rejected", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "EUR",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 45,
    }),
    false,
  );
});

test("wrong amount is rejected", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 44.99,
    }),
    false,
  );
});

test("unknown order is rejected", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-404",
      status: "COMPLETED",
      value: 45,
    }),
    false,
  );
});

test("pending capture is rejected as a completed payment", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-1",
      status: "PENDING",
      value: 45,
    }),
    false,
  );
});

test("denied capture is rejected as a completed payment", () => {
  assert.equal(
    validateCompletedCaptureForRecord(baseRecord, {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-1",
      status: "DENIED",
      value: 45,
    }),
    false,
  );
});

test("duplicate completed event with the same capture is idempotent", async () => {
  const result = await completeSummitPayment({
    record: {
      ...baseRecord,
      captureId: "CAPTURE-1",
      emailSentAt: "2026-07-24T00:01:00.000Z",
      status: "paid",
    },
    capture: {
      captureId: "CAPTURE-1",
      currency: "USD",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 45,
    },
  });

  assert.deepEqual(result, { ok: true, duplicate: true, emailSent: true });
});

test("duplicate completed event with a different capture is rejected", async () => {
  const result = await completeSummitPayment({
    record: {
      ...baseRecord,
      captureId: "CAPTURE-1",
      status: "paid",
    },
    capture: {
      captureId: "CAPTURE-2",
      currency: "USD",
      orderId: "ORDER-1",
      status: "COMPLETED",
      value: 45,
    },
  });

  assert.deepEqual(result, { ok: false, reason: "already_paid_different_capture" });
});
