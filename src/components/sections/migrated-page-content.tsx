import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import type { ContentCard, ContentSection } from "@/data/pages/types";

type MigratedPageContentProps = {
  sections: ContentSection[];
};

export function MigratedPageContent({ sections }: MigratedPageContentProps) {
  return (
    <div className="text-foreground">
      {sections.map((section, index) => {
        const tone = index % 2 === 0 ? "light" : "dark";

        return (
          <ContentSectionView
            key={`${section.heading}-${index}`}
            section={section}
            tone={tone}
          />
        );
      })}
    </div>
  );
}

function ContentSectionView({
  section,
  tone,
}: {
  section: ContentSection;
  tone: "light" | "dark";
}) {
  const hasCards = Boolean(section.cards?.length);
  const isDark = tone === "dark";
  const glowClass = isDark
    ? "section-glow section-glow--dark"
    : "section-glow section-glow--light";

  return (
    <section
      className={[
        "relative overflow-hidden py-28 text-foreground sm:py-36",
      ].join(" ")}
    >
      <div className={glowClass} aria-hidden="true" />
      <Container>
        <ScrollReveal className="relative grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            {section.eyebrow ? (
              <p
                className={[
                  "mb-4 text-xs font-semibold uppercase tracking-[0.3em]",
                  isDark ? "text-accent-yellow" : "text-accent-cyan",
                ].join(" ")}
              >
                {section.eyebrow}
              </p>
            ) : null}
            <h2 className="ocean-readable font-display max-w-3xl text-3xl font-normal leading-tight text-balance sm:text-4xl lg:text-[3.25rem]">
              {section.heading}
            </h2>
            {section.image ? (
              <ContentImageView image={section.image} className="mt-8" tone={tone} />
            ) : null}
          </div>

          <div>
            {section.body?.length ? (
              <div
                className={[
                  "ocean-readable space-y-5 text-base font-medium leading-8 sm:text-lg",
                  "text-muted-light",
                ].join(" ")}
              >
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {section.links?.length ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {section.links.map((link) => (
                  <ContentLinkView key={`${link.href}-${link.label}`} link={link} />
                ))}
              </div>
            ) : null}

            {hasCards ? (
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                {section.cards?.map((card) => (
                  <ContentCardView key={card.title} card={card} tone={tone} />
                ))}
              </div>
            ) : null}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function ContentCardView({
  card,
  tone,
}: {
  card: ContentCard;
  tone: "light" | "dark";
}) {
  return (
    <article
      className={[
        "overflow-hidden border-t border-white/20 bg-transparent",
      ].join(" ")}
    >
      {card.image ? <ContentImageView image={card.image} tone={tone} /> : null}
      <div className="px-0 py-6">
        <h3 className="font-display text-2xl font-normal leading-tight">
          {card.title}
        </h3>
        {card.body?.length ? (
          <div
            className={[
              "mt-4 space-y-3 text-sm leading-7",
              "text-muted-light",
            ].join(" ")}
          >
            {card.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : null}
        {card.links?.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {card.links.map((link) => (
              <ContentLinkView key={`${link.href}-${link.label}`} link={link} />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ContentImageView({
  image,
  className,
  tone,
}: {
  image: NonNullable<ContentSection["image"]>;
  className?: string;
  tone: "light" | "dark";
}) {
  const isDark = tone === "dark";

  return (
    <figure className={className}>
      <div
        className={[
          "media-frame relative aspect-[4/3]",
          isDark
            ? "bg-surface-ocean/30"
            : "bg-white/[0.07]",
        ].join(" ")}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
      </div>
      {image.caption ? (
        <figcaption
          className={[
            "mt-3 text-sm leading-6",
            "text-muted-light",
          ].join(" ")}
        >
          {image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ContentLinkView({
  link,
}: {
  link: { label: string; href: string };
}) {
  const isExternal = /^https?:\/\//.test(link.href);
  const className =
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-current/24 px-5 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-accent-yellow";

  if (isExternal) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noreferrer">
        {link.label}
        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}
