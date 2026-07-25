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

type SummitPaymentDocument = SummitPaymentRecord & {
  _id: string;
  _type: "summitPaymentRecord";
};

const storePath = path.join(process.cwd(), ".data", "summit-payments.json");
const documentType = "summitPaymentRecord" as const;
let sanityPaymentClient: SanityClient | null | undefined;

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
  delete (record as Partial<SummitPaymentDocument>)._type;
  return record;
}
