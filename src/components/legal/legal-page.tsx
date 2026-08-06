import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import styles from "./legal-page.module.css";

export function LegalPage({
  children,
  effectiveDate,
  eyebrow = "Legal",
  lastUpdated,
  title,
}: {
  children: ReactNode;
  effectiveDate: string;
  eyebrow?: string;
  lastUpdated: string;
  title: string;
}) {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.shell}>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.meta}>
            <span>
              <strong>Effective date:</strong> {effectiveDate}
            </span>
            <span>
              <strong>Last updated:</strong> {lastUpdated}
            </span>
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </Container>
    </section>
  );
}
