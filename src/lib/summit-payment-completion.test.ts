import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildSummitAdminNotificationEmail,
  buildSummitAttendeeConfirmationEmail,
  publicLogoUrl,
  summitAdminFromEmail,
  summitAdminRecipientEmail,
  summitAttendeeFromEmail,
} from "@/lib/summit-registration-email";
import {
  createSummitPaymentRecord,
  getSummitPaymentRecordById,
  setSummitPaymentStorePathForTests,
} from "@/lib/summit-registration-records";
import {
  completeSummitPayment,
  reconcileSummitPayment,
  validateCompletedCaptureForRecord,
} from "@/lib/summit-payment-completion";
import { canRetryPayment, customerPaymentStatus } from "@/lib/summit-payment-customer-status";
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

  assert.deepEqual(result, {
    ok: true,
    duplicate: true,
    emails: { adminNotification: true, attendeeConfirmation: true },
  });
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

test("verified successful capture sends attendee and organiser emails with the configured envelopes", async () => {
  const sentEmails = await withMockedResend(async () => {
    const record = await seedRecord("registration-email-success");
    const result = await completeSummitPayment({
      record,
      capture: completedCapture(),
    });

    assert.deepEqual(result, {
      ok: true,
      duplicate: false,
      emails: { adminNotification: true, attendeeConfirmation: true },
    });

    return getSentEmails();
  });

  assert.equal(sentEmails.length, 2);
  assert.equal(sentEmails[0].to[0], "test@example.com");
  assert.equal(sentEmails[0].from, "Francois Consulting Group <no-reply@francoisconsultinggroup.com>");
  assert.equal(sentEmails[1].to[0], "hello@francoisconsultinggroup.com");
  assert.equal(sentEmails[1].from, "Human Capacity Summit <summit@francoisconsultinggroup.com>");
});

test("emails contain the verified payment amount, registration details and PayPal references", () => {
  const paidRecord = paid(baseRecord);
  const attendee = buildSummitAttendeeConfirmationEmail(paidRecord);
  const admin = buildSummitAdminNotificationEmail(paidRecord);

  assert.match(attendee.html, /Human Capacity Summit/);
  assert.match(attendee.html, /\$45\.00/);
  assert.match(attendee.html, /Test User/);
  assert.match(attendee.html, /CAPTURE-1/);
  assert.doesNotMatch(attendee.html, /registration-1/);
  assert.match(admin.html, /registration-1/);
  assert.match(admin.html, /Example Co/);
  assert.match(admin.html, /ORDER-1/);
  assert.match(admin.text, /Currency: USD/);
});

test("failed, cancelled and declined captures send no confirmation emails", async () => {
  for (const status of ["FAILED", "CANCELLED", "DECLINED", "DENIED"]) {
    await withMockedResend(async () => {
      const result = await completeSummitPayment({
        record: await seedRecord(`registration-${status.toLowerCase()}`),
        capture: { ...completedCapture(), status },
      });

      assert.deepEqual(result, { ok: false, reason: "invalid_capture" });
      assert.equal(getSentEmails().length, 0);
    });
  }
});

test("amount or currency mismatch sends no confirmation emails", async () => {
  await withMockedResend(async () => {
    assert.equal(
      (await completeSummitPayment({
        record: await seedRecord("registration-wrong-amount"),
        capture: { ...completedCapture(), value: 44.99 },
      })).ok,
      false,
    );
    assert.equal(
      (await completeSummitPayment({
        record: await seedRecord("registration-wrong-currency"),
        capture: { ...completedCapture(), currency: "EUR" },
      })).ok,
      false,
    );
    assert.equal(getSentEmails().length, 0);
  });
});

test("repeating capture or replaying webhook does not resend either email", async () => {
  const sentEmails = await withMockedResend(async () => {
    let record = await seedRecord("registration-repeat");
    await completeSummitPayment({ record, capture: completedCapture() });
    record = (await getSummitPaymentRecordById(record.id)) ?? record;
    await completeSummitPayment({ record, capture: completedCapture() });
    record = (await getSummitPaymentRecordById(record.id)) ?? record;
    await completeSummitPayment({ record, capture: completedCapture() });
    return getSentEmails();
  });

  assert.equal(sentEmails.length, 2);
});

