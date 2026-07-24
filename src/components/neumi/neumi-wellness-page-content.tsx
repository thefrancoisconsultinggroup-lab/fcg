import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Container } from "@/components/ui/container";
import { neumiWellnessPageContent } from "@/data/pages/neumi-wellness";
import styles from "./neumi-wellness-page.module.css";

const lifestyle = neumiWellnessPageContent.sections[0];
const products = neumiWellnessPageContent.sections[1];

export function NeumiWellnessPageContent() {
  return (
    <main className={styles.page}>
      <LifestyleSection />
      <ProductsSection />
    </main>
  );
}

function LifestyleSection() {
  const [lead, delivery, proof, faith] = lifestyle.body ?? [];
  const learnMore = lifestyle.links?.[0];

  return (
    <section className={styles.section}>
      <div className={styles.sectionGlow} aria-hidden="true" />
      <Container>
        <div className={styles.lifestyleGrid}>
          <ScrollReveal className={styles.lifestyleLead}>
            <p className={styles.eyebrow}>Everyday Vitality</p>
            <h2 className={styles.heading}>{lifestyle.heading}</h2>
            {lead ? <p className={styles.leadStatement}>{lead}</p> : null}
          </ScrollReveal>

          <ScrollReveal className={styles.lifestyleDetails}>
            {delivery ? <p className={styles.detailPrimary}>{delivery}</p> : null}
            {proof ? <p>{proof}</p> : null}
            {faith ? <blockquote className={styles.faithQuote}>{faith}</blockquote> : null}
            {learnMore ? (
              <a
                href={learnMore.href}
                target="_blank"
                rel="noreferrer"
                className={styles.primaryLink}
              >
                {learnMore.label}
                <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            ) : null}
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}

function ProductsSection() {
  return (
    <section className={`${styles.section} ${styles.productsSection}`}>
      <div className={styles.sectionGlow} aria-hidden="true" />
      <Container>
        <ScrollReveal className={styles.productsHeader}>
          <div>
            <p className={styles.eyebrow}>The Collection</p>
            <h2 className={styles.heading}>{products.heading}</h2>
          </div>
          <p className={styles.productsIntro}>
            Daily wellness essentials designed to support the body from within.
          </p>
        </ScrollReveal>

        <div className={styles.productGrid}>
          {products.cards?.map((product, index) => (
            <ScrollReveal key={product.title} className={styles.productReveal}>
              <article className={styles.product}>
                <div className={styles.productIndex}>0{index + 1}</div>
                {product.links?.[0] ? (
                  <a
                    href={product.links[0].href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.productLink}
                  >
                    {product.image ? (
                      <div className={styles.productVisual}>
                        <Image
                          src={product.image.src}
                          alt={product.image.alt}
                          fill
                          sizes="(min-width: 1180px) 18vw, (min-width: 700px) 30vw, 46vw"
                        />
                      </div>
                    ) : null}
                    <h3 className={styles.productName}>{product.title}</h3>
                    {product.body?.map((line) => (
                      <p key={line} className={styles.productTagline}>{line}</p>
                    ))}
                  </a>
                ) : (
                  <>
                    {product.image ? (
                      <div className={styles.productVisual}>
                        <Image
                          src={product.image.src}
                          alt={product.image.alt}
                          fill
                          sizes="(min-width: 1180px) 18vw, (min-width: 700px) 30vw, 46vw"
                        />
                      </div>
                    ) : null}
                    <h3 className={styles.productName}>{product.title}</h3>
                    {product.body?.map((line) => (
                      <p key={line} className={styles.productTagline}>{line}</p>
                    ))}
                  </>
                )}
              </article>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
