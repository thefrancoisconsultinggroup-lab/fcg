import Image from "next/image";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import {
  summitCapacities,
  summitSpeakerSections,
  summitSpeakers,
  summitUnderstanding,
  summitVoicesIntro,
} from "@/data/human-capacity-summit";
import { SummitOpeningTransition } from "./summit-opening-transition";
import { SummitRegistrationForm } from "./summit-registration-form";
import styles from "./human-capacity-summit.module.css";

const speakerImageVersion = "20260724";

export function HumanCapacitySummitPage({
  paypalClientId,
  paypalEnvironment,
}: {
  paypalClientId: string;
  paypalEnvironment: "production" | "sandbox";
}) {
  return (
    <div className={styles.page}>
      <SummitOpeningTransition />

      <main className={styles.body}>
        <section className={styles.section} aria-labelledby="summit-capacity-title">
          <Container>
            <ScrollReveal className={styles.sectionIntro}>
              <h2 id="summit-capacity-title">
                Understanding <span className={styles.capacityHeadingAccent}>Human Capacity</span>
              </h2>
              <p>{summitUnderstanding.body}</p>
            </ScrollReveal>
            <div className={styles.capacityGrid}>
              {summitCapacities.map((capacity, index) => (
                <ScrollReveal
                  key={capacity.title}
                  className={`${styles.capacityCard} ${
                    capacity.title === "Human Capacity" ? styles.capacityCardHuman : ""
                  }`}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{capacity.title}</h3>
                  <p>{capacity.body}</p>
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </section>

        <section className={styles.section} aria-labelledby="summit-voices-title">
          <Container>
            <ScrollReveal className={styles.sectionIntro}>
              <h2 id="summit-voices-title">{summitVoicesIntro.heading}</h2>
              <p>{summitVoicesIntro.body}</p>
            </ScrollReveal>
            <div className={styles.speakerSections}>
              {summitSpeakerSections.map((section) => {
                const sectionSpeakers = summitSpeakers.filter(
                  (speaker) => speaker.group === section.group,
                );

                if (!sectionSpeakers.length) {
                  return null;
                }

                return (
                  <div key={section.group} className={styles.speakerSectionGroup}>
                    <ScrollReveal>
                      <h3 className={styles.speakerSectionTitle}>{section.title}</h3>
                    </ScrollReveal>
                    <div className={styles.speakerGrid}>
                      {sectionSpeakers.map((speaker, index) => (
                        <ScrollReveal
                          key={`${section.group}-${speaker.name}-${index}`}
                          className={`${styles.speakerCard} ${
                            speaker.name === "Christine D. Francois"
                              ? styles.speakerCardChristine
                              : ""
                          }`}
                        >
                          <div className={styles.speakerPortrait}>
                            <Image
                              src={`${speaker.image}?v=${speakerImageVersion}`}
                              alt={speaker.name}
                              width={430}
                              height={430}
                              sizes="(min-width: 1024px) 16rem, (min-width: 640px) 32vw, 66vw"
                            />
                          </div>
                          <div>
                            <p className={styles.speakerCapacity}>{speaker.capacity}</p>
                            <h3>{speaker.name}</h3>
                            <p className={styles.speakerRole}>{speaker.role}</p>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        <section
          id="summit-registration"
          className={`${styles.section} ${styles.registrationSection}`}
          aria-labelledby="summit-registration-title"
        >
          <Container>
            <div className={styles.registrationLayout}>
              <ScrollReveal className={styles.registrationIntro}>
                <p className={styles.kicker}>Join the Conversation</p>
                <h2 id="summit-registration-title">Register Today</h2>
                <p>
                  Thank you for your interest in The Human Capacity Summit. Please complete
                  the form below to reserve your place in this important conversation.
                </p>
              </ScrollReveal>
              <ScrollReveal className={styles.formShell}>
                <SummitRegistrationForm
                  paypalClientId={paypalClientId}
                  paypalEnvironment={paypalEnvironment}
                />
              </ScrollReveal>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