test("refreshing the thank-you page cannot send confirmation emails", async () => {
  const source = await readFile("src/app/human-capacity-summit/thank-you/page.tsx", "utf8");

  assert.doesNotMatch(source, /sendSummit|sendSiteEmail|RESEND_API_KEY/);
});

test("failure to send one email keeps the registration paid and allows retry without duplicating the email that succeeded", async () => {
  const sentEmails = await withMockedResend(async () => {
    setFailNextEmailTo("hello@francoisconsultinggroup.com");
    let record = await seedRecord("registration-retry");
    const firstResult = await completeSummitPayment({ record, capture: completedCapture() });
    const afterFailure = await getSummitPaymentRecordById(record.id);

    assert.deepEqual(firstResult, {
      ok: true,
      duplicate: false,
      emails: { adminNotification: false, attendeeConfirmation: true },
    });
    assert.equal(afterFailure?.status, "paid");
    assert.ok(afterFailure?.attendeeConfirmationSentAt);
    assert.equal(afterFailure?.adminNotificationSentAt, undefined);

    record = afterFailure ?? record;
    const retryResult = await completeSummitPayment({ record, capture: completedCapture() });
    assert.deepEqual(retryResult, {
      ok: true,
      duplicate: true,
      emails: { adminNotification: true, attendeeConfirmation: true },
    });

    return getSentEmails();
  });

  assert.equal(sentEmails.filter((email) => email.to[0] === "test@example.com").length, 1);
  assert.equal(sentEmails.filter((email) => email.to[0] === "hello@francoisconsultinggroup.com").length, 1);
});

test("HTML uses responsive email-safe layout and plain-text alternatives are generated", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.francoisconsultinggroup.com";
  const attendee = buildSummitAttendeeConfirmationEmail(paid(baseRecord));

  assert.equal(publicLogoUrl(), "https://www.francoisconsultinggroup.com/assets/migrated/shared/brand-francois-logo.png");
  assert.match(attendee.html, /max-width:640px/);
  assert.match(attendee.html, /width:100%/);
  assert.match(attendee.html, /alt="Francois Consulting Group logo icon"/);
  assert.match(attendee.text, /Your PayPal payment was successfully verified/);
  assert.match(attendee.text, /PayPal transaction \/ capture reference: CAPTURE-1/);
});

test("Summit sender environment variables have branded defaults", () => {
  assert.equal(summitAttendeeFromEmail(), "Francois Consulting Group <no-reply@francoisconsultinggroup.com>");
  assert.equal(summitAdminFromEmail(), "Human Capacity Summit <summit@francoisconsultinggroup.com>");
  assert.equal(summitAdminRecipientEmail(), "hello@francoisconsultinggroup.com");
});

test("cancelled checkout stays unpaid and permits retry with safe customer copy", () => {
  const status = customerPaymentStatus({ ...baseRecord, status: "cancelled" });

  assert.equal(status.action, "retry");
  assert.equal(status.state, "cancelled");
  assert.equal(
    status.message,
    "Your payment was cancelled. You have not been charged, and your Summit registration has not been confirmed.",
  );
});

test("declined payment stays unpaid and permits safe retry", () => {
  const status = customerPaymentStatus({ ...baseRecord, status: "declined" });

  assert.equal(canRetryPayment("declined"), true);
  assert.equal(status.action, "retry");
  assert.match(status.message, /choose another payment method through PayPal/);
  assert.doesNotMatch(status.message, /insufficient funds|fraud|compliance/i);
});

test("pending and verification-required payments withhold repayment and expose check-status action", () => {
  const pending = customerPaymentStatus({ ...baseRecord, status: "payment_processing" });
  const uncertain = customerPaymentStatus({ ...baseRecord, status: "verification_required" });

  assert.equal(pending.action, "check");
  assert.equal(uncertain.action, "check");
  assert.equal(canRetryPayment("payment_processing"), false);
  assert.equal(canRetryPayment("verification_required"), false);
});

