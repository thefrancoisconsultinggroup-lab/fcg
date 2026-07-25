import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
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
  | "pending_approval"
  | "approved"
  | "paid"
  | "cancelled"
  | "failed"
  | "refunded";

export type SummitPaymentRecord = {
  captureId?: string;
  capturedAt?: string;
  createdAt: string;
  emailSentAt?: string;
  id: string;
  payerEmail?: string;
  paypalOrderId: string;
  pricing: SummitPriceSummary;
  registration: SummitRegistrationDetails;
  status: SummitPaymentStatus;
  updatedAt: string;
};

type StoreShape = {
  records: SummitPaymentRecord[];
};

const storePath = path.join(process.cwd(), ".data", "summit-payments.json");

export async function createSummitPaymentRecord(
  record: Omit<SummitPaymentRecord, "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();
  const store = await readStore();
  const nextRecord: SummitPaymentRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  store.records = store.records.filter((item) => item.id !== nextRecord.id);
  store.records.push(nextRecord);
  await writeStore(store);
  return nextRecord;
}

export async function getSummitPaymentRecordById(id: string) {
  const store = await readStore();
  return store.records.find((record) => record.id === id) ?? null;
}

export async function getSummitPaymentRecordByOrderId(paypalOrderId: string) {
  const store = await readStore();
  return store.records.find((record) => record.paypalOrderId === paypalOrderId) ?? null;
}

export async function updateSummitPaymentRecord(
  id: string,
  updates: Partial<Omit<SummitPaymentRecord, "createdAt" | "id">>,
) {
  const store = await readStore();
  const record = store.records.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  Object.assign(record, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return record;
}

export function isSummitPaymentCaptured(record: Pick<SummitPaymentRecord, "captureId" | "status">) {
  return record.status === "paid" && Boolean(record.captureId);
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    return { records: Array.isArray(parsed.records) ? parsed.records : [] };
  } catch {
    return { records: [] };
  }
}

async function writeStore(store: StoreShape) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}
