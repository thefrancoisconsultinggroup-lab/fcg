import type { SummitPaymentRecord, SummitRefundRecord } from "@/lib/summit-registration-records";

export type RefundSummary = {
  originalAmount: string;
  remainingAmount: string;
  status: "none" | "partial" | "pending" | "verification_required" | "failed" | "refunded";
  totalRefunded: string;
};

export function summitRefundSummary(record: Pick<SummitPaymentRecord, "pricing" | "refundHistory" | "status">): RefundSummary {
  const originalCents = dollarsToCents(String(record.pricing.total));
  const completedRefundedCents = (record.refundHistory ?? [])
    .filter((refund) => refund.status === "completed")
    .reduce((sum, refund) => sum + dollarsToCents(refund.requestedAmount), 0);
  const remainingCents = Math.max(0, originalCents - completedRefundedCents);
  const hasPending = (record.refundHistory ?? []).some((refund) => refund.status === "pending");
  const hasVerificationRequired = (record.refundHistory ?? []).some(
    (refund) => refund.status === "verification_required",
  );
  const hasFailed = (record.refundHistory ?? []).some((refund) => refund.status === "failed");

  return {
    originalAmount: centsToDollars(originalCents),
    remainingAmount: centsToDollars(remainingCents),
    status: record.status === "refunded"
      ? "refunded"
      : hasVerificationRequired
        ? "verification_required"
        : hasPending
          ? "pending"
          : completedRefundedCents > 0
            ? "partial"
            : hasFailed
              ? "failed"
              : "none",
    totalRefunded: centsToDollars(completedRefundedCents),
  };
}

export function isFullyRefunded(record: Pick<SummitPaymentRecord, "pricing" | "refundHistory" | "status">) {
  const summary = summitRefundSummary(record);
  return summary.remainingAmount === "0.00" || record.status === "refunded";
}

export function refundableCents(record: Pick<SummitPaymentRecord, "pricing" | "refundHistory">) {
  const originalCents = dollarsToCents(String(record.pricing.total));
  const refundedCents = (record.refundHistory ?? [])
    .filter((refund) => refund.status === "completed")
    .reduce((sum, refund) => sum + dollarsToCents(refund.requestedAmount), 0);

  return Math.max(0, originalCents - refundedCents);
}

export function dollarsToCents(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error("Invalid USD amount.");
  }

  const [dollars, cents = ""] = value.split(".");
  return Number.parseInt(dollars, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
}

export function centsToDollars(value: number) {
  const dollars = Math.floor(value / 100);
  const cents = String(value % 100).padStart(2, "0");
  return `${dollars}.${cents}`;
}

export function refundLabel(refund: SummitRefundRecord) {
  const reference = refund.paypalRefundId ? `PayPal refund ${refund.paypalRefundId}` : refund.idempotencyKey;
  return `${refund.type === "full" ? "Full" : "Partial"} refund ${refund.requestedAmount} USD - ${refund.status} (${reference})`;
}
