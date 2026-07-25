"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import styles from "./contact-form-section.module.css";

type FormState = "idle" | "submitting" | "success" | "error";

const initialForm = {
  email: "",
  message: "",
  name: "",
  organization: "",
  phone: "",
  website: "",
};

export function ContactFormSection() {
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setState("error");
        setStatus(result.message || "We could not send your message just yet.");
        return;
      }

      setState("success");
      setStatus(result.message || "Thank you. Your message has been sent.");
      setForm(initialForm);
    } catch {
      setState("error");
      setStatus("We could not send your message just yet. Please try again.");
    }
  }

  return (
    <section className={styles.section} aria-labelledby="contact-form-title">
      <Container>
        <div className={styles.layout}>
          <ScrollReveal className={styles.intro}>
            <p className={styles.eyebrow}>Contact</p>
            <h2 id="contact-form-title" className={styles.heading}>
              Send a Message
            </h2>
            <p className={styles.body}>
              Share a question, partnership idea, speaking request, or consulting inquiry
              and the Francois Consulting Group team will follow up.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.hidden} aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                />
              </div>

              <div className={styles.grid}>
                <Field label="Name" htmlFor="contact-name" required>
                  <input
                    id="contact-name"
                    className={styles.input}
                    name="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                </Field>
                <Field label="Email" htmlFor="contact-email" required>
                  <input
                    id="contact-email"
                    className={styles.input}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </Field>
                <Field label="Phone" htmlFor="contact-phone">
                  <input
                    id="contact-phone"
                    className={styles.input}
                    name="phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                  />
                </Field>
                <Field label="Organization" htmlFor="contact-organization">
                  <input
                    id="contact-organization"
                    className={styles.input}
                    name="organization"
                    autoComplete="organization"
                    value={form.organization}
                    onChange={(event) => updateField("organization", event.target.value)}
                  />
                </Field>
                <Field label="Message" htmlFor="contact-message" required full>
                  <textarea
                    id="contact-message"
                    className={styles.textarea}
                    name="message"
                    required
                    value={form.message}
                    onChange={(event) => updateField("message", event.target.value)}
                  />
                </Field>
              </div>

              <div className={styles.footer}>
                <button className={styles.button} type="submit" disabled={state === "submitting"}>
                  {state === "submitting" ? "Sending..." : "Send Message"}
                </button>
                <p className={styles.status} data-state={state} aria-live="polite">
                  {status}
                </p>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </Container>
    </section>
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
    <label className={`${styles.field} ${full ? styles.fieldFull : ""}`} htmlFor={htmlFor}>
      <span className={styles.label}>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
