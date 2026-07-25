import assert from "node:assert/strict";
import test from "node:test";
import {dollarsToCents, refundableCents, summitRefundSummary} from "@/lib/summit-refunds";
import type {SummitPaymentRecord} from "@/lib/summit-registration-records";

const paidRecord: SummitPaymentRecord = {
  captureId: "CAPTURE-1",
  capturedAt: "2026-07-24T00:01:00.000Z",
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
  status: "paid",
  updatedAt: "2026-07-24T00:01:00.000Z",
};

test("refund summaries use decimal-safe cents and remaining balance", () => {
  const record: SummitPaymentRecord = {
    ...paidRecord,
    refundHistory: [
      {
        completedAt: "2026-07-24T01:00:00.000Z",
        currency: "USD",
        idempotencyKey: "refund-1",
        paypalCaptureId: "CAPTURE-1",
        paypalRefundId: "REFUND-1",
        requestedAmount: "12.34",
        requestedAt: "2026-07-24T00:59:00.000Z",
        status: "completed",
        type: "partial",
      },
      {
        currency: "USD",
        idempotencyKey: "refund-2",
        paypalCaptureId: "CAPTURE-1",
        requestedAmount: "5.00",
        requestedAt: "2026-07-24T02:00:00.000Z",
        status: "pending",
        type: "partial",
      },
    ],
  };

  assert.equal(dollarsToCents("12.34"), 1234);
  assert.equal(refundableCents(record), 3266);
  assert.deepEqual(summitRefundSummary(record), {
    originalAmount: "45.00",
    remainingAmount: "32.66",
    status: "pending",
    totalRefunded: "12.34",
  });
});

test("invalid refund amounts are rejected before any PayPal call can be made", () => {
  for (const value of ["", "0.001", "-1.00", "abc", "1.234", "1,00"]) {
    assert.throws(() => dollarsToCents(value));
  }
});

test("admin order mutation endpoints fail closed without server-verifiable admin auth", async () => {
  const routes = await Promise.all([
    import("@/app/api/human-capacity-summit/admin/orders/cancel/route"),
    import("@/app/api/human-capacity-summit/admin/orders/refund/route"),
    import("@/app/api/human-capacity-summit/admin/orders/resend-email/route"),
    import("@/app/api/human-capacity-summit/admin/orders/reconcile/route"),
  ]);

  for (const route of routes) {
    const response = await route.POST(
      new Request("https://example.com/api/human-capacity-summit/admin/orders", {
        method: "POST",
        body: JSON.stringify({registrationId: "registration-1"}),
      }),
    );
    const body = (await response.json()) as {message?: string};

    assert.equal(response.status, 501);
    assert.match(body.message ?? "", /server-verifiable administrator authentication/);
  }
});

test("public customer status object exposes no admin notes, audit history, or secrets", async () => {
  const {customerPaymentStatus} = await import("@/lib/summit-payment-customer-status");
  const publicStatus = customerPaymentStatus({
    ...paidRecord,
    auditHistory: [
      {
        action: "manual_review_applied",
        adminEmail: "admin@example.com",
        message: "Internal note",
        occurredAt: "2026-07-24T02:00:00.000Z",
      },
    ],
    manualReviewReason: "Private internal detail",
    status: "manual_review",
  });

  const serialized = JSON.stringify(publicStatus);
  assert.doesNotMatch(serialized, /admin@example\.com/);
  assert.doesNotMatch(serialized, /Internal note/);
  assert.doesNotMatch(serialized, /Private internal detail/);
});
