"use client";

import { useMemo } from "react";
import {
  FUNDING,
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import styles from "./human-capacity-summit.module.css";

type PayPalFundingSource = typeof FUNDING.PAYPAL | typeof FUNDING.CARD;

const paypalButtonStyle = {
  color: "gold",
  disableMaxWidth: true,
  height: 48,
  label: "pay",
  layout: "vertical",
  shape: "rect",
} as const;

const cardButtonStyle = {
  color: "black",
  disableMaxWidth: true,
  height: 48,
  layout: "vertical",
  shape: "rect",
} as const;

type SummitPayPalCheckoutProps = {
  clientId: string;
  environment: "production" | "sandbox";
  onApprove: (orderId: string, actions: { restart?: () => Promise<void> | void }) => Promise<void>;
  onCancel: () => Promise<void>;
  onCreateOrder: () => Promise<string>;
  onError: (message: string) => void;
};

export function SummitPayPalCheckout({
  clientId,
  environment,
  onApprove,
  onCancel,
  onCreateOrder,
  onError,
}: SummitPayPalCheckoutProps) {
  if (!clientId) {
    return (
      <div className={styles.paypalPanel}>
        <p className={styles.fieldHint}>
          PayPal checkout is not configured yet. Please contact Francois Consulting Group directly to reserve your place.
        </p>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        components: "buttons,funding-eligibility",
        currency: "USD",
        disableFunding: "venmo,paylater,credit,applepay",
        environment,
        intent: "capture",
      }}
    >
      <SummitPayPalCheckoutButtons
        onApprove={onApprove}
        onCancel={onCancel}
        onCreateOrder={onCreateOrder}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}

function SummitPayPalCheckoutButtons({
  onApprove,
  onCancel,
  onCreateOrder,
  onError,
}: Omit<SummitPayPalCheckoutProps, "clientId" | "environment">) {
  const [{ isPending, isRejected, isResolved }] = usePayPalScriptReducer();
  const eligibility = useMemo(() => {
    if (!isResolved || typeof window === "undefined" || !window.paypal?.Buttons) {
      return {
        card: false,
        checked: false,
        paypal: false,
      };
    }

    const checkEligibility = (fundingSource: PayPalFundingSource) => {
      try {
        const buttonsFactory = window.paypal?.Buttons;
        if (!buttonsFactory) {
          return false;
        }

        return buttonsFactory({ fundingSource }).isEligible();
      } catch {
        return false;
      }
    };

    return {
      card: checkEligibility(FUNDING.CARD),
      checked: true,
      paypal: checkEligibility(FUNDING.PAYPAL),
    };
  }, [isResolved]);

  if (isRejected) {
    return (
      <div className={styles.paypalPanel}>
        <p className={styles.formStatus} data-state="error">
          We couldn&apos;t load PayPal checkout right now. Please refresh this page or contact Francois Consulting Group.
        </p>
      </div>
    );
  }

  if (isPending || !eligibility.checked) {
    return (
      <div className={styles.paypalPanel} aria-live="polite" aria-busy="true">
        <p className={styles.formStatus} data-state="processing">
          Loading secure PayPal checkout options...
        </p>
      </div>
    );
  }

  if (!eligibility.paypal && !eligibility.card) {
    return (
      <div className={styles.paypalPanel}>
        <p className={styles.fieldHint}>
          PayPal checkout is currently unavailable for this buyer. Please contact Francois Consulting Group for help with registration.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.paypalPanel}>
      <p className={styles.fieldHint}>
        Complete the registration form, then choose your secure PayPal checkout option below.
      </p>
      <div className={styles.paypalButtonStack}>
        {eligibility.paypal ? (
          <div className={styles.paypalButtonSlot}>
            <PayPalButtons
              createOrder={onCreateOrder}
              fundingSource={FUNDING.PAYPAL}
              onApprove={(data, actions) => onApprove(data.orderID, actions)}
              onCancel={() => onCancel()}
              onError={(error) => onError(error instanceof Error ? error.message : "PayPal checkout failed.")}
              style={paypalButtonStyle}
            />
          </div>
        ) : null}
        {eligibility.card ? (
          <div className={styles.paypalButtonSlot}>
            <PayPalButtons
              createOrder={onCreateOrder}
              fundingSource={FUNDING.CARD}
              onApprove={(data, actions) => onApprove(data.orderID, actions)}
              onCancel={() => onCancel()}
              onError={(error) => onError(error instanceof Error ? error.message : "Card checkout failed.")}
              style={cardButtonStyle}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
