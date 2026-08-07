import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SanityClient } from "@sanity/client";
import type { SummitPriceSummary } from "@/lib/summit-pricing";
import type { SummitCurrency, SummitPaymentMethod } from "@/lib/summit-bank-transfer";

export type SummitRegistrationDetails = {
  accessibilityNeeds: string;
  country: string;
  dietaryNotes: string;
  email: string;
  firstName: string;
  hopes: string;
  lastName: string;
  organization: string;
  phone: string;
  role: string;
};

export type SummitPaymentStatus =
  | "pending"
  | "pending_approval"
  | "approval_pending"
  | "approved"
  | "payment_processing"
  | "capture_pending"
  | "verification_required"
  | "paid"
  | "cancelled"
  | "declined"
  | "failed"
  | "payment_failed"
  | "awaiting_bank_transfer"
  | "payment_under_review"
  | "refunded"
  | "reversed"
  | "manual_review"
  | "expired"
  | "retry_ready";

export type SummitPayPalOrderAttempt = {
  failureCode?: string;
  failureReason?: string;
  orderId: string;
  recordedAt: string;
  status: SummitPaymentStatus;
};

export type SummitPaymentDiagnostics = {
  captureHttpStatus?: number;
  captureId?: string;
  finalCaptureStatus?: string;
  finalOrderStatus?: string;
  paypalDebugId?: string;
  paypalDescription?: string;
  paypalIssue?: string;
  paypalName?: string;
  paypalOrderId: string;
  recordedAt: string;
  source: "capture_api_error" | "capture_response" | "capture_webhook";
  webhookEventId?: string;
  webhookEventType?: string;
  webhookSummary?: string;
};

export type SummitRefundStatus = "requested" | "pending" | "completed" | "failed" | "verification_required";

export type SummitRefundRecord = {
  adminEmail?: string;
  adminId?: string;
  adminName?: string;
  adminNotificationSentAt?: string;
  attendeeNotificationSentAt?: string;
  completedAt?: string;
  currency: "USD";
  failureCode?: string;
  failureMessage?: string;
  idempotencyKey: string;
  internalNote?: string;
  lastReconciledAt?: string;
  paypalCaptureId: string;
  paypalRefundId?: string;
  reason?: string;
  requestedAmount: string;
  requestedAt: string;
  status: SummitRefundStatus;
  type: "full" | "partial";
};

export type SummitAuditEntry = {
  action:
    | "registration_cancelled"
    | "refund_requested"
    | "refund_completed"
    | "refund_failed"
    | "refund_reconciled"
    | "confirmation_email_resent"
    | "organiser_email_resent"
    | "manual_review_applied"
    | "bank_transfer_submitted"
    | "bank_transfer_marked_paid"
    | "bank_transfer_marked_under_review"
    | "bank_transfer_expired";
  adminEmail?: string;
  adminId?: string;
  adminName?: string;
  message: string;
  occurredAt: string;
  reference?: string;
};

export type SummitPaymentRecord = {
  adminNotificationSendingAt?: string;
  adminNotificationSentAt?: string;
  amountDue: number;
  amountReceived?: number;
  accessEmailSendingAt?: string;
  accessEmailSentAt?: string;
  attendeeConfirmationSendingAt?: string;
  attendeeConfirmationSentAt?: string;
  auditHistory?: SummitAuditEntry[];
  bankTransferAdminNotificationSendingAt?: string;
  bankTransferAdminNotificationSentAt?: string;
  bankTransactionReference?: string;
  bankTransferInstructionSendingAt?: string;
  bankTransferInstructionsSentAt?: string;
  bankTransferReceivedAt?: string;
  bankTransferRequestedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledByAdminEmail?: string;
  cancelledByAdminId?: string;
  cancelledByAdminName?: string;
  captureId?: string;
  capturedAt?: string;
  configuredExchangeRate?: number;
  confirmationSentAt?: string;
  createdAt: string;
  currency: SummitCurrency;
  currencyReceived?: SummitCurrency;
  emailSentAt?: string;
  expiredAt?: string;
  lastEmailErrorAt?: string;
  lastEmailErrorMessage?: string;
  lastPaymentErrorAt?: string;
  lastPaymentErrorCode?: string;
  lastPaymentErrorMessage?: string;
  lastPaymentDiagnostics?: SummitPaymentDiagnostics;
  localBankTransferEligibilityConfirmed?: boolean;
  localBankTransferEligibilityConfirmedAt?: string;
  manualReviewReason?: string;
  id: string;
  originalUsdAmount: number;
  payerEmail?: string;
  paymentDueAt?: string;
  paymentMethod: SummitPaymentMethod;
  paymentReference?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: {
    email?: string;
    id: string;
    name?: string;
  };
  paypalOrderId?: string;
  paypalOrderHistory?: SummitPayPalOrderAttempt[];
  pricing: SummitPriceSummary;
  policyAcceptance?: {
    accepted: true;
    acceptedAt: string;
    privacyPolicyEffectiveDate: string;
    privacyPolicyVersion: string;
    refundPolicyEffectiveDate?: string;
    refundPolicyVersion?: string;
    termsEffectiveDate: string;
    termsVersion: string;
  };
  reconciliationNote?: string;
  registrationConfirmationSentAt?: string;
  registration: SummitRegistrationDetails;
  refundHistory?: SummitRefundRecord[];
  status: SummitPaymentStatus;
  summitAccessUrl?: string;
  updatedAt: string;
};

