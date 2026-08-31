import type { Metadata } from 'next';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import { HoursRows } from '@/components/ui/HoursRows';
import { TaproomMap } from '@/components/map/TaproomMap';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Find Us',
  description: `${BUSINESS.street}, ${BUSINESS.cityStateZip}. Street parking on Delgany, a short walk from the 38th & Blake station.`,
};

export default async function LocationPage() {
  const site = await getSiteContent();

  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>RiNo, Denver</p>
        <h1 className={styles.title}>Find Us</h1>

        <div className={styles.columns}>
          <section>
            <h2 className={styles.label}>Address</h2>
            <p className={styles.address}>
              {BUSINESS.street}
              <br />
              {BUSINESS.cityStateZip}
            </p>
            <a
              href={BUSINESS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              Open in maps
            </a>
          </section>

          <section>
            <h2 className={styles.label}>Hours</h2>
            <HoursRows hours={site.hours} variant="light" />
          </section>

          <section>
            <h2 className={styles.label}>Getting here</h2>
            <p className={styles.note}>
              Street parking on Delgany. A short walk from the 38th &amp; Blake station.
            </p>
            <p className={styles.note}>
              Food truck parks out front — look for it on the curb.
            </p>
          </section>
        </div>
      </div>

      <TaproomMap />
    </main>
  );
}