test("uncertain capture reconciliation checks the existing PayPal order before retry", async () => {
  await withMockedResend(async () => {
    setPayPalOrderResponse({
      id: "ORDER-1",
      status: "APPROVED",
    });

    const record = await seedRecord("registration-uncertain");
    const result = await reconcileSummitPayment({ ...record, status: "verification_required" });
    const stored = await getSummitPaymentRecordById(record.id);

    assert.deepEqual(result, { ok: true, status: "verification_required" });
    assert.equal(stored?.status, "verification_required");
    assert.equal(canRetryPayment(stored?.status ?? "paid"), false);
    assert.equal(getSentEmails().length, 0);
  });
});

test("pending PayPal order does not send paid emails or enable immediate repayment", async () => {
  await withMockedResend(async () => {
    setPayPalOrderResponse({
      id: "ORDER-1",
      purchase_units: [{ payments: { captures: [{ id: "CAPTURE-PENDING", status: "PENDING" }] } }],
      status: "APPROVED",
    });

    const record = await seedRecord("registration-pending");
    const result = await reconcileSummitPayment({ ...record, status: "verification_required" });
    const stored = await getSummitPaymentRecordById(record.id);

    assert.deepEqual(result, { ok: true, status: "pending" });
    assert.equal(stored?.status, "payment_processing");
    assert.equal(canRetryPayment(stored?.status ?? "paid"), false);
    assert.equal(getSentEmails().length, 0);
  });
});

test("later verified completion marks paid exactly once after uncertain outcome", async () => {
  const sentEmails = await withMockedResend(async () => {
    setPayPalOrderResponse({
      id: "ORDER-1",
      payer: { email_address: "payer@example.com" },
      purchase_units: [
        {
          payments: {
            captures: [
              {
                amount: { currency_code: "USD", value: "45.00" },
                id: "CAPTURE-1",
                status: "COMPLETED",
              },
            ],
          },
        },
      ],
      status: "COMPLETED",
    });

    let record = await seedRecord("registration-later-complete");
    await reconcileSummitPayment({ ...record, status: "verification_required" });
    record = (await getSummitPaymentRecordById(record.id)) ?? record;
    await reconcileSummitPayment(record);

    assert.equal((await getSummitPaymentRecordById(record.id))?.status, "paid");
    return getSentEmails();
  });

  assert.equal(sentEmails.length, 2);
});

test("capture lookup timeout enters manual review without successful-payment emails", async () => {
  await withMockedResend(async () => {
    setPayPalOrderResponse(null);
    const record = await seedRecord("registration-lookup-timeout");
    const result = await reconcileSummitPayment({ ...record, status: "verification_required" });
    const stored = await getSummitPaymentRecordById(record.id);

    assert.deepEqual(result, { ok: false, status: "manual_review", reason: "paypal_lookup_failed" });
    assert.equal(stored?.status, "manual_review");
    assert.equal(getSentEmails().length, 0);
  });
});

test("refunded and reversed registrations are contact-only customer states", () => {
  assert.deepEqual(customerPaymentStatus({ ...baseRecord, status: "refunded" }).action, "contact");
  assert.deepEqual(customerPaymentStatus({ ...baseRecord, status: "reversed" }).action, "contact");
});

test("verified refund and reversal webhooks update records idempotently without successful emails", async () => {
  await withMockedResend(async () => {
    process.env.PAYPAL_WEBHOOK_ID = "WEBHOOK-1";
    const record = await seedRecord("registration-webhook-reversal");
    const { POST } = await import("@/app/api/human-capacity-summit/paypal/webhook/route");

    setPayPalWebhookVerification(true);
    await POST(webhookRequest("PAYMENT.CAPTURE.REFUNDED", record.paypalOrderId));
    await POST(webhookRequest("PAYMENT.CAPTURE.REFUNDED", record.paypalOrderId));
    assert.equal((await getSummitPaymentRecordById(record.id))?.status, "refunded");

    await POST(webhookRequest("PAYMENT.CAPTURE.REVERSED", record.paypalOrderId));
    await POST(webhookRequest("PAYMENT.CAPTURE.REVERSED", record.paypalOrderId));
    assert.equal((await getSummitPaymentRecordById(record.id))?.status, "reversed");
    assert.equal(getSentEmails().length, 0);
  });
});

