"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import {
  consultationPackages,
  consultationPackagesIntro,
  programsServicesCtas,
  programsServicesIntro,
  programsServicesOfferings,
} from "@/data/pages/programs-services";
import { ProgramInquiryForm } from "./program-inquiry-form";
import styles from "./programs-services-page-content.module.css";

export function ProgramsServicesPageContent() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionGlow} aria-hidden="true" />
        <Container>
          <ScrollReveal className={styles.editorialIntro}>
            <div className={styles.introText}>
              <p className={styles.eyebrow}>{programsServicesIntro.eyebrow}</p>
              <h2 className={styles.heading}>{programsServicesIntro.heading}</h2>
              <p className={styles.description}>{programsServicesIntro.description}</p>
              <div className={styles.copy}>
                {programsServicesIntro.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className={styles.introActions}>
                <Link
                  href={programsServicesIntro.teamLink.href}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
                >
                  {programsServicesIntro.teamLink.label}
                </Link>
                <Link
                  href={programsServicesCtas.customQuote.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-accent-yellow"
                >
                  {programsServicesCtas.customQuote.label}
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <div className={styles.servicesGrid}>
            {programsServicesOfferings.map((offering, index) => (
              <ScrollReveal
                key={offering.title}
                className={styles.service}
              >
                <p className={styles.serviceNumber}>{offering.number}</p>
                <div className={`media-frame ${styles.serviceImage}`}>
                  <Image
                    src={offering.image.src}
                    alt={offering.image.alt}
                    fill
                    sizes="(min-width: 1200px) 28vw, (min-width: 768px) 30vw, 92vw"
                    priority={index === 0}
                  />
                </div>
                <h3 className={styles.serviceTitle}>{offering.title}</h3>
                <p className={styles.serviceBody}>{offering.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionGlow} aria-hidden="true" />
        <Container>
          <ScrollReveal>
            <p className={styles.eyebrow}>{consultationPackagesIntro.eyebrow}</p>
            <h2 className={styles.heading}>{consultationPackagesIntro.heading}</h2>
            <p className={styles.packagesLead}>{consultationPackagesIntro.description}</p>
          </ScrollReveal>

          <div className={styles.packagesGrid}>
            {consultationPackages.map((pkg) => (
              <ScrollReveal key={pkg.name} className={styles.packageCard}>
                <div
                  className={
                    pkg.accent === "gold"
                      ? styles.packageAccentGold
                      : pkg.accent === "platinum"
                        ? styles.packageAccentPlatinum
                        : styles.packageAccentDiamond
                  }
                  aria-hidden="true"
                />
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packageDescription}>{pkg.description}</p>
                <ul className={styles.packageList}>
                  {pkg.features.map((feature) => (
                    <li key={feature} className={styles.packageItem}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className={styles.packageFooter}>
                  <a
                    href="#program-inquiry"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
                  >
                    {programsServicesCtas.customQuote.label}
                  </a>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className={styles.inquiryShell}>
            <ProgramInquiryForm />
          </ScrollReveal>
        </Container>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionGlow} aria-hidden="true" />
        <Container>
          <ScrollReveal>
            <div className={styles.closingRow}>
              <div className={styles.closingCopy}>
                Continue the conversation with a tailored consultation built around your team’s goals, leadership priorities, and wellness focus.
              </div>
              <Link
                href={programsServicesCtas.customQuote.href}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
              >
                {programsServicesCtas.customQuote.label}
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
