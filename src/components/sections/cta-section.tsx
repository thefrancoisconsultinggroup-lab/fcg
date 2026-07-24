import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";

type CtaSectionProps = {
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function CtaSection({
  eyebrow = "Start a Conversation",
  heading = "Let's connect.",
  body = "Reach out with your ideas, feedback, or inquiries.",
  ctaLabel = "Contact Francois Consulting Group",
  ctaHref = "/contact",
}: CtaSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 text-foreground sm:py-28">
      <div className="ocean-beam absolute inset-x-0 top-0 h-1/2" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(7,25,43,0.72)_0%,rgba(7,25,43,0.2)_52%,transparent_100%)]"
        aria-hidden="true"
      />
      <Container>
        <ScrollReveal className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-cyan">
              {eyebrow}
            </p>
            <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.35rem,4.2vw,4.25rem)] font-normal leading-[0.98] tracking-[-0.03em] text-balance">
              {heading}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-lg leading-8 text-muted-light">{body}</p>
            <Link
              href={ctaHref}
              className="connect-button mt-7"
            >
              {ctaLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
