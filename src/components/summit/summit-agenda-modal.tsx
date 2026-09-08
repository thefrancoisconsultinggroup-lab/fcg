"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowRight, CalendarDays, Clock3, Video, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { summitAgenda, summitSpeakers } from "@/data/human-capacity-summit";
import styles from "./human-capacity-summit.module.css";

export function SummitAgendaModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" className={styles.agendaTrigger} onClick={() => setIsOpen(true)}>
        View the Agenda
        <ArrowRight aria-hidden="true" />
      </button>

      <Dialog open={isOpen} onClose={setIsOpen} className={styles.agendaDialog}>
        <DialogBackdrop className={styles.agendaBackdrop} />
        <div className={styles.agendaViewport}>
          <DialogPanel className={styles.agendaPanel}>
            <button
              type="button"
              className={styles.agendaClose}
              onClick={() => setIsOpen(false)}
              aria-label="Close Summit agenda"
            >
              <X aria-hidden="true" />
            </button>

            <header className={styles.agendaHeader}>
              <p>Official Agenda</p>
              <DialogTitle>The Human Capacity Summit</DialogTitle>
              <div className={styles.agendaEventDetails}>
                <span><CalendarDays aria-hidden="true" />{summitAgenda.date}</span>
                <span><Clock3 aria-hidden="true" />{summitAgenda.time}</span>
                <span><Video aria-hidden="true" />{summitAgenda.format}</span>
              </div>
              <div className={styles.agendaHosts}>
                <AgendaHost label="Founder & Convenor" name={summitAgenda.founder} speakerId="christine" />
                <AgendaHost label="Moderator & Co-host" name={summitAgenda.moderator} speakerId="wendy" />
              </div>
            </header>

            <ol className={styles.agendaTimeline}>
              {summitAgenda.sessions.map((session, index) => (
                <li key={`${session.time}-${session.title}`} data-kind={"kind" in session ? session.kind : "session"}>
                  <div className={styles.agendaTime}>{session.time}</div>
                  <div className={styles.agendaMarker} aria-hidden="true">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className={styles.agendaSession}>
                    {"speakerIds" in session ? (
                      <div className={styles.agendaPortraits} aria-hidden="true">
                        {session.speakerIds.map((speakerId) => {
                          const speaker = summitSpeakers.find((item) => item.id === speakerId);
                          return speaker ? (
                            <span key={speaker.id}>
                              <Image
                                src={speaker.image}
                                alt=""
                                fill
                                sizes="3.5rem"
                                style={{
                                  objectFit: "cover",
                                  objectPosition: speaker.imagePosition ?? "50% 50%",
                                  transform: speaker.imageScale
                                    ? `scale(${speaker.imageScale})`
                                    : undefined,
                                }}
                              />
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : null}
                    <div className={styles.agendaSessionCopy}>
                      <h3>{session.title}</h3>
                      {"speaker" in session ? <p>{session.speaker}</p> : null}
                      {"detail" in session ? <em>{session.detail}</em> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

function AgendaHost({ label, name, speakerId }: { label: string; name: string; speakerId: string }) {
  const speaker = summitSpeakers.find((item) => item.id === speakerId);

  return (
    <div className={styles.agendaHost}>
      {speaker ? (
        <span className={styles.agendaHostPortrait} aria-hidden="true">
          <Image
            src={speaker.image}
            alt=""
            fill
            sizes="4.5rem"
            style={{
              objectFit: "cover",
              objectPosition: speaker.imagePosition ?? "50% 50%",
              transform: speaker.imageScale ? `scale(${speaker.imageScale})` : undefined,
            }}
          />
        </span>
      ) : null}
      <p><span>{label}</span>{name}</p>
    </div>
  );
}
