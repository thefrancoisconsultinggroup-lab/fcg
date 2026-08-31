"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { summitSpeakerSections, summitSpeakers } from "@/data/human-capacity-summit";
import styles from "./human-capacity-summit.module.css";

type Speaker = (typeof summitSpeakers)[number];
type SpeakerWithBio = Speaker & { bio: readonly string[] };

function hasBio(speaker: Speaker): speaker is SpeakerWithBio {
  return "bio" in speaker && Array.isArray(speaker.bio) && speaker.bio.length > 0;
}

function SpeakerDetails({ speaker }: { speaker: Speaker }) {
  return (
    <>
      <div className={styles.speakerPortrait}>
        <Image
          src={speaker.image}
          alt={speaker.name}
          width={430}
          height={430}
          sizes="(min-width: 1024px) 16rem, (min-width: 640px) 32vw, 66vw"
          style={{
            objectFit: "cover",
            objectPosition: speaker.imagePosition ?? "50% 50%",
            transform: speaker.imageScale ? `scale(${speaker.imageScale})` : undefined,
          }}
        />
      </div>
      <div>
        {speaker.capacity ? <p className={styles.speakerCapacity}>{speaker.capacity}</p> : null}
        <h3>{speaker.name}</h3>
        {speaker.role ? <p className={styles.speakerRole}>{speaker.role}</p> : null}
        {speaker.country ? <p className={styles.speakerCountry}>{speaker.country}</p> : null}
      </div>
    </>
  );
}

export function SummitSpeakerShowcase() {
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerWithBio | null>(null);

  return (
    <>
      <div className={styles.speakerSections}>
        {summitSpeakerSections.map((section) => {
          const speakers = summitSpeakers.filter((speaker) => speaker.group === section.group);

          if (!speakers.length) return null;

          return (
            <div key={section.group} className={styles.speakerSectionGroup}>
              <ScrollReveal>
                <h3 className={styles.speakerSectionTitle}>{section.title}</h3>
              </ScrollReveal>
              <div className={styles.speakerGrid}>
                {speakers.map((speaker, index) => {
                  const cardClassName = `${styles.speakerCard} ${
                    speaker.name === "Christine D. Francois" ? styles.speakerCardChristine : ""
                  }`;

                  return (
                    <ScrollReveal key={`${section.group}-${speaker.name}-${index}`}>
                      {hasBio(speaker) ? (
                        <button
                          type="button"
                          className={`${cardClassName} ${styles.speakerCardInteractive}`}
                          onClick={() => setSelectedSpeaker(speaker)}
                          aria-label={`View full biography for ${speaker.name}`}
                        >
                          <SpeakerDetails speaker={speaker} />
                          <span className={styles.speakerCardPrompt} aria-hidden="true">
                            View biography <span>↗</span>
                          </span>
                        </button>
                      ) : (
                        <article className={cardClassName}>
                          <SpeakerDetails speaker={speaker} />
                        </article>
                      )}
                    </ScrollReveal>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={selectedSpeaker !== null}
        onClose={() => setSelectedSpeaker(null)}
        className={styles.speakerDialog}
      >
        <DialogBackdrop className={styles.speakerDialogBackdrop} />
        <div className={styles.speakerDialogViewport}>
          <DialogPanel className={styles.speakerDialogPanel}>
            {selectedSpeaker ? (
              <>
                <button
                  type="button"
                  className={styles.speakerDialogClose}
                  onClick={() => setSelectedSpeaker(null)}
                  aria-label="Close biography"
                >
                  <X aria-hidden="true" />
                </button>
                <div className={styles.speakerDialogPortrait}>
                  <Image
                    src={selectedSpeaker.image}
                    alt=""
                    fill
                    sizes="(max-width: 700px) 100vw, 24rem"
                    style={{
                      objectFit: "cover",
                      objectPosition: selectedSpeaker.imagePosition ?? "50% 50%",
                    }}
                  />
                </div>
                <div className={styles.speakerDialogContent}>
                  {selectedSpeaker.capacity ? (
                    <p className={styles.speakerCapacity}>{selectedSpeaker.capacity}</p>
                  ) : null}
                  <DialogTitle as="h2">{selectedSpeaker.name}</DialogTitle>
                  <p className={styles.speakerDialogMeta}>
                    {[selectedSpeaker.role, selectedSpeaker.country].filter(Boolean).join(" · ")}
                  </p>
                  <div className={styles.speakerBio}>
                    {selectedSpeaker.bio.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
