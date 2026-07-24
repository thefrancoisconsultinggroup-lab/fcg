import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CoreValuesAccordion } from "@/components/about/core-values-accordion";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import styles from "./about-page.module.css";

const pressures = [
  "Climate change.",
  "Extreme weather.",
  "Economic volatility.",
  "Food insecurity.",
  "Technological disruption.",
  "Burnout.",
  "Mental health challenges.",
  "Loneliness.",
  "Demographic change.",
  "Declining public trust.",
];

const capacityExpressions = [
  "Think clearly",
  "Adapt to change",
  "Make sound decisions",
  "Build meaningful relationships",
  "Contribute positively",
];

const impactAreas = ["Families", "Workplaces", "Communities", "Society"];

const pathways = [
  {
    label: "01",
    title: "Executive advisory",
    body: "Strategic advisory services that help organizations strengthen leadership and improve organizational performance.",
    href: "/programs-services",
    cta: "Explore services",
  },
  {
    label: "02",
    title: "Corporate wellness initiatives",
    body: "Integrated leadership development and corporate wellness designed to enhance employee wellbeing.",
    href: "/programs-services",
    cta: "View programs",
  },
  {
    label: "03",
    title: "Evidence-informed wellness solutions",
    body: "Supporting wellness solutions connected to everyday vitality and whole-person restoration.",
    href: "/neumi-wellness",
    cta: "Visit Neumi Wellness",
  },
  {
    label: "04",
    title: "The Human Capacity Summit",
    body: "A dedicated summit experience focused on strengthening human capacity in a changing world.",
    href: "/human-capacity-summit",
    cta: "Discover the summit",
    featured: true,
  },
  {
    label: "05",
    title: "Thought leadership",
    body: "Thrive Weekly brings together editorial perspectives on leadership, lifestyle and wellness at work.",
    href: "/thrive-weekly",
    cta: "Read Thrive Weekly",
  },
];

const nicoleParagraphs = [
  "Nicole Quan Kep is the founder of Power10HK and KEP-STAR, two Hong Kong-based enterprises that reflect her passion for connecting people, performance, and purpose across borders.",
  "With over 25 years of international corporate experience and 15 years in athletic coaching and team management, Nicole has developed and advanced a distinctive approach to leadership and organizational wellness. At FDM Group—an award-winning global business and technology consultancy powering the people behind tech and innovation—she developed and advanced programs that enhance employee performance and growth, grounded in her coaching expertise and deep understanding of Customer Relationship Management (CRM). Her work helped elevate cultures of excellence, career progression, and employee well-being within the IT and Financial Services sectors.",
  "Through Power10HK, Nicole integrates athletic training principles into corporate development strategies, creating transformative team-building experiences that drive connection, resilience, and measurable results.",
  "As founder of KEP-STAR, she brings a Master’s Degree in Economics and Trade from Chongqing University and extensive experience in China sourcing and event management, enabling clients to access unparalleled networks and opportunities throughout Asia.",
  "Nicole’s dual enterprises complement François Consulting Group’s Integrated Leadership & Corporate Wellness programs, amplifying their shared mission to foster high-performing, values-aligned teams and sustainable international growth.",
];

const coreValues = [
  {
    title: "Collaboration Over Competition",
    body: "We believe in building bridges, not silos. Every partner, provider, and client contributes to a dynamic ecosystem of mutual benefit and collective success.",
  },
  {
    title: "Whole-Person Empowerment",
    body: "We see individuals as more than job titles. We design experiences that nurture the mind, body, spirit, and professional self.",
  },
  {
    title: "Integrity in Action",
    body: "We walk our talk, leading by example, making decisions aligned with our values, and holding space for honest conversations and accountable results.",
  },
  {
    title: "Inclusion and Cultural Intelligence",
    body: "We respect the diversity of the Caribbean and broader Pan-American landscape, and we aim to serve with empathy, equity, and cultural fluency.",
  },
  {
    title: "Visionary Growth",
    body: "We anticipate needs before they arise. By listening deeply and iterating boldly, we build programs and partnerships that evolve and endure.",
  },
];

type AboutPageContentProps = {
  id?: string;
};

