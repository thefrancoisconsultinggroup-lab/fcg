"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import { sitePages } from "@/data/pages";
import { teamPageContent } from "@/data/pages/team";
import styles from "./team-page-content.module.css";

const introSection = teamPageContent.sections[0];
const members = introSection.cards ?? [];
const memberImageSizes: Record<string, { width: number; height: number }> = {
  "Christine D. FranÃ§ois": { width: 722, height: 1200 },
  "Judy Oxley Fullerton": { width: 762, height: 912 },
  "Captain Wendy Yawching": { width: 2003, height: 1569 },
  "Karl Thompson": { width: 722, height: 1000 },
  "Troy Hadeed": { width: 900, height: 900 },
  "Lisa Feveck": { width: 500, height: 500 },
  "Derval Barzey": { width: 1100, height: 1455 },
};

export function TeamPageContent() {
  return (
    <main className={styles.page}>
      <section className={styles.section}>
        <div className={styles.sectionGlow} aria-hidden="true" />
        <Container>
          <ScrollReveal>
            <p className={styles.eyebrow}>{sitePages.team.eyebrow}</p>
            <h2 className={`${styles.heading} ${styles.introHeading}`}>{introSection.heading}</h2>
            <p className={styles.description}>{sitePages.team.heroDescription}</p>
            <div className={styles.introCopy}>
              <p>
                The people connected to the Integrated Leadership &amp; Corporate Wellness programme bring together leadership, coaching, wellness, and cross-sector experience in service of transformational growth.
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.memberRows}>
            {members.map((member, index) => {
              const firstBody = member.body?.[0];
              const remainingBody = member.body?.slice(1) ?? [];
              const roleLikeFirstLine =
                firstBody &&
                (firstBody.includes("Trainer") ||
                  firstBody.includes("Advisor") ||
                  firstBody.includes("Partner") ||
                  firstBody.includes("Founder") ||
                  firstBody.includes("Specialist"));

              return (
                <ScrollReveal
                  key={member.title}
                  className={`${styles.memberRow} ${index % 2 === 1 ? styles.memberRowReverse : ""}`}
                >
                  {member.image ? (
                    <div className={`media-frame ${styles.memberMedia}`}>
                      <Image
                        src={member.image.src}
                        alt={member.image.alt}
                        width={memberImageSizes[member.title]?.width ?? 800}
                        height={memberImageSizes[member.title]?.height ?? 1000}
                        sizes="(min-width: 1200px) 26rem, (min-width: 768px) 34vw, 92vw"
                        className={styles.memberImage}
                      />
                    </div>
                  ) : null}

                  <div className={styles.memberText}>
                    <h3 className={styles.memberName}>{member.title}</h3>
                    {roleLikeFirstLine ? <p className={styles.memberRole}>{firstBody}</p> : null}
                    <div className={styles.memberCopy}>
                      {(roleLikeFirstLine ? remainingBody : member.body ?? []).map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionGlow} aria-hidden="true" />
        <Container>
          <ScrollReveal>
            <div className={styles.closingRow}>
              <div className={styles.closingCopy}>
                Explore the programmes and services this team helps deliver across leadership, wellness, and organizational transformation.
              </div>
              <Link
                href="/programs-services"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent-yellow px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:bg-[#ffe080] focus-visible:outline-accent-yellow"
              >
                Explore Programmes
              </Link>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
