import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSiteContent } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Who we are',
  description:
    'Flower Shop Beer Werks is owned by head brewer Jacob Sabo and his wife, Ava Olmstead.',
};

export default async function AboutPage() {
  const site = await getSiteContent();
  const flagships = site.drinks.find((section) => section.id === 'flagships');

  return (
    <main id="main" className={styles.page}>
      <section className={styles.hero}>
        <Image
          src="/tap-handles.webp"
          alt="Tap handles at the bar"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroInner}>
          <p className={styles.heroKicker}>Since 2025</p>
          <h1 className={styles.heroTitle}>Who we are</h1>
        </div>
      </section>

      <div className={styles.body}>
        {/* The owners' own words, carried over from the current site verbatim.
            Do not rewrite this copy. */}
        <div>
          <p className={styles.story}>
            Flower Shop Beer Werks is owned by head brewer Jacob Sabo and his wife, Ava Olmstead.
            Jacob is also a founding member of the Cheetah Coalition, a brewery co-op designed to
            incubate new craft breweries for distribution before shouldering the costs of renting
            or buying a physical location.
          </p>
          <p className={styles.story}>
            Flower Shop Beer Werks aims to create unique takes on familiar styles, as well as to
            create a personalized flavor profile for your needs. We also offer customizable
            restaurant and bar exclusives, rotating varietals, and are always looking for
            collaboration.
          </p>
        </div>

        <div>
          {flagships && flagships.items.length > 0 ? (
            <section className={styles.block}>
              <h2 className={styles.blockLabel}>The flagships</h2>
              {flagships.items.map((item, i) => (
                <div key={`${item.name}-${i}`} className={styles.flagship}>
                  <span className={styles.flagshipName}>{item.name}</span>
                  <span className={styles.flagshipStyle}>{item.style}</span>
                </div>
              ))}
            </section>
          ) : null}

          <section className={styles.block}>
            <h2 className={styles.blockLabel}>Collaborate</h2>
            <p className={styles.collaborateText}>
              Bespoke IPA, customizable seltzer, delivery and pricing — reach out to Ava.
            </p>
            <Link href="/contact" className={styles.cta}>
              Get in touch
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
