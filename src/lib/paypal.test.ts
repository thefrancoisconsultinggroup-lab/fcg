import assert from "node:assert/strict";
import test from "node:test";
import { getPayPalWebhookId, hasPayPalWebhookConfig, paypalRuntimeDiagnostics } from "@/lib/paypal";

type EnvSnapshot = Record<string, string | undefined>;

const payPalEnvKeys = [
  "PAYPAL_ENV",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
  "PAYPAL_SANDBOX_CLIENT_ID",
  "PAYPAL_SANDBOX_CLIENT_SECRET",
  "PAYPAL_SANDBOX_SECRET_KEY",
  "PAYPAL_SANDBOX_WEBHOOK_ID",
  "PAYPAL_BASE_URL",
] as const;

async function withPayPalEnv(
  overrides: Partial<Record<(typeof payPalEnvKeys)[number], string | undefined>>,
  fn: () => void | Promise<void>,
) {
  const previous: EnvSnapshot = {};

  for (const key of payPalEnvKeys) {
    previous[key] = process.env[key];
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await fn();
  } finally {
    for (const key of payPalEnvKeys) {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("sandbox mode uses sandbox webhook and sandbox credentials", async () => {
  await withPayPalEnv(
    {
      PAYPAL_ENVIRONMENT: "sandbox",
      PAYPAL_CLIENT_ID: "LIVE-ID",
      PAYPAL_CLIENT_SECRET: "LIVE-SECRET",
      PAYPAL_WEBHOOK_ID: "LIVE-WEBHOOK",
      PAYPAL_SANDBOX_CLIENT_ID: "SANDBOX-ID",
      PAYPAL_SANDBOX_CLIENT_SECRET: "SANDBOX-SECRET",
      PAYPAL_SANDBOX_WEBHOOK_ID: "SANDBOX-WEBHOOK",
    },
    () => {
      const diagnostics = paypalRuntimeDiagnostics();

      assert.equal(diagnostics.environment, "sandbox");
      assert.equal(diagnostics.usingSandboxCredentialFamily, true);
      assert.equal(diagnostics.hasClientId, true);
      assert.equal(diagnostics.hasClientSecret, true);
      assert.equal(diagnostics.hasSandboxClientId, true);
      assert.equal(diagnostics.hasSandboxSecret, true);
      assert.equal(diagnostics.hasSandboxWebhookId, true);
      assert.equal(diagnostics.hasLiveWebhookId, true);
      assert.equal(getPayPalWebhookId(), "SANDBOX-WEBHOOK");
      assert.equal(hasPayPalWebhookConfig(), true);
    },
  );
});

test("live mode uses live webhook and live credentials", async () => {
  await withPayPalEnv(
    {
      PAYPAL_ENVIRONMENT: "live",
      PAYPAL_CLIENT_ID: "LIVE-ID",
      PAYPAL_CLIENT_SECRET: "LIVE-SECRET",
      PAYPAL_WEBHOOK_ID: "LIVE-WEBHOOK",
      PAYPAL_SANDBOX_CLIENT_ID: "SANDBOX-ID",
      PAYPAL_SANDBOX_CLIENT_SECRET: "SANDBOX-SECRET",
      PAYPAL_SANDBOX_WEBHOOK_ID: "SANDBOX-WEBHOOK",
    },
    () => {
      const diagnostics = paypalRuntimeDiagnostics();

      assert.equal(diagnostics.environment, "live");
      assert.equal(diagnostics.usingSandboxCredentialFamily, false);
      assert.equal(diagnostics.hasClientId, true);
      assert.equal(diagnostics.hasClientSecret, true);
      assert.equal(diagnostics.hasSandboxWebhookId, true);
      assert.equal(diagnostics.hasLiveWebhookId, true);
      assert.equal(getPayPalWebhookId(), "LIVE-WEBHOOK");
      assert.equal(hasPayPalWebhookConfig(), true);
    },
  );
});

