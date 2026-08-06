import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SanityClient } from "@sanity/client";
import type { SummitPriceSummary } from "@/lib/summit-pricing";

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
  | "refunded"
  | "reversed"
  | "manual_review"
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
    | "manual_review_applied";
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
  attendeeConfirmationSendingAt?: string;
  attendeeConfirmationSentAt?: string;
  auditHistory?: SummitAuditEntry[];
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledByAdminEmail?: string;
  cancelledByAdminId?: string;
  cancelledByAdminName?: string;
  captureId?: string;
  capturedAt?: string;
  createdAt: string;
  emailSentAt?: string;
  lastEmailErrorAt?: string;
  lastEmailErrorMessage?: string;
  lastPaymentErrorAt?: string;
  lastPaymentErrorCode?: string;
  lastPaymentErrorMessage?: string;
  lastPaymentDiagnostics?: SummitPaymentDiagnostics;
  manualReviewReason?: string;
  id: string;
  payerEmail?: string;
  paypalOrderId: string;
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
  registration: SummitRegistrationDetails;
  refundHistory?: SummitRefundRecord[];
  status: SummitPaymentStatus;
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

export type SummitEmailKind = "attendeeConfirmation" | "adminNotification";

const emailFields = {
  adminNotification: {
    sentAt: "adminNotificationSentAt",
    sendingAt: "adminNotificationSendingAt",
  },
  attendeeConfirmation: {
    sentAt: "attendeeConfirmationSentAt",
    sendingAt: "attendeeConfirmationSendingAt",
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
  return updateSummitPaymentRecord(id, {
    [fields.sendingAt]: undefined,
    [fields.sentAt]: new Date().toISOString(),
    lastEmailErrorAt: undefined,
    lastEmailErrorMessage: undefined,
  });
}

export async function recordSummitPaymentEmailFailure(id: string, kind: SummitEmailKind, error: string) {
  const fields = emailFields[kind];
  return updateSummitPaymentRecord(id, {
    [fields.sendingAt]: undefined,
    lastEmailErrorAt: new Date().toISOString(),
    lastEmailErrorMessage: error.slice(0, 200),
  });
}

export function isSummitPaymentCaptured(record: Pick<SummitPaymentRecord, "captureId" | "status">) {
  return record.status === "paid" && Boolean(record.captureId);
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