type StoreShape = {
  records: SummitPaymentRecord[];
};

type SummitPaymentDocument = SummitPaymentRecord & {
  _id: string;
  _rev?: string;
  _type: "summitPaymentRecord";
};

export type SummitEmailKind =
  | "attendeeConfirmation"
  | "adminNotification"
  | "bankTransferInstructions"
  | "bankTransferAdminNotification"
  | "summitAccess";

const emailFields = {
  adminNotification: {
    sentAt: "adminNotificationSentAt",
    sendingAt: "adminNotificationSendingAt",
  },
  attendeeConfirmation: {
    sentAt: "attendeeConfirmationSentAt",
    sendingAt: "attendeeConfirmationSendingAt",
  },
  summitAccess: {
    sentAt: "accessEmailSentAt",
    sendingAt: "accessEmailSendingAt",
  },
  bankTransferAdminNotification: {
    sentAt: "bankTransferAdminNotificationSentAt",
    sendingAt: "bankTransferAdminNotificationSendingAt",
  },
  bankTransferInstructions: {
    sentAt: "bankTransferInstructionsSentAt",
    sendingAt: "bankTransferInstructionSendingAt",
  },
} satisfies Record<SummitEmailKind, {
  sendingAt: keyof SummitPaymentRecord;
  sentAt: keyof SummitPaymentRecord;
}>;

const staleEmailClaimMilliseconds = 15 * 60 * 1000;

const documentType = "summitPaymentRecord" as const;
let sanityPaymentClient: SanityClient | null | undefined;
let paymentStorePathOverride: string | undefined;

export async function createSummitPaymentRecord(
  record: Omit<SummitPaymentRecord, "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();
  const nextRecord: SummitPaymentRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    await sanityClient.createOrReplace(toSanityDocument(nextRecord));
    return nextRecord;
  }

  const store = await readStore();
  store.records = store.records.filter((item) => item.id !== nextRecord.id);
  store.records.push(nextRecord);
  await writeStore(store);
  return nextRecord;
}

export async function getSummitPaymentRecordById(id: string) {
  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const record = await sanityClient.fetch<SummitPaymentDocument | null>(
      `*[_type == $documentType && id == $id][0]`,
      { documentType, id },
    );
    return record ? fromSanityDocument(record) : null;
  }

  const store = await readStore();
  return store.records.find((record) => record.id === id) ?? null;
}

export async function getSummitPaymentRecordByOrderId(paypalOrderId: string) {
  if (!paypalOrderId) {
    return null;
  }

  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const record = await sanityClient.fetch<SummitPaymentDocument | null>(
      `*[_type == $documentType && paypalOrderId == $paypalOrderId][0]`,
      { documentType, paypalOrderId },
    );
    return record ? fromSanityDocument(record) : null;
  }

  const store = await readStore();
  return store.records.find((record) => record.paypalOrderId === paypalOrderId) ?? null;
}

export async function updateSummitPaymentRecord(
  id: string,
  updates: Partial<Omit<SummitPaymentRecord, "createdAt" | "id">>,
) {
  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const record = await getSummitPaymentRecordById(id);

    if (!record) {
      return null;
    }

    const nextRecord = {
      ...record,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await sanityClient.createOrReplace(toSanityDocument(nextRecord));
    return nextRecord;
  }

  const store = await readStore();
  const record = store.records.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  Object.assign(record, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return record;
}

export async function getSummitPaymentRecordByReference(paymentReference: string) {
  if (!paymentReference) {
    return null;
  }

  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const record = await sanityClient.fetch<SummitPaymentDocument | null>(
      `*[_type == $documentType && paymentReference == $paymentReference][0]`,
      { documentType, paymentReference },
    );
    return record ? fromSanityDocument(record) : null;
  }

  const store = await readStore();
  return store.records.find((record) => record.paymentReference === paymentReference) ?? null;
}

export async function findLatestPendingBankTransferRegistration({
  email,
  rateValue,
}: {
  email: string;
  rateValue: SummitPriceSummary["rateValue"];
}) {
  const relevantStatuses: SummitPaymentStatus[] = [
    "awaiting_bank_transfer",
    "payment_under_review",
  ];
  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const record = await sanityClient.fetch<SummitPaymentDocument | null>(
      `*[_type == $documentType && paymentMethod == "bank_transfer" && registration.email == $email && pricing.rateValue == $rateValue && status in $statuses] | order(createdAt desc)[0]`,
      { documentType, email, rateValue, statuses: relevantStatuses },
    );
    return record ? fromSanityDocument(record) : null;
  }

  const store = await readStore();
  return (
    store.records
      .filter((record) =>
        record.paymentMethod === "bank_transfer" &&
        record.registration.email === email &&
        record.pricing.rateValue === rateValue &&
        relevantStatuses.includes(record.status),
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null
  );
}

