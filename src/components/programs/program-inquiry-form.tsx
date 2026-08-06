"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import styles from "./programs-services-page-content.module.css";

type FormState = "idle" | "submitting" | "success" | "error";

const packageOptions = [
  {
    name: "Gold",
    description: "A focused starting point for leadership growth and wellness support.",
  },
  {
    name: "Diamond",
    description: "The most comprehensive annual support for teams ready for deeper change.",
  },
  {
    name: "Platinum",
    description: "Expanded workshops, coaching, and Beyond Yoga access for growing teams.",
  },
] as const;

const initialForm = {
  email: "",
  message: "",
  name: "",
  organization: "",
  packageName: "Gold",
  phone: "",
  teamSize: "",
  website: "",
};

export function ProgramInquiryForm() {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<FormState>("idle");
  const [status, setStatus] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setStatus("");

    try {
      const response = await fetch("/api/program-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setState("error");
        setStatus(result.message || "We could not send your inquiry just yet.");
        return;
      }

      setState("success");
      setStatus(result.message || "Thank you. Your inquiry has been sent.");
      setForm(initialForm);
    } catch {
      setState("error");
      setStatus("We could not send your inquiry just yet. Please try again.");
    }
  }

  return (
    <form id="program-inquiry" className={styles.inquiryForm} onSubmit={handleSubmit}>
      <div className={styles.inquiryIntro}>
        <p className={styles.eyebrow}>Program Inquiry</p>
        <h3 className={styles.inquiryHeading}>Select a Package</h3>
        <p>
          Choose the Integrated Leadership &amp; Corporate Wellness package that best fits
          your organization and share a few details for a tailored follow-up.
        </p>
      </div>

      <div className={styles.inquiryPackageGrid}>
        {packageOptions.map((option) => (
          <label key={option.name} className={styles.inquiryPackageOption}>
            <input
              type="radio"
              name="packageName"
              value={option.name}
              checked={form.packageName === option.name}
              onChange={(event) => updateField("packageName", event.target.value)}
            />
            <span>
              <strong>{option.name}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>

      <div className={styles.inquiryHidden} aria-hidden="true">
        <label htmlFor="program-website">Website</label>
        <input
          id="program-website"
          name="website"
          tabIndex={-1}
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>

      <div className={styles.inquiryFieldGrid}>
        <Field label="Name" htmlFor="program-name" required>
          <input
            id="program-name"
            className={styles.inquiryInput}
            name="name"
            autoComplete="name"
            required
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="program-email" required>
          <input
            id="program-email"
            className={styles.inquiryInput}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </Field>
        <Field label="Phone" htmlFor="program-phone">
          <input
            id="program-phone"
            className={styles.inquiryInput}
            name="phone"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </Field>
        <Field label="Organization" htmlFor="program-organization">
          <input
            id="program-organization"
            className={styles.inquiryInput}
            name="organization"
            autoComplete="organization"
            value={form.organization}
            onChange={(event) => updateField("organization", event.target.value)}
          />
        </Field>
        <Field label="Team Size" htmlFor="program-team-size">
          <input
            id="program-team-size"
            className={styles.inquiryInput}
            name="teamSize"
            inputMode="numeric"
            value={form.teamSize}
            onChange={(event) => updateField("teamSize", event.target.value)}
          />
        </Field>
        <Field label="Message" htmlFor="program-message" required full>
          <textarea
            id="program-message"
            className={styles.inquiryTextarea}
            name="message"
            required
            value={form.message}
            onChange={(event) => updateField("message", event.target.value)}
          />
        </Field>
      </div>

      <div className={styles.inquiryFooter}>
        <button className={styles.inquiryButton} type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Sending..." : "Send Inquiry"}
        </button>
        <p className={styles.inquiryStatus} data-state={state} aria-live="polite">
          {status}
        </p>
      </div>
      <p className={styles.privacyNotice}>
        Your information will be handled in accordance with our{" "}
        <Link href="/privacy-policy" target="_blank" rel="noreferrer">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  children,
  full,
  htmlFor,
  label,
  required,
}: {
  children: ReactNode;
  full?: boolean;
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className={`${styles.inquiryField} ${full ? styles.inquiryFieldFull : ""}`} htmlFor={htmlFor}>
      <span className={styles.inquiryLabel}>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
