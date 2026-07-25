import type { SummitPaymentRecord, SummitPaymentStatus } from "@/lib/summit-registration-records";
import { isSummitPaymentCaptured } from "@/lib/summit-registration-records";

export type SummitCustomerPaymentState =
  | "idle"
  | "cancelled"
  | "declined"
  | "failed"
  | "pending"
  | "verification_required"
  | "manual_review"
  | "refunded"
  | "reversed"
  | "paid";

export type SummitCustomerPaymentStatus = {
  action: "none" | "retry" | "check" | "contact" | "confirmed";
  message: string;
  state: SummitCustomerPaymentState;
};

export function customerPaymentStatus(record: SummitPaymentRecord | null): SummitCustomerPaymentStatus {
  if (!record) {
    return {
      action: "none",
      message: "",
      state: "idle",
    };
  }

  if (isSummitPaymentCaptured(record)) {
    return {
      action: "confirmed",
      message: "Payment confirmed. Your Summit registration has been received.",
      state: "paid",
    };
  }

  switch (record.status) {
    case "cancelled":
      return {
        action: "retry",
        message: "Your payment was cancelled. You have not been charged, and your Summit registration has not been confirmed.",
        state: "cancelled",
      };
    case "declined":
    case "failed":
    case "payment_failed":
    case "retry_ready":
      return {
        action: "retry",
        message:
          "PayPal could not complete your payment, so your Summit registration has not yet been confirmed. Please try again or choose another payment method through PayPal.",
        state: record.status === "declined" ? "declined" : "failed",
      };
    case "payment_processing":
    case "capture_pending":
    case "pending":
      return {
        action: "check",
        message: "Your payment is still being processed. Your registration will be confirmed once PayPal completes the payment.",
        state: "pending",
      };
    case "verification_required":
    case "approved":
    case "approval_pending":
    case "pending_approval":
      return {
        action: "check",
        message:
          "We're still verifying your payment. Please do not try to pay again yet. Your registration will be confirmed as soon as the payment is verified.",
        state: "verification_required",
      };
    case "refunded":
      return {
        action: "contact",
        message: "This payment has been refunded. Please contact Francois Consulting Group if you have registration questions.",
        state: "refunded",
      };
    case "reversed":
      return {
        action: "contact",
        message: "This payment has been reversed and needs organiser review. Please contact Francois Consulting Group.",
        state: "reversed",
      };
    case "manual_review":
      return {
        action: "contact",
        message:
          "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment.",
        state: "manual_review",
      };
    case "paid":
      return {
        action: "check",
        message:
          "We're still verifying your payment. Please do not try to pay again yet. Your registration will be confirmed as soon as the payment is verified.",
        state: "verification_required",
      };
    default:
      return fallbackStatus();
  }
}

export function canRetryPayment(status: SummitPaymentStatus) {
  return ["cancelled", "declined", "failed", "payment_failed", "retry_ready"].includes(status);
}

function fallbackStatus(): SummitCustomerPaymentStatus {
  return {
    action: "none",
    message: "",
    state: "idle",
  };
}