export async function claimSummitPaymentEmailSend(id: string, kind: SummitEmailKind) {
  const fields = emailFields[kind];
  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const document = await sanityClient.fetch<SummitPaymentDocument | null>(
      `*[_type == $documentType && id == $id][0]`,
      { documentType, id },
    );

    if (!document || document[fields.sentAt]) {
      return false;
    }

    if (!isStaleEmailClaim(document[fields.sendingAt])) {
      return false;
    }

    try {
      await sanityClient
        .patch(document._id)
        .ifRevisionId(document._rev ?? "")
        .set({
          [fields.sendingAt]: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .commit();
      return true;
    } catch {
      return false;
    }
  }

  const store = await readStore();
  const record = store.records.find((item) => item.id === id);

  if (!record || record[fields.sentAt]) {
    return false;
  }

  if (!isStaleEmailClaim(record[fields.sendingAt])) {
    return false;
  }

  Object.assign(record, {
    [fields.sendingAt]: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await writeStore(store);
  return true;
}

export async function markSummitPaymentEmailSent(id: string, kind: SummitEmailKind) {
  const fields = emailFields[kind];
  const updates: Partial<Omit<SummitPaymentRecord, "createdAt" | "id">> = {
    [fields.sendingAt]: undefined,
    [fields.sentAt]: new Date().toISOString(),
    lastEmailErrorAt: undefined,
    lastEmailErrorMessage: undefined,
  };

  if (kind === "attendeeConfirmation") {
    updates.confirmationSentAt = new Date().toISOString();
    updates.registrationConfirmationSentAt = new Date().toISOString();
  }

  return updateSummitPaymentRecord(id, updates);
}

export async function recordSummitPaymentEmailFailure(id: string, kind: SummitEmailKind, error: string) {
  const fields = emailFields[kind];
  return updateSummitPaymentRecord(id, {
    [fields.sendingAt]: undefined,
    lastEmailErrorAt: new Date().toISOString(),
    lastEmailErrorMessage: error.slice(0, 200),
  });
}

export function isSummitPaymentCaptured(
  record: Pick<SummitPaymentRecord, "captureId" | "paymentMethod" | "paymentVerifiedAt" | "status">,
) {
  if (record.status !== "paid") {
    return false;
  }

  if (record.paymentMethod === "bank_transfer") {
    return Boolean(record.paymentVerifiedAt);
  }

  return Boolean(record.captureId);
}

export async function listSummitAccessEmailEligibleRecords() {
  const sanityClient = paymentSanityClient();

  if (sanityClient) {
    const records = await sanityClient.fetch<SummitPaymentDocument[]>(
      `*[
        _type == $documentType &&
        status == "paid" &&
        defined(summitAccessUrl) &&
        summitAccessUrl != "" &&
        !defined(accessEmailSentAt) &&
        defined(registration.email)
      ] | order(createdAt asc)`,
      { documentType },
    );
    return records.map(fromSanityDocument);
  }

  const store = await readStore();
  return store.records
    .filter((record) =>
      record.status === "paid" &&
      Boolean(record.registration.email) &&
      Boolean(record.summitAccessUrl) &&
      !record.accessEmailSentAt,
    )
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

export function setSummitPaymentStorePathForTests(storePath: string | undefined) {
  paymentStorePathOverride = storePath;
}

function isStaleEmailClaim(value: SummitPaymentRecord[keyof SummitPaymentRecord]) {
  if (typeof value !== "string" || !value) {
    return true;
  }

  const claimedAt = Date.parse(value);
  return !Number.isFinite(claimedAt) || Date.now() - claimedAt > staleEmailClaimMilliseconds;
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(paymentStorePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return { records: Array.isArray(parsed.records) ? parsed.records : [] };
  } catch {
    return { records: [] };
  }
}

async function writeStore(store: StoreShape) {
  const storePath = paymentStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

function paymentStorePath() {
  return paymentStorePathOverride || path.join(process.cwd(), ".data", "summit-payments.json");
}

function paymentSanityClient() {
  if (sanityPaymentClient !== undefined) {
    return sanityPaymentClient;
  }

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET;
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";
  const token = process.env.SANITY_API_WRITE_TOKEN;

  sanityPaymentClient = projectId && dataset && token
    ? createClient({
        apiVersion,
        dataset,
        projectId,
        token,
        useCdn: false,
      })
    : null;

  return sanityPaymentClient;
}

function toSanityDocument(record: SummitPaymentRecord): SummitPaymentDocument {
  return {
    _id: `summitPaymentRecord.${record.id}`,
    _type: documentType,
    ...record,
  };
}

function fromSanityDocument(document: SummitPaymentDocument): SummitPaymentRecord {
  const record = { ...document };
  delete (record as Partial<SummitPaymentDocument>)._id;
  delete (record as Partial<SummitPaymentDocument>)._rev;
  delete (record as Partial<SummitPaymentDocument>)._type;
  return record;
}