test("retry endpoint reuses the existing registration after cancellation", async () => {
  await withMockedResend(async () => {
    const record = await seedRecord("registration-retry-endpoint");
    await import("@/lib/summit-registration-records").then(({ updateSummitPaymentRecord }) =>
      updateSummitPaymentRecord(record.id, { status: "cancelled" }),
    );
    const { POST } = await import("@/app/api/human-capacity-summit/paypal/retry/route");
    const response = await POST(
      new Request("https://example.com/api/human-capacity-summit/paypal/retry", {
        method: "POST",
        body: JSON.stringify({ registrationId: record.id }),
      }),
    );
    const body = (await response.json()) as { approvalUrl?: string; registrationId?: string };
    const stored = await getSummitPaymentRecordById(record.id);

    assert.equal(response.status, 200);
    assert.equal(body.registrationId, record.id);
    assert.equal(body.approvalUrl, "https://paypal.test/approve/ORDER-RETRY");
    assert.equal(stored?.paypalOrderId, "ORDER-RETRY");
    assert.equal(stored?.paypalOrderHistory?.[0]?.orderId, "ORDER-1");
    assert.equal(stored?.status, "pending_approval");
  });
});

test("retry endpoint refuses pending and already-paid registrations", async () => {
  await withMockedResend(async () => {
    const pending = await seedRecord("registration-retry-pending");
    const paidRecord = await seedRecord("registration-retry-paid");
    await import("@/lib/summit-registration-records").then(({ updateSummitPaymentRecord }) =>
      Promise.all([
        updateSummitPaymentRecord(pending.id, { status: "payment_processing" }),
        updateSummitPaymentRecord(paidRecord.id, { captureId: "CAPTURE-1", status: "paid" }),
      ]),
    );

    const { POST } = await import("@/app/api/human-capacity-summit/paypal/retry/route");
    const pendingResponse = await POST(retryRequest(pending.id));
    const paidResponse = await POST(retryRequest(paidRecord.id));

    assert.equal(pendingResponse.status, 409);
    assert.equal(paidResponse.status, 409);
  });
});

test("paid status check retries missing summit emails exactly once", async () => {
  const sentEmails = await withMockedResend(async () => {
    const record = await seedRecord("registration-status-email-retry");
    await import("@/lib/summit-registration-records").then(({ updateSummitPaymentRecord }) =>
      updateSummitPaymentRecord(record.id, {
        captureId: "CAPTURE-1",
        capturedAt: "2026-07-24T01:30:00.000Z",
        status: "paid",
      }),
    );

    const { GET } = await import("@/app/api/human-capacity-summit/paypal/status/route");
    await GET(
      new Request(
        `https://example.com/api/human-capacity-summit/paypal/status?registrationId=${record.id}`,
      ),
    );
    await GET(
      new Request(
        `https://example.com/api/human-capacity-summit/paypal/status?registrationId=${record.id}`,
      ),
    );

    const stored = await getSummitPaymentRecordById(record.id);
    assert.ok(stored?.attendeeConfirmationSentAt);
    assert.ok(stored?.adminNotificationSentAt);
    return getSentEmails();
  });

  assert.equal(sentEmails.length, 2);
});

function completedCapture() {
  return {
    captureId: "CAPTURE-1",
    currency: "USD",
    orderId: "ORDER-1",
    payerEmail: "payer@example.com",
    status: "COMPLETED",
    value: 45,
  };
}

async function seedRecord(id: string) {
  return createSummitPaymentRecord({
    ...baseRecord,
    id,
    paypalOrderId: "ORDER-1",
  });
}

function paid(record: SummitPaymentRecord): SummitPaymentRecord {
  return {
    ...record,
    captureId: "CAPTURE-1",
    capturedAt: "2026-07-24T01:30:00.000Z",
    status: "paid",
  };
}

let sentEmails: Array<{ from: string; html: string; subject: string; text: string; to: string[] }> = [];
let failNextEmailTo = "";
let payPalOrderResponse: unknown = undefined;
let payPalWebhookVerification = false;

function getSentEmails() {
  return sentEmails;
}

function setFailNextEmailTo(to: string) {
  failNextEmailTo = to;
}

function setPayPalOrderResponse(response: unknown) {
  payPalOrderResponse = response;
}

function setPayPalWebhookVerification(verified: boolean) {
  payPalWebhookVerification = verified;
}

