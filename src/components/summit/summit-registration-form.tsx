"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  calculateSummitPrice,
  getActiveSummitIndividualRate,
  getActiveSummitCorporatePackages,
  isSummitIndividualRateActive,
  summitDateLabel,
  summitCorporatePackages,
  summitIndividualRates,
  summitStartIso,
  trinidadDateKey,
  type SummitCorporatePackageValue,
  type SummitRegistrationType,
} from "@/lib/summit-pricing";
import {
  formatSummitCurrency,
  summitBankTransferExchangeRate,
  type SummitPaymentMethod,
} from "@/lib/summit-bank-transfer";
import { legalPolicyVersions } from "@/lib/legal";
import { SummitPayPalCheckout } from "./summit-paypal-checkout";
import styles from "./human-capacity-summit.module.css";

type FormStatus =
  | { action?: never; registrationId?: never; state: "idle"; message: "" }
  | { action?: PaymentStatusAction; registrationId?: string; state: "awaiting_bank_transfer" | "cancelled" | "error" | "manual_review" | "pending" | "processing" | "submitting" | "success"; message: string };

type PaymentStatusAction = "retry" | "check" | "contact" | "confirmed" | "none";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  organization: string;
  role: string;
  registrationType: SummitRegistrationType;
  corporatePackage: SummitCorporatePackageValue;
  attendeeCount: string;
  paymentMethod: SummitPaymentMethod;
  bankTransferEligibilityAcceptance: boolean;
  hopes: string;
  policyAcceptance: boolean;
  website: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  organization: "",
  role: "",
  registrationType: "individual",
  corporatePackage: summitCorporatePackages[0].value,
  attendeeCount: "1",
  paymentMethod: "paypal",
  bankTransferEligibilityAcceptance: false,
  hopes: "",
  policyAcceptance: false,
  website: "",
};

const duplicateOrderCreationMessage = "A PayPal payment is already being started.";
const idleStatus: FormStatus = { state: "idle", message: "" };