export function AboutPageContent({ id }: AboutPageContentProps) {
  return (
    <main id={id} className={styles.page}>
      <BeginningSection />
      <PatternSection />
      <CommonThreadSection />
      <TransformationSection />
      <IdentitySection />
      <PathwaysSection />
      <StrategicPartnersSection />
      <CoreValuesSection />
      <FlourishSection />
    </main>
  );
}

function BeginningSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Where our work began</p>
          <h2 className={styles.heading}>A foundation in people, leadership and wellbeing.</h2>
        </ScrollReveal>
        <ScrollReveal className={`${styles.editorialCopy} ${styles.narrativeBlock}`}>
          <p>
            François Consulting Group has always sought to partner with professionals and
            organizations to strengthen leadership, enhance employee wellbeing and improve
            organizational performance through integrated leadership development, corporate wellness
            and strategic advisory services.
          </p>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function PatternSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>A deeper pattern began to emerge</p>
          <h2 className={styles.heading}>Over time, however, a deeper pattern began to emerge.</h2>
        </ScrollReveal>

        <div className={styles.pressureField} aria-label="Global pressures">
          {pressures.map((pressure, index) => (
            <ScrollReveal key={pressure} className={styles.pressureItem}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{pressure}</p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className={styles.threadBridge}>
          <p>At first glance, these appeared to be separate global issues requiring separate solutions.</p>
          <p>
            Yet, viewed together, they revealed <strong>a common thread.</strong>
          </p>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function CommonThreadSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>The common thread</p>
          <h2 className={styles.heading}>Human Capacity begins within people and moves outward.</h2>
        </ScrollReveal>

        <div className={styles.rippleGrid}>
          <ScrollReveal className={styles.commonCopy}>
            <p>
              Every one of these challenges ultimately affects <strong>human capacity</strong>—our
              ability to think clearly, adapt to change, make sound decisions, build meaningful
              relationships and contribute positively to our families, workplaces, communities and
              society.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <HumanCapacityRipple />
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function HumanCapacityRipple() {
  return (
    <figure className={styles.rippleModel} aria-labelledby="human-capacity-model-title">
      <figcaption id="human-capacity-model-title" className={styles.srOnly}>
        Human Capacity shapes how people think, adapt, decide, connect and contribute, influencing
        families, workplaces, communities and society.
      </figcaption>
      <div className={styles.rippleCanvas}>
        <span className={`${styles.ring} ${styles.ringOuter}`} aria-hidden="true" />
        <span className={`${styles.ring} ${styles.ringMiddle}`} aria-hidden="true" />
        <span className={`${styles.ring} ${styles.ringInner}`} aria-hidden="true" />
        <div className={styles.rippleCenter}>
          <span>Human</span>
          <span>Capacity</span>
        </div>
        {capacityExpressions.map((label, index) => (
          <span key={label} className={`${styles.rippleLabel} ${styles[`capacity${index + 1}`]}`}>
            <i />
            {label}
          </span>
        ))}
        {impactAreas.map((label, index) => (
          <span key={label} className={`${styles.impactLabel} ${styles[`impact${index + 1}`]}`}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.rippleMobileList}>
        <div>
          <p>Inner capacity</p>
          <ul>
            {capacityExpressions.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
        <div>
          <p>Outward impact</p>
          <ul>
            {impactAreas.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}

function TransformationSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>The transformation</p>
          <h2 className={styles.heading}>This realization transformed the way we viewed our work.</h2>
        </ScrollReveal>
        <ScrollReveal className={`${styles.transformationCopy} ${styles.narrativeBlock}`}>
          <p>
            We came to understand that strengthening organizations begins by strengthening the people
            within them. That sustainable leadership, resilient communities and thriving economies
            all depend upon one essential resource:
          </p>
          <div className={styles.capacityFrame}>
            <p className={styles.humanCapacityEmphasis}>Human Capacity.</p>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function IdentitySection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.identityStatement}>
          <p className={styles.eyebrow}>The Human Capacity Company</p>
          <h2>Today, François Consulting Group proudly identifies itself as The Human Capacity Company.</h2>
        </ScrollReveal>

        <div className={styles.identityPurpose}>
          <ScrollReveal className={styles.editorialCopy}>
            <p>
              Whether through executive advisory, corporate wellness initiatives, supporting
              evidence-informed wellness solutions, The Human Capacity Summit or our growing body of
              thought leadership, we remain committed to one purpose:
            </p>
          </ScrollReveal>
          <ScrollReveal className={styles.purposeStatement}>
            <p>
              Helping individuals, organizations and communities strengthen Human Capacity—so they
              can thrive today while building a more resilient, flourishing future for tomorrow.
            </p>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function PathwaysSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>How the purpose comes to life</p>
          <h2 className={styles.heading}>Current areas of work</h2>
        </ScrollReveal>

        <div className={styles.pathwayList}>
          {pathways.map((pathway) => (
            <ScrollReveal key={pathway.title} className={styles.pathwayReveal}>
              <article className={pathway.featured ? `${styles.pathway} ${styles.pathwayFeatured}` : styles.pathway}>
                <span className={styles.pathwayIndex}>{pathway.label}</span>
                <div>
                  <h3>{pathway.title}</h3>
                  <p>{pathway.body}</p>
                </div>
                <Link href={pathway.href} className={styles.pathwayLink}>
                  {pathway.cta}
                  <ArrowUpRight aria-hidden="true" size={17} />
                </Link>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function StrategicPartnersSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Strategic Partners</p>
          <h2 className={styles.heading}>Partners who extend the work.</h2>
        </ScrollReveal>

        <div className={styles.partnerProfile}>
          <ScrollReveal>
            <div className={styles.partnerImage}>
              <Image
                src="/assets/migrated/about-us/nicole-quan-kep.jpg"
                alt="Nicole Quan Kep"
                fill
                sizes="(min-width: 1000px) 28vw, 88vw"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal className={styles.partnerCopy}>
            <p className={styles.partnerMeta}>Founder: Nicole Quan Kep</p>
            <h3>Power10HK &amp; KEP-STAR</h3>
            <p className={styles.partnerLocation}>Hong Kong</p>
            {nicoleParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ScrollReveal>
        </div>

        <ScrollReveal className={styles.logoRow}>
          <a href="https://www.abcbrain.org/" target="_blank" rel="noreferrer" className={styles.logoCell}>
            <Image
              src="/assets/migrated/about-us/about-us-american-brain-council-banner-logo-500x275-1.jpg"
              alt="American Brain Council logo"
              fill
              sizes="(min-width: 768px) 24vw, 82vw"
            />
          </a>
          <a href="https://power10hk.com/" target="_blank" rel="noreferrer" className={styles.logoCell}>
            <Image
              src="/assets/migrated/about-us/about-us-power10-logo-v8-scaled.webp"
              alt="Power10 logo"
              fill
              sizes="(min-width: 768px) 24vw, 82vw"
            />
          </a>
        </ScrollReveal>
      </Container>
    </section>
  );
}

function CoreValuesSection() {
  return (
    <section className={styles.section}>
      <Container>
        <ScrollReveal className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Our Core Values</p>
          <h2 className={styles.heading}>The principles behind the work.</h2>
        </ScrollReveal>
        <div className={styles.valuesGrid}>
          <ScrollReveal>
            <div className={styles.valuesImage}>
              <Image
                src="/assets/migrated/about-us/about-us-our-core-values.jpg"
                alt="Hands joined together representing François Consulting Group core values"
                fill
                sizes="(min-width: 1000px) 40vw, 88vw"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <CoreValuesAccordion values={coreValues} />
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function FlourishSection() {
  return (
    <section className={`${styles.section} ${styles.flourishSection}`}>
      <Container>
        <ScrollReveal className={styles.flourishCopy}>
          <p>Because when people flourish...</p>
          <p>Organizations flourish.</p>
          <p>Communities flourish.</p>
          <p>And together, we create a future worth building.</p>
          <Link href="/programs-services" className={styles.closingCta}>
            Explore our work
            <ArrowUpRight aria-hidden="true" size={18} />
          </Link>
        </ScrollReveal>
      </Container>
    </section>
  );
}
