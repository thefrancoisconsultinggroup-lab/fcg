"use client";

import { useEffect, useMemo, useState } from "react";
import { summitPaymentMethods } from "@/data/human-capacity-summit";
import {
  calculateSummitPrice,
  getActiveSummitCorporatePackages,
  getActiveSummitIndividualRate,
  isSummitIndividualRateActive,
  summitDateLabel,
  summitCorporatePackages,
  summitIndividualRates,
  summitStartIso,
  type SummitCorporatePackageValue,
  type SummitRegistrationType,
} from "@/lib/summit-pricing";
import styles from "./human-capacity-summit.module.css";

type PaymentMethod = (typeof summitPaymentMethods)[number];

type FormStatus =
  | { action?: never; registrationId?: never; state: "idle"; message: "" }
  | { action?: PaymentStatusAction; registrationId?: string; state: "cancelled" | "error" | "manual_review" | "pending" | "processing" | "submitting" | "success"; message: string };

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
  paymentMethod: PaymentMethod;
  hopes: string;
  consent: boolean;
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
  paymentMethod: summitPaymentMethods[0],
  hopes: "",
  consent: false,
  website: "",
};

export function SummitRegistrationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [now, setNow] = useState(() => new Date());
  const [status, setStatus] = useState<FormStatus>({ state: "idle", message: "" });
  const [returnStatus, setReturnStatus] = useState<FormStatus>(() => paymentReturnStatus());

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
  const total = pricingSummary?.total ?? 0;
  const standardIndividualRate = summitIndividualRates.find((rate) => rate.value === "standard");
  const isLivePaymentTest = form.registrationType === "live-test";
  const countdown = summitCountdown(now);
  const displayedStatus = status.state === "idle" ? returnStatus : status;

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
          setReturnStatus(nextStatus);
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
    setForm((current) => ({
      ...current,
      attendeeCount: "1",
      corporatePackage: activeCorporatePackages[0]?.value ?? summitCorporatePackages[0].value,
      registrationType,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ state: "submitting", message: "Opening secure PayPal checkout..." });

    if (!pricing.ok) {
      setStatus({ state: "error", message: pricing.message });
      return;
    }

    const response = await fetch("/api/human-capacity-summit/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = (await response.json().catch(() => ({}))) as {
      approvalUrl?: string;
      message?: string;
    };

    if (!response.ok || !result.approvalUrl) {
      setStatus({
        state: "error",
        message:
          result.message ??
          "We couldn't start PayPal checkout. Please try again.",
      });
      return;
    }

    window.location.assign(result.approvalUrl);
  }

  async function handleRetryPayment() {
    if (!displayedStatus.registrationId) {
      setStatus({ state: "idle", message: "" });
      return;
    }

    setStatus({ state: "submitting", message: "Opening secure PayPal checkout..." });

    const response = await fetch("/api/human-capacity-summit/paypal/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: displayedStatus.registrationId }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      approvalUrl?: string;
      message?: string;
      status?: PaymentStatusResponse;
    };

    if (response.ok && result.approvalUrl) {
      window.location.assign(result.approvalUrl);
      return;
    }

    if (result.status) {
      setStatus(formStatusFromPaymentResponse(result.status, displayedStatus.registrationId));
      return;
    }

    setStatus({
      action: "retry",
      registrationId: displayedStatus.registrationId,
      state: "error",
      message: result.message ?? "We couldn't start PayPal checkout. Please try again.",
    });
  }

  async function handleCheckPaymentStatus() {
    if (!displayedStatus.registrationId) {
      return;
    }

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
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formLayout}>
        <div className={styles.formMain}>
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
                    <small>Early bird and regular packages for 10 or 20 attendees</small>
                  </span>
                </label>
                <label className={styles.typeCard}>
                  <input
                    type="radio"
                    name="registrationType"
                    value="live-test"
                    checked={form.registrationType === "live-test"}
                    onChange={() => updateRegistrationType("live-test")}
                  />
                  <span>
                    <strong>Live Payment Test</strong>
                    <small>Temporary US$5.00 PayPal checkout for live gateway verification</small>
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
                    isLivePaymentTest
                      ? 1
                      : form.registrationType === "corporate"
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
        ) : isLivePaymentTest ? (
          <section className={styles.fieldset} aria-label="Live payment test">
            <p className={styles.summaryKicker}>Temporary test option</p>
            <div className={styles.optionGrid}>
              <div className={styles.rateCard} data-active data-disabled={false}>
                <span>
                  <strong>Live Payment Test</strong>
                  <small>Temporary US$5.00 PayPal checkout for live gateway verification</small>
                </span>
                <PriceDisplay price={5} />
              </div>
            </div>
            <p className={styles.fieldHint}>
              This option is intentionally temporary and should be removed after live payment testing is complete.
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
                          ? `Maximum ${option.capacity} attendees`
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

      <label className={styles.consent}>
        <input
          type="checkbox"
          name="consent"
          required
          checked={form.consent}
          onChange={(event) => updateField("consent", event.target.checked)}
        />
        <span>
          I understand that Francois Consulting Group will use the information I provide to
          communicate with me regarding my registration for and participation in The Human
          Capacity Summit.
        </span>
      </label>

        </div>

        <aside className={styles.formSummaryColumn}>
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
          </section>

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
                  <dt>Number attending</dt>
                  <dd>{pricingSummary.attendeeCount}</dd>
                </div>
                {pricingSummary.unitPrice ? (
                  <div>
                    <dt>Price per attendee</dt>
                    <dd>${pricingSummary.unitPrice}</dd>
                  </div>
                ) : null}
                {pricingSummary.originalPrice ? (
                  <div>
                    <dt>Regular package price</dt>
                    <dd>
                      <s>${pricingSummary.originalPrice.toLocaleString("en-US")}</s>
                    </dd>
                  </div>
                ) : null}
                {pricingSummary.fixedPackagePrice ? (
                  <div>
                    <dt>Selected package price</dt>
                    <dd>${pricingSummary.fixedPackagePrice.toLocaleString("en-US")}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Payment method</dt>
                  <dd>{form.paymentMethod}</dd>
                </div>
              </dl>
            ) : (
              <p className={styles.fieldHint}>{pricing.ok ? "" : pricing.message}</p>
            )}
          </section>

          <fieldset className={styles.fieldset}>
            <legend>Payment method</legend>
            <p className={styles.fieldHint}>PayPal is the only payment method available for now.</p>
            <div className={styles.paymentRow}>
              {summitPaymentMethods.map((method) => (
                <label key={method} className={styles.paymentOption}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={form.paymentMethod === method}
                    onChange={(event) =>
                      updateField("paymentMethod", event.target.value as PaymentMethod)
                    }
                  />
                  <span className={styles.paypalLogo} aria-label="PayPal">
                    <span>Pay</span>
                    <span>Pal</span>
                  </span>
                  <span>{method}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.totalRow}>
            <span>Total</span>
            <strong>${total.toLocaleString("en-US")}</strong>
          </div>

          <button type="submit" disabled={displayedStatus.state === "submitting"}>
            {displayedStatus.state === "submitting" ? "Submitting..." : "Submit Registration"}
          </button>
          <p aria-live="polite" className={styles.formStatus} data-state={displayedStatus.state}>
            {displayedStatus.message}
          </p>
          <PaymentStatusActionButton
            disabled={status.state === "submitting" || status.state === "processing"}
            onCheck={handleCheckPaymentStatus}
            onRetry={handleRetryPayment}
            status={displayedStatus}
          />
        </aside>
      </div>
    </form>
  );
}

function summitCountdown(now: Date) {
  const milliseconds = Math.max(0, new Date(summitStartIso).getTime() - now.getTime());
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

function paymentReturnStatus(): FormStatus {
  if (typeof window === "undefined") {
    return { state: "idle", message: "" };
  }

  const paymentStatus = new URLSearchParams(window.location.search).get("payment");
  const registrationId = new URLSearchParams(window.location.search).get("registration") || undefined;

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
  state?: "idle" | "cancelled" | "declined" | "failed" | "pending" | "verification_required" | "manual_review" | "refunded" | "reversed" | "paid";
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
    : response.state === "pending"
      ? "pending"
      : response.state === "verification_required"
        ? "processing"
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