function subscribeToMinuteClock(onStoreChange: () => void) {
  const timer = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(timer);
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getCountdownMinuteSnapshot() {
  return Math.floor(Date.now() / 60_000);
}

function getLocationSnapshot() {
  return `${window.location.search}|${window.location.hash}`;
}

function getServerCountdownNow() {
  return null;
}

function getServerLocationSnapshot() {
  return "";
}

export function SummitRegistrationForm({
  bankTransferEnabled,
  paypalClientId,
  paypalEnvironment,
}: {
  bankTransferEnabled: boolean;
  paypalClientId: string;
  paypalEnvironment: "production" | "sandbox";
}) {
  const [form, setForm] = useState<FormState>(initialForm);
  const formRef = useRef<HTMLFormElement>(null);
  const orderCreationLockRef = useRef(false);
  const [now, setNow] = useState(() => new Date());
  const [retryRegistrationId, setRetryRegistrationId] = useState<string | null>(null);
  const [isStatusBusy, setIsStatusBusy] = useState(false);
  const [status, setStatus] = useState<FormStatus>(idleStatus);
  const countdownMinute = useSyncExternalStore(
    subscribeToMinuteClock,
    getCountdownMinuteSnapshot,
    getServerCountdownNow,
  );
  const locationSnapshot = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getServerLocationSnapshot,
  );

  const attendeeCount = Math.max(1, Number.parseInt(form.attendeeCount, 10) || 1);
  const activeIndividualRate = getActiveSummitIndividualRate(now);
  const activeCorporatePackages = useMemo(() => getActiveSummitCorporatePackages(now), [now]);
  const activeCorporatePackageValues = useMemo(
    () => new Set(activeCorporatePackages.map((corporatePackage) => corporatePackage.value)),
    [activeCorporatePackages],
  );
  const pricing = calculateSummitPrice({
    attendeeCount,
    corporatePackage: form.corporatePackage,
    registrationType: form.registrationType,
  }, now);
  const pricingSummary = pricing.ok ? pricing.summary : null;
  const usdTotal = pricingSummary?.total ?? 0;
  const bankTransferTotal = usdTotal * summitBankTransferExchangeRate;
  const total = form.paymentMethod === "bank_transfer" ? bankTransferTotal : usdTotal;
  const standardIndividualRate = summitIndividualRates.find((rate) => rate.value === "standard");
  const countdown = summitCountdown(
    countdownMinute === null ? null : new Date(countdownMinute * 60_000),
  );
  const returnStatus = paymentReturnStatus(locationSnapshot);
  const displayedStatus = status.state === "idle" ? returnStatus : status;
  const activeRegistrationId = retryRegistrationId ?? displayedStatus.registrationId;
  const activeDeadlineMessage = pricingSummary
    ? summarizeDeadline(pricingSummary.rateDetail, pricingSummary.rateLabel, now)
    : null;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!returnStatus.registrationId) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/human-capacity-summit/paypal/status?registrationId=${encodeURIComponent(returnStatus.registrationId)}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result: PaymentStatusResponse) => {
        const nextStatus = formStatusFromPaymentResponse(result, returnStatus.registrationId);
        if (nextStatus.state !== "idle") {
          setStatus(nextStatus);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [returnStatus.registrationId]);

  useEffect(() => {
    if (form.registrationType !== "corporate") {
      return;
    }

    if (activeCorporatePackageValues.has(form.corporatePackage)) {
      return;
    }

    const nextPackage = activeCorporatePackages[0];
    if (nextPackage) {
      updateField("corporatePackage", nextPackage.value);
    }
  }, [
    activeCorporatePackages,
    activeCorporatePackageValues,
    form.corporatePackage,
    form.registrationType,
  ]);

  function updateField<Field extends keyof FormState>(field: Field, value: FormState[Field]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateRegistrationType(registrationType: SummitRegistrationType) {
    setStatus({ state: "idle", message: "" });
    setRetryRegistrationId(null);
    resetOrderCreationGuard();
    setForm((current) => ({
      ...current,
      bankTransferEligibilityAcceptance: false,
      attendeeCount: "1",
      corporatePackage: activeCorporatePackages[0]?.value ?? summitCorporatePackages[0].value,
      registrationType,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (validateFormBeforePayment()) {
      if (form.paymentMethod === "bank_transfer") {
        void submitBankTransferRegistration();
        return;
      }

      setStatus({
        state: "processing",
        message: "Choose PayPal or Debit or Credit Card below to continue with secure checkout.",
      });
    }
  }

  function resetOrderCreationGuard() {
    orderCreationLockRef.current = false;
  }

  const validateFormBeforePayment = useCallback(() => {
    if (!formRef.current?.reportValidity()) {
      setStatus({
        state: "error",
        message: form.paymentMethod === "bank_transfer"
          ? "Please complete the required registration fields before submitting your bank-transfer registration."
          : "Please complete the required registration fields before starting PayPal checkout.",
      });
      return false;
    }

    if (!pricing.ok) {
      setStatus({ state: "error", message: pricing.message });
      return false;
    }

    return true;
  }, [form.paymentMethod, pricing]);

  const createOrder = useCallback(async () => {
    if (orderCreationLockRef.current) {
      throw new Error(duplicateOrderCreationMessage);
    }

    if (!validateFormBeforePayment()) {
      throw new Error("Please complete the Summit registration form before continuing.");
    }

    orderCreationLockRef.current = true;
    setStatus({ state: "submitting", message: "Opening secure PayPal checkout..." });

    const isRetry = Boolean(retryRegistrationId);
    try {
      const response = await fetch(
        isRetry ? "/api/human-capacity-summit/paypal/retry" : "/api/human-capacity-summit/paypal/create-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isRetry ? { registrationId: retryRegistrationId } : form),
        },
      );

      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        orderId?: string;
        registrationId?: string;
      };

      if (!response.ok || !result.orderId || !result.registrationId) {
        const message = result.message ?? "We couldn't start PayPal checkout. Please try again.";
        resetOrderCreationGuard();
        setStatus({
          action: isRetry && retryRegistrationId ? "retry" : undefined,
          registrationId: retryRegistrationId ?? result.registrationId,
          state: "error",
          message,
        });
        throw new Error(message);
      }

      setRetryRegistrationId(result.registrationId);
      return result.orderId;
    } catch (error) {
      resetOrderCreationGuard();

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("We couldn't start PayPal checkout. Please try again.");
    }
  }, [form, retryRegistrationId, validateFormBeforePayment]);

  async function submitBankTransferRegistration() {
    setStatus({
      state: "submitting",
      message: "Submitting your registration and preparing bank-transfer instructions...",
    });

    try {
      const response = await fetch("/api/human-capacity-summit/bank-transfer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        registrationId?: string;
        thankYouUrl?: string;
      };

      if (!response.ok || !result.registrationId || !result.thankYouUrl) {
        setStatus({
          registrationId: result.registrationId,
          state: "error",
          message:
            result.message ||
            "We couldn't submit your bank-transfer registration right now. Please try again or contact Francois Consulting Group.",
        });
        return;
      }

      window.location.assign(result.thankYouUrl);
    } catch {
      setStatus({
        state: "error",
        message:
          "We couldn't submit your bank-transfer registration right now. Please try again or contact Francois Consulting Group.",
      });
    }
  }

  async function handleRetryPayment() {
    if (!displayedStatus.registrationId) {
      setStatus({ state: "idle", message: "" });
      return;
    }

    resetOrderCreationGuard();
    setRetryRegistrationId(displayedStatus.registrationId);
    setStatus({
      action: "none",
      registrationId: displayedStatus.registrationId,
      state: "processing",
      message: "Choose PayPal or Debit or Credit Card below to try your payment again.",
    });
  }

  async function handleCheckPaymentStatus() {
    if (!displayedStatus.registrationId) {
      return;
    }

    setIsStatusBusy(true);
    try {
      setStatus({
        action: "check",
        registrationId: displayedStatus.registrationId,
        state: "processing",
        message: "Checking your PayPal payment status...",
      });

      const response = await fetch("/api/human-capacity-summit/paypal/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: displayedStatus.registrationId }),
      });

      const result = (await response.json().catch(() => ({}))) as PaymentStatusResponse;

      if (!response.ok) {
        setStatus({
          action: "contact",
          registrationId: displayedStatus.registrationId,
          state: "manual_review",
          message:
            "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment.",
        });
        return;
      }

      setStatus(formStatusFromPaymentResponse(result, displayedStatus.registrationId));
    } catch {
      setStatus({
        action: "contact",
        registrationId: displayedStatus.registrationId,
        state: "manual_review",
        message:
          "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment.",
      });
      return;
    } finally {
      setIsStatusBusy(false);
    }
  }

  async function handlePayPalApprove(orderId: string, actions: { restart?: () => Promise<void> | void }) {
    if (!activeRegistrationId) {
      resetOrderCreationGuard();
      setStatus({
        state: "error",
        message: "We couldn't match this PayPal payment to your registration. Please try again.",
      });
      return;
    }

    setStatus({
      action: "check",
      registrationId: activeRegistrationId,
      state: "processing",
      message: "Verifying your PayPal payment...",
    });

    try {
      const response = await fetch("/api/human-capacity-summit/paypal/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, registrationId: activeRegistrationId }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        debug_id?: string;
        details?: Array<{ description?: string; issue?: string }>;
        payerActionUrl?: string;
        registrationId?: string;
        status?: string;
        thankYouUrl?: string;
      };

      const detail = result.details?.[0];

      if (detail?.issue === "INSTRUMENT_DECLINED" && typeof actions.restart === "function") {
        resetOrderCreationGuard();
        setStatus({
          action: "retry",
          registrationId: activeRegistrationId,
          state: "error",
          message:
            "PayPal could not complete the payment with the selected funding source. Please choose another PayPal option and try again.",
        });
        await actions.restart();
        return;
      }

      if (detail?.issue === "PAYER_ACTION_REQUIRED" && result.payerActionUrl) {
        window.location.assign(result.payerActionUrl);
        return;
      }

      if (response.ok && result.thankYouUrl) {
        window.location.assign(result.thankYouUrl);
        return;
      }

      resetOrderCreationGuard();
      setStatus(
        statusFromCaptureResponse({
          description: detail?.description,
          issue: detail?.issue,
          registrationId: result.registrationId ?? activeRegistrationId,
          status: result.status,
        }),
      );
    } catch {
      resetOrderCreationGuard();
      setStatus({
        action: "retry",
        registrationId: activeRegistrationId,
        state: "error",
        message:
          "We couldn't complete PayPal checkout right now. Please try again or contact Francois Consulting Group if the problem continues.",
      });
    }
  }

  async function handlePayPalCancel() {
    resetOrderCreationGuard();

    if (activeRegistrationId) {
      await fetch("/api/human-capacity-summit/paypal/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: activeRegistrationId }),
      }).catch(() => undefined);
    }

    setStatus({
      action: "retry",
      registrationId: activeRegistrationId,
      state: "cancelled",
      message:
        "Your payment was cancelled. You have not been charged, and your Summit registration has not been confirmed.",
    });
  }

  function handlePayPalError(message: string) {
    if (message === duplicateOrderCreationMessage) {
      return;
    }

    resetOrderCreationGuard();
    setStatus((current) => {
      if (current.state === "error" && current.message) {
        return current;
      }

      return {
        action: activeRegistrationId ? "retry" : "none",
        registrationId: activeRegistrationId,
        state: "error",
        message:
          "We couldn't complete PayPal checkout right now. Please try again or contact Francois Consulting Group if the problem continues.",
      };
    });
    console.error("Summit PayPal checkout failed on the client.", { message });
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formLayout}>
        <div className={styles.formMain}>
          <section className={styles.countdownCard} aria-label={`Countdown to ${summitDateLabel}`}>
            <p className={styles.summaryKicker}>Summit countdown</p>
            <div className={styles.countdownGrid}>
              <span>
                <strong>{countdown.days}</strong>
                <small>Days</small>
              </span>
              <span>
                <strong>{countdown.hours}</strong>
                <small>Hours</small>
              </span>
              <span>
                <strong>{countdown.minutes}</strong>
                <small>Minutes</small>
              </span>
            </div>
            <p>{summitDateLabel} online</p>
            {activeDeadlineMessage ? (
              <p className={styles.deadlineHint}>{activeDeadlineMessage}</p>
            ) : null}
          </section>

          <div className={styles.formSection}>
            <fieldset className={styles.typeToggle}>
              <legend>Registration category</legend>
              <div className={styles.typeGrid}>
                <label className={styles.typeCard}>
                  <input
                    type="radio"
                    name="registrationType"
                    value="individual"
                    checked={form.registrationType === "individual"}
                    onChange={() => updateRegistrationType("individual")}
                  />
                  <span>
                    <strong>Individual</strong>
                    <small>{activeIndividualRate ? `${activeIndividualRate.label}: $${activeIndividualRate.price} per attendee` : "Registration closed"}</small>
                  </span>
                </label>
                <label className={styles.typeCard}>
                  <input
                    type="radio"
                    name="registrationType"
                    value="corporate"
                    checked={form.registrationType === "corporate"}
                    onChange={() => updateRegistrationType("corporate")}
                  />
                  <span>
                    <strong>Corporate Group</strong>
                    <small>Early bird and standard packages for 10 or 20 attendees</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className={styles.formGrid}>
              <FormField label="First Name" htmlFor="summit-first-name" required>
                <input
                  id="summit-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                />
              </FormField>
              <FormField label="Last Name" htmlFor="summit-last-name" required>
                <input
                  id="summit-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                />
              </FormField>
              <FormField label="Email" htmlFor="summit-email" required>
                <input
                  id="summit-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </FormField>
              <FormField label="Mobile / WhatsApp" htmlFor="summit-phone">
                <input
                  id="summit-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Including country code"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </FormField>
              <FormField label="Country" htmlFor="summit-country" required>
                <input
                  id="summit-country"
                  name="country"
                  autoComplete="country-name"
                  required
                  value={form.country}
                  onChange={(event) => updateField("country", event.target.value)}
                />
              </FormField>
              <FormField label="Organization" htmlFor="summit-organization" required>
                <input
                  id="summit-organization"
                  name="organization"
                  autoComplete="organization"
                  required
                  value={form.organization}
                  onChange={(event) => updateField("organization", event.target.value)}
                />
              </FormField>
              <FormField label="Role / Title" htmlFor="summit-role" required>
                <input
                  id="summit-role"
                  name="role"
                  autoComplete="organization-title"
                  required
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                />
              </FormField>
              <FormField label="Number Attending" htmlFor="summit-attendee-count" required>
                <input
                  id="summit-attendee-count"
                  name="attendeeCount"
                  type="number"
                  min="1"
                  max={
                    form.registrationType === "corporate"
                      ? summitCorporatePackages.find(
                          (corporatePackage) => corporatePackage.value === form.corporatePackage,
                        )?.capacity
                      : undefined
                  }
                  required
                  value={form.attendeeCount}
                  onChange={(event) => updateField("attendeeCount", event.target.value)}
                />
              </FormField>
            </div>
          </div>

      <input
        aria-hidden="true"
        autoComplete="off"
        className={styles.honeypot}
        name="website"
        tabIndex={-1}
        value={form.website}
        onChange={(event) => updateField("website", event.target.value)}
      />

      <div className={styles.registrationChoices}>
        {form.registrationType === "individual" ? (
          <section className={styles.fieldset} aria-label="Individual registration rate">
            <p className={styles.summaryKicker}>Individual registration options</p>
            <div className={styles.optionGrid}>
              {summitIndividualRates.map((rate) => {
                const isActive = isSummitIndividualRateActive(rate.value, now);

                return (
                  <div
                    key={rate.value}
                    className={styles.rateCard}
                    aria-disabled={!isActive}
                    data-active={isActive}
                    data-disabled={!isActive}
                  >
                    <span>
                      <strong>{rate.label}</strong>
                      <small>
                        {isActive ? rate.detail : `${rate.detail} - not currently available`}
                        {isActive ? ` | ${countdownLabel(rate.endsOn, now)}` : ""}
                      </small>
                    </span>
                    <PriceDisplay
                      originalPrice={
                        rate.value === "early-bird" ? standardIndividualRate?.price : undefined
                      }
                      price={rate.price}
                    />
                  </div>
                );
              })}
            </div>
            <p className={styles.fieldHint}>
              The active rate is applied automatically based on the registration date.
            </p>
          </section>
        ) : (
          <fieldset className={styles.fieldset}>
            <legend>Corporate package</legend>
            <p className={styles.fieldHint}>
              Corporate packages are fixed prices and are not multiplied by attendee count.
            </p>
            <div className={styles.optionGrid}>
              {summitCorporatePackages.map((option) => {
                const isActive = activeCorporatePackageValues.has(option.value);

                return (
                  <label
                    key={option.value}
                    className={styles.optionCard}
                    aria-disabled={!isActive}
                    data-disabled={!isActive}
                  >
                    <input
                      type="radio"
                      name="corporatePackage"
                      value={option.value}
                      checked={form.corporatePackage === option.value}
                      disabled={!isActive}
                      onChange={(event) =>
                        updateField(
                          "corporatePackage",
                          event.target.value as SummitCorporatePackageValue,
                        )
                      }
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>
                        {isActive
                          ? `Maximum ${option.capacity} attendees | ${countdownLabel(
                              option.endsOn,
                              now,
                            )}`
                          : `${option.detail} - not currently available`}
                      </small>
                    </span>
                    <PriceDisplay originalPrice={option.originalPrice} price={option.price} />
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </div>

      <FormField label="What do you hope to explore at the Summit?" htmlFor="summit-hopes">
        <textarea
          id="summit-hopes"
          name="hopes"
          rows={4}
          value={form.hopes}
          onChange={(event) => updateField("hopes", event.target.value)}
        />
      </FormField>

      <p className={styles.privacyMicrocopy}>
        Your information will be handled in accordance with our{" "}
        <Link href="/privacy-policy" target="_blank" rel="noreferrer">
          Privacy Policy
        </Link>
        .
      </p>

        </div>

        <aside className={styles.formSummaryColumn}>
          <section className={styles.orderSummary} aria-live="polite">
            <p className={styles.summaryKicker}>Order summary</p>
            {pricingSummary ? (
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{pricingSummary.categoryLabel}</dd>
                </div>
                <div>
                  <dt>{form.registrationType === "individual" ? "Rate" : "Package"}</dt>
                  <dd>{pricingSummary.rateLabel}</dd>
                </div>
                <div>
                  <dt>Current window</dt>
                  <dd>{pricingSummary.rateDetail}</dd>
                </div>
                <div>
                  <dt>Number attending</dt>
                  <dd>{pricingSummary.attendeeCount}</dd>
                </div>
                {pricingSummary.unitPrice ? (
                  <div>
                    <dt>{form.paymentMethod === "bank_transfer" ? "USD price per attendee" : "Price per attendee"}</dt>
                    <dd>{formatSummitCurrency("USD", pricingSummary.unitPrice)}</dd>
                  </div>
                ) : null}
                {pricingSummary.originalPrice ? (
                  <div>
                    <dt>Regular package price</dt>
                    <dd>
                      <s>{formatSummitCurrency("USD", pricingSummary.originalPrice)}</s>
                    </dd>
                  </div>
                ) : null}
                {pricingSummary.fixedPackagePrice ? (
                  <div>
                    <dt>{form.paymentMethod === "bank_transfer" ? "Original USD package price" : "Selected package price"}</dt>
                    <dd>{formatSummitCurrency("USD", pricingSummary.fixedPackagePrice)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Payment method</dt>
                  <dd>{form.paymentMethod === "bank_transfer" ? "Direct Bank Transfer" : "PayPal / Card"}</dd>
                </div>
                {form.paymentMethod === "bank_transfer" ? (
                  <>
                    <div>
                      <dt>Fixed conversion rate</dt>
                      <dd>USD 1 = TTD 7</dd>
                    </div>
                    <div>
                      <dt>TTD amount due</dt>
                      <dd>{formatSummitCurrency("TTD", bankTransferTotal)}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            ) : (
              <p className={styles.fieldHint}>{pricing.ok ? "" : pricing.message}</p>
            )}
            {form.paymentMethod === "bank_transfer" ? (
              <p className={styles.fieldHint}>
                TTD prices are calculated using the Summit&apos;s fixed rate of USD 1 = TTD 7.
              </p>
            ) : null}
          </section>

          <fieldset className={styles.fieldset}>
            <legend>Terms</legend>
            <label className={styles.policyConsent}>
              <input
                type="checkbox"
                name="policyAcceptance"
                required
                checked={form.policyAcceptance}
                onChange={(event) => updateField("policyAcceptance", event.target.checked)}
              />
              <span>
                I have read and agree to the{" "}
                <Link href={legalPolicyVersions.terms.route} target="_blank" rel="noreferrer">
                  Terms and Conditions
                </Link>
                .
              </span>
            </label>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>Secure payment</legend>
            <p className={styles.fieldHint}>
              Residents of Trinidad and Tobago may choose to make payment via bank-to-bank
              transfer.
            </p>
            <div className={styles.paymentRow}>
              <label className={styles.paymentOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={form.paymentMethod === "paypal"}
                  onChange={() => updateField("paymentMethod", "paypal")}
                />
                <span>
                  <strong>PayPal / Debit or Credit Card</strong>
                </span>
              </label>
              {bankTransferEnabled ? (
                <label className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={form.paymentMethod === "bank_transfer"}
                    onChange={() => updateField("paymentMethod", "bank_transfer")}
                  />
                  <span>
                    <strong>Direct Bank Transfer - Pay in TTD</strong>
                  </span>
                </label>
              ) : null}
            </div>
            {form.paymentMethod === "bank_transfer" ? (
              <div className={styles.paymentDetails}>
                <p className={styles.fieldHint}>
                  Pay in TTD from a Trinidad and Tobago bank account. Your registration will
                  remain pending until the transfer has been received and verified.
                </p>
              </div>
            ) : null}
            {form.paymentMethod === "paypal" ? (
              <SummitPayPalCheckout
                clientId={paypalClientId}
                environment={paypalEnvironment}
                onApprove={handlePayPalApprove}
                onCancel={handlePayPalCancel}
                onCreateOrder={createOrder}
                onError={handlePayPalError}
              />
            ) : (
              <div className={styles.paypalPanel}>
                <p className={styles.fieldHint}>
                  Submitting this registration does not confirm your place. Your registration
                  will be confirmed only after the bank transfer has been received and verified.
                </p>
              </div>
            )}
          </fieldset>

          <div className={styles.totalRow}>
            <span>Total</span>
            <strong>
              {form.paymentMethod === "bank_transfer"
                ? formatSummitCurrency("TTD", total)
                : formatSummitCurrency("USD", total)}
            </strong>
          </div>

          <button type="submit" disabled={isStatusBusy}>
            {form.paymentMethod === "bank_transfer"
              ? "Submit registration and receive bank details"
              : "Review registration before payment"}
          </button>
          <p
            aria-live="polite"
            aria-atomic="true"
            className={styles.formStatus}
            data-state={displayedStatus.state}
          >
            {displayedStatus.message}
          </p>
          <PaymentStatusActionButton
            disabled={isStatusBusy || status.state === "processing"}
            onCheck={handleCheckPaymentStatus}
            onRetry={handleRetryPayment}
            status={displayedStatus}
          />
        </aside>
      </div>
    </form>
  );
}

function summitCountdown(now: Date | null) {
  if (!now) {
    return { days: "--", hours: "--", minutes: "--" };
  }

  const milliseconds = Math.max(0, new Date(summitStartIso).getTime() - now.getTime());
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

function paymentReturnStatus(location = ""): FormStatus {
  if (!location) {
    return { state: "idle", message: "" };
  }

  const [search] = location.split("|");
  const params = new URLSearchParams(search);
  const paymentStatus = params.get("payment");
  const registrationId = params.get("registration") || undefined;

  if (paymentStatus === "success") {
    return {
      action: "confirmed",
      registrationId,
      state: "success",
      message: "Payment confirmed. Your Summit registration has been received.",
    };
  }

  if (paymentStatus === "cancelled") {
    return {
      action: "retry",
      registrationId,
      state: "cancelled",
      message:
        "Your payment was cancelled. You have not been charged, and your Summit registration has not been confirmed.",
    };
  }

  if (paymentStatus === "failed" || paymentStatus === "declined" || paymentStatus === "payment_failed") {
    return {
      action: "retry",
      registrationId,
      state: "error",
      message:
        "PayPal could not complete your payment, so your Summit registration has not yet been confirmed. Please try again or choose another payment method through PayPal.",
    };
  }

  if (paymentStatus === "pending") {
    return {
      action: "check",
      registrationId,
      state: "pending",
      message:
        "Your payment is still being processed. Your registration will be confirmed once PayPal completes the payment.",
    };
  }

  if (paymentStatus === "processing" || paymentStatus === "verification_required") {
    return {
      action: "check",
      registrationId,
      state: "processing",
      message:
        "We're still verifying your payment. Please do not try to pay again yet. Your registration will be confirmed as soon as the payment is verified.",
    };
  }

  if (paymentStatus === "manual_review" || paymentStatus === "refunded" || paymentStatus === "reversed") {
    return {
      action: "contact",
      registrationId,
      state: "manual_review",
      message:
        "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment.",
    };
  }

  return { state: "idle", message: "" };
}

type PaymentStatusResponse = {
  action?: PaymentStatusAction;
  message?: string;
  state?: "idle" | "awaiting_bank_transfer" | "cancelled" | "declined" | "expired" | "failed" | "manual_review" | "paid" | "payment_under_review" | "pending" | "refunded" | "reversed" | "verification_required";
};

function formStatusFromPaymentResponse(
  response: PaymentStatusResponse,
  registrationId?: string,
): FormStatus {
  if (!response.message || !response.state || response.state === "idle") {
    return { state: "idle", message: "" };
  }

  const state = response.state === "paid"
    ? "success"
    : response.state === "awaiting_bank_transfer"
      ? "awaiting_bank_transfer"
    : response.state === "pending"
      ? "pending"
      : response.state === "verification_required"
        ? "processing"
        : response.state === "payment_under_review"
          ? "manual_review"
        : response.state === "cancelled"
          ? "cancelled"
          : response.state === "manual_review" || response.state === "refunded" || response.state === "reversed"
            ? "manual_review"
            : "error";

  return {
    action: response.action ?? "none",
    registrationId,
    state,
    message: response.message,
  };
}

function statusFromCaptureResponse({
  description,
  issue,
  registrationId,
  status,
}: {
  description?: string;
  issue?: string;
  registrationId?: string;
  status?: string;
}): FormStatus {
  if (status === "PENDING") {
    return {
      action: "check",
      registrationId,
      state: "pending",
      message:
        "Your payment is still being processed. Your registration will be confirmed once PayPal completes the payment.",
    };
  }

  if (status === "VERIFICATION_REQUIRED") {
    return {
      action: "check",
      registrationId,
      state: "processing",
      message:
        "We're still verifying your payment. Please do not try to pay again yet. Your registration will be confirmed as soon as the payment is verified.",
    };
  }

  if (status === "MANUAL_REVIEW") {
    return {
      action: "contact",
      registrationId,
      state: "manual_review",
      message:
        description ||
        "We're reviewing this payment with PayPal. Please contact Francois Consulting Group before trying another payment.",
    };
  }

  return {
    action: issue === "INSTRUMENT_DECLINED" ? "retry" : "contact",
    registrationId,
    state: "error",
    message:
      description ||
      "PayPal could not complete your payment, so your Summit registration has not yet been confirmed.",
  };
}

function PaymentStatusActionButton({
  disabled,
  onCheck,
  onRetry,
  status,
}: {
  disabled: boolean;
  onCheck: () => void;
  onRetry: () => void;
  status: FormStatus;
}) {
  if (!status.action || status.action === "none" || status.action === "confirmed") {
    return null;
  }

  if (status.action === "retry") {
    return (
      <button type="button" className={styles.secondaryAction} disabled={disabled} onClick={onRetry}>
        Try payment again
      </button>
    );
  }

  if (status.action === "check") {
    return (
      <button type="button" className={styles.secondaryAction} disabled={disabled} onClick={onCheck}>
        Check payment status
      </button>
    );
  }

  return (
    <a className={styles.secondaryAction} href="/contact">
      Contact organiser
    </a>
  );
}

type FormFieldProps = {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
  required?: boolean;
};

function FormField({ children, htmlFor, label, required }: FormFieldProps) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span>
        {label}
        {required ? <b aria-label="required">*</b> : null}
      </span>
      {children}
    </label>
  );
}

function PriceDisplay({
  originalPrice,
  price,
}: {
  originalPrice?: number;
  price: number;
}) {
  return (
    <b className={styles.priceStack}>
      {originalPrice ? <s>${originalPrice.toLocaleString("en-US")}</s> : null}
      <span>${price.toLocaleString("en-US")}</span>
    </b>
  );
}

function countdownLabel(endsOn: string, now: Date) {
  const today = trinidadDateKey(now);
  const difference = dayDifference(today, endsOn);

  if (difference <= 0) {
    return `Ends ${formatDeadline(endsOn)}`;
  }

  if (difference === 1) {
    return "Ends tomorrow";
  }

  if (difference <= 14) {
    return `Ends in ${difference} days`;
  }

  return `Ends ${formatDeadline(endsOn)}`;
}

function summarizeDeadline(rateDetail: string, rateLabel: string, now: Date) {
  const match = rateDetail.match(/(\d{4}-\d{2}-\d{2}|[A-Z][a-z]+ \d{1,2}, \d{4})$/);
  const fallbackDate = rateDetail.replace(/^Ends\s+/, "");
  const endsOn = match?.[1] ?? fallbackDate;
  const deadline = normalizeDateKey(endsOn);

  if (!deadline) {
    return null;
  }

  const difference = dayDifference(trinidadDateKey(now), deadline);

  if (difference === 0) {
    return `${rateLabel} closes today, ${formatDeadline(deadline)}.`;
  }

  if (difference === 1) {
    return `${rateLabel} closes tomorrow, ${formatDeadline(deadline)}.`;
  }

  if (difference > 1 && difference <= 30) {
    return `${rateLabel} closes in ${difference} days on ${formatDeadline(deadline)}.`;
  }

  return `${rateLabel} closes on ${formatDeadline(deadline)}.`;
}

function normalizeDateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = Date.parse(`${value} UTC`);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString().slice(0, 10);
}

function formatDeadline(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function dayDifference(fromDateKey: string, toDateKey: string) {
  const start = Date.parse(`${fromDateKey}T00:00:00Z`);
  const end = Date.parse(`${toDateKey}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}
