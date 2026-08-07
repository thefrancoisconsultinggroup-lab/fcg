import type { SummitPriceSummary } from "@/lib/summit-pricing";

export type SummitCurrency = "USD" | "TTD";
export type SummitPaymentMethod = "paypal" | "bank_transfer";

export const summitBankTransferExchangeRate = 7 as const;

const defaultDeadlinePlaceholder = "[CLIENT TO CONFIRM: BANK TRANSFER PAYMENT DEADLINE]";
const defaultSupportEmail = "support@francoisconsultinggroup.com";
const defaultSupportWhatsApp = "868-313-3744";

type BankTransferBankDetails = {
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  bankName: string;
  branchInformation: string;
  instructions: string;
  supportsLocalTtdTransfers: string;
};

export type SummitDirectBankTransferConfig = {
  bankDetails: BankTransferBankDetails;
  deadlineHours?: number;
  deadlineLabel: string;
  enabled: boolean;
  organizerNotificationEmail: string;
  productionReady: boolean;
  supportEmail: string;
  supportWhatsApp: string;
};

export type SummitDirectBankTransferPublicConfig = {
  enabled: boolean;
  rate: number;
};

export type SummitPaymentAmountSummary = {
  amountDue: number;
  configuredExchangeRate?: number;
  currency: SummitCurrency;
  originalUsdAmount: number;
};

export function getSummitDirectBankTransferConfig(): SummitDirectBankTransferConfig {
  const deadlineHours = parsePositiveInteger(process.env.SUMMIT_BANK_TRANSFER_PAYMENT_DEADLINE_HOURS);
  const supportEmail = process.env.SUMMIT_BANK_TRANSFER_SUPPORT_EMAIL || defaultSupportEmail;
  const supportWhatsApp = process.env.SUMMIT_BANK_TRANSFER_SUPPORT_WHATSAPP || defaultSupportWhatsApp;
  const organizerNotificationEmail =
    process.env.SUMMIT_BANK_TRANSFER_ORGANIZER_EMAIL ||
    process.env.SUMMIT_ADMIN_RECIPIENT_EMAIL ||
    defaultSupportEmail;

  const bankDetails: BankTransferBankDetails = {
    accountHolderName:
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_HOLDER_NAME ||
      "Christine Francois",
    accountNumber:
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_NUMBER ||
      "007600014064",
    accountType:
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_TYPE ||
      "Savings",
    bankName:
      process.env.SUMMIT_BANK_TRANSFER_BANK_NAME ||
      "JMMB Bank Trinidad & Tobago",
    branchInformation:
      process.env.SUMMIT_BANK_TRANSFER_BRANCH_INFO ||
      "",
    instructions:
      process.env.SUMMIT_BANK_TRANSFER_INSTRUCTIONS ||
      "",
    supportsLocalTtdTransfers:
      process.env.SUMMIT_BANK_TRANSFER_TTD_CONFIRMATION ||
      "",
  };

  const productionReady = Boolean(
    deadlineHours &&
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_HOLDER_NAME &&
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_NUMBER &&
      process.env.SUMMIT_BANK_TRANSFER_ACCOUNT_TYPE &&
      process.env.SUMMIT_BANK_TRANSFER_BANK_NAME &&
      organizerNotificationEmail &&
      supportEmail &&
      process.env.SUMMIT_BANK_TRANSFER_READY === "true",
  );

  const explicitlyEnabled = process.env.SUMMIT_BANK_TRANSFER_ENABLED === "true";
  const enabled = process.env.NODE_ENV === "production"
    ? explicitlyEnabled && productionReady
    : explicitlyEnabled || process.env.SUMMIT_BANK_TRANSFER_ENABLED !== "false";

  return {
    bankDetails,
    deadlineHours: deadlineHours || undefined,
    deadlineLabel: deadlineHours ? `${deadlineHours} hours from registration` : defaultDeadlinePlaceholder,
    enabled,
    organizerNotificationEmail,
    productionReady,
    supportEmail,
    supportWhatsApp,
  };
}

export function getSummitDirectBankTransferPublicConfig(): SummitDirectBankTransferPublicConfig {
  const config = getSummitDirectBankTransferConfig();

  return {
    enabled: config.enabled,
    rate: summitBankTransferExchangeRate,
  };
}

export function summitPaymentAmounts(
  pricing: Pick<SummitPriceSummary, "total">,
  paymentMethod: SummitPaymentMethod,
): SummitPaymentAmountSummary {
  const originalUsdAmount = decimalAmount(pricing.total);

  if (paymentMethod === "bank_transfer") {
    return {
      amountDue: decimalAmount(originalUsdAmount * summitBankTransferExchangeRate),
      configuredExchangeRate: summitBankTransferExchangeRate,
      currency: "TTD",
      originalUsdAmount,
    };
  }

  return {
    amountDue: originalUsdAmount,
    currency: "USD",
    originalUsdAmount,
  };
}

export function formatSummitCurrency(currency: SummitCurrency, amount: number) {
  const value = decimalAmount(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === "TTD") {
    return `TTD ${value}`;
  }

  return `USD ${value}`;
}

export function calculateBankTransferPaymentDueAt(now = new Date()) {
  const { deadlineHours } = getSummitDirectBankTransferConfig();

  if (!deadlineHours) {
    return undefined;
  }

  return new Date(now.getTime() + deadlineHours * 60 * 60 * 1000).toISOString();
}

export function generateSummitPaymentReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let reference = "HCS-";

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % alphabet.length;
    reference += alphabet[randomIndex];
  }

  return reference;
}

export function defaultBankTransferEligibilityMessage() {
  return "Direct bank transfer is available only for payments sent in TTD from a Trinidad and Tobago bank account. Please confirm your eligibility or select PayPal.";
}

function parsePositiveInteger(value: string | undefined) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function decimalAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
