import type { Metadata } from 'next';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: "What's On",
  description: 'Events at the Flower Shop Beer Werks taproom in RiNo, Denver.',
};

export default async function EventsPage() {
  const site = await getSiteContent();

  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Taproom calendar</p>
        <h1 className={styles.title}>What&apos;s On</h1>

        {site.events.map((event, i) => (
          <article key={`${event.title}-${i}`} className={styles.event}>
            <p className={styles.date}>{event.date}</p>
            <div className={styles.body}>
              <h2 className={styles.eventTitle}>{event.title}</h2>
              <p className={styles.detail}>{event.detail}</p>
            </div>
          </article>
        ))}

        <div className={styles.closing}>
          <p className={styles.closingText}>
            More on the way. Follow along on{' '}
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.closingLink}
            >
              Instagram
            </a>{' '}
            for taproom updates.
          </p>
        </div>
      </div>
    </main>
  );
}
