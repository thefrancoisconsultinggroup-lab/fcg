import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { footerNavigation } from "@/data/navigation";

type SocialIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61581803936722#",
    icon: FacebookIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@francoisconsultinggroup",
    icon: YoutubeIcon,
  },
  {
    label: "Instagram",
    href: "https://francoisconsultinggroup.com/about-us/#",
    icon: InstagramIcon,
  },
] satisfies { label: string; href: string; icon: SocialIcon }[];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer relative z-10 overflow-hidden bg-[linear-gradient(180deg,rgba(7,25,43,0)_0%,rgba(4,18,31,0.42)_36%,rgba(4,18,31,0.74)_100%)] text-white">
      <Container className="pb-10 pt-24 sm:pb-12 sm:pt-28 lg:pt-32">
        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.8fr_0.95fr] lg:gap-12">
          <div>
            <Link
              href="/"
              className="group site-footer__brand-lockup inline-flex items-center gap-4 focus-visible:outline-accent-yellow"
            >
              <Image
                src="/assets/migrated/shared/brand-cropped-francois-logo.png"
                alt=""
                width={220}
                height={103}
                className="site-footer__brand-mark object-contain"
              />
              <span className="site-footer__brand font-display text-white transition-colors group-hover:text-accent-yellow">
                <span>Francois</span>
                <span>Consulting</span>
                <span>Group</span>
              </span>
            </Link>
            <p className="site-footer__lede mt-7 max-w-sm text-base leading-7 text-[#dcefff]">
              Leadership development, corporate wellness and purpose-driven transformation.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <p className="site-footer__eyebrow mb-6 text-xs font-semibold uppercase tracking-[0.24em] text-accent-cyan">
              Explore
            </p>
            <div className="flex flex-col items-start gap-1">
              {footerNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="site-footer__link inline-flex min-h-11 items-center py-2 text-sm font-medium text-white transition-colors hover:text-accent-yellow focus-visible:outline-accent-yellow"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <p className="site-footer__eyebrow text-xs font-semibold uppercase tracking-[0.3em] text-accent-cyan">
              Start a Conversation
            </p>
            <h2 className="site-footer__title font-display mt-4 max-w-sm text-[clamp(2.35rem,4.2vw,4.25rem)] font-normal leading-[0.98] tracking-[-0.03em] text-balance text-white">
              Let&apos;s connect.
            </h2>
            <p className="site-footer__copy mt-6 max-w-sm text-base leading-7 text-muted-light">
              Share your ideas, questions, or the kind of transformation you want to create.
            </p>
            <Link href="/contact" className="connect-button mt-7">
              Contact Francois Consulting Group{" "}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <div className="mt-8 flex items-center gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="site-footer__social inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 text-white transition-colors hover:border-accent-yellow hover:text-accent-yellow focus-visible:outline-accent-yellow"
                >
                  <item.icon aria-hidden="true" className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="site-footer__meta mt-20 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs leading-6 text-[#dcefff] sm:mt-24 sm:flex-row sm:items-end sm:justify-between">
          <p>&copy; {year} Francois Consulting Group.</p>
          <p className="text-right">
            Developed by{" "}
            <a
              href="https://twixalot.com/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent-yellow"
            >
              Twixalot Software Solutions
            </a>{" "}
            | Thrive Weekly Blog Maintained by{" "}
            <a
              href="https://myvirtualofficett.com/"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent-yellow"
            >
              My Virtual Office
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-8.2h2.8l.42-3.2h-3.22V7.56c0-.93.26-1.56 1.59-1.56h1.7V3.14c-.3-.04-1.3-.14-2.48-.14-2.45 0-4.12 1.5-4.12 4.25v2.37H7.5v3.2h2.67V21h3.33Z" />
    </svg>
  );
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.58 7.19a2.97 2.97 0 0 0-2.09-2.1C17.64 4.6 12 4.6 12 4.6s-5.64 0-7.49.49a2.97 2.97 0 0 0-2.09 2.1C2 9.05 2 12 2 12s0 2.95.42 4.81a2.97 2.97 0 0 0 2.09 2.1c1.85.49 7.49.49 7.49.49s5.64 0 7.49-.49a2.97 2.97 0 0 0 2.09-2.1C22 14.95 22 12 22 12s0-2.95-.42-4.81ZM10.2 14.99V9.01L15.4 12l-5.2 2.99Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.25" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