async function withMockedResend<T>(callback: () => Promise<T>) {
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousPayPalEnvironment = process.env.PAYPAL_ENVIRONMENT;
  const previousPayPalBaseUrl = process.env.PAYPAL_BASE_URL;
  const previousPayPalClientId = process.env.PAYPAL_CLIENT_ID;
  const previousPayPalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const previousPayPalWebhookId = process.env.PAYPAL_WEBHOOK_ID;
  const previousFetch = globalThis.fetch;
  const tempDir = await mkdtemp(path.join(tmpdir(), "summit-payment-test-"));

  process.env.RESEND_API_KEY = "test-resend-key";
  process.env.PAYPAL_ENVIRONMENT = "live";
  process.env.PAYPAL_BASE_URL = "https://paypal.test";
  process.env.PAYPAL_CLIENT_ID = "client-id";
  process.env.PAYPAL_CLIENT_SECRET = "client-secret";
  setSummitPaymentStorePathForTests(path.join(tempDir, "summit-payments.json"));
  process.env.SUMMIT_ATTENDEE_FROM_EMAIL = "Francois Consulting Group <no-reply@francoisconsultinggroup.com>";
  process.env.SUMMIT_ADMIN_FROM_EMAIL = "Human Capacity Summit <summit@francoisconsultinggroup.com>";
  process.env.SUMMIT_ADMIN_RECIPIENT_EMAIL = "hello@francoisconsultinggroup.com";
  sentEmails = [];
  failNextEmailTo = "";
  payPalOrderResponse = undefined;
  payPalWebhookVerification = false;

  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    const url = String(_url);

    if (url.includes("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "token" }), { status: 200 });
    }

    if (url.includes("/v1/notifications/verify-webhook-signature")) {
      return new Response(
        JSON.stringify({ verification_status: payPalWebhookVerification ? "SUCCESS" : "FAILURE" }),
        { status: 200 },
      );
    }

    if (url.includes("/v2/checkout/orders/ORDER-1")) {
      if (payPalOrderResponse === null) {
        return new Response(JSON.stringify({ debug_id: "DEBUG-LOOKUP" }), { status: 504 });
      }
      return new Response(JSON.stringify(payPalOrderResponse ?? { id: "ORDER-1", status: "APPROVED" }), {
        status: 200,
      });
    }

    if (url.endsWith("/v2/checkout/orders") && init?.method === "POST") {
      return new Response(
        JSON.stringify({
          id: "ORDER-RETRY",
          links: [{ href: "https://paypal.test/approve/ORDER-RETRY", rel: "approve" }],
        }),
        { status: 200 },
      );
    }

    const payload = JSON.parse(String(init?.body ?? "{}")) as {
      from: string;
      html: string;
      subject: string;
      text: string;
      to: string[];
    };

    if (payload.to.includes(failNextEmailTo)) {
      failNextEmailTo = "";
      return new Response("failed", { status: 500 });
    }

    sentEmails.push(payload);
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  try {
    return await callback();
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousApiKey;
    }
    restoreEnv("PAYPAL_ENVIRONMENT", previousPayPalEnvironment);
    restoreEnv("PAYPAL_BASE_URL", previousPayPalBaseUrl);
    restoreEnv("PAYPAL_CLIENT_ID", previousPayPalClientId);
    restoreEnv("PAYPAL_CLIENT_SECRET", previousPayPalClientSecret);
    restoreEnv("PAYPAL_WEBHOOK_ID", previousPayPalWebhookId);
    setSummitPaymentStorePathForTests(undefined);
    await rm(tempDir, { recursive: true, force: true });
    globalThis.fetch = previousFetch;
  }
}

function webhookRequest(eventType: string, orderId: string) {
  return new Request("https://example.com/api/human-capacity-summit/paypal/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://paypal.test/cert.pem",
      "paypal-transmission-id": "transmission",
      "paypal-transmission-sig": "signature",
      "paypal-transmission-time": "2026-07-24T00:00:00Z",
    },
    body: JSON.stringify({
      event_type: eventType,
      resource: {
        id: "CAPTURE-1",
        supplementary_data: {
          related_ids: {
            order_id: orderId,
          },
        },
      },
    }),
  });
}

function retryRequest(registrationId: string) {
  return new Request("https://example.com/api/human-capacity-summit/paypal/retry", {
    method: "POST",
    body: JSON.stringify({ registrationId }),
  });
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
