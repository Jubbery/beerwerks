import Link from 'next/link';
import Image from 'next/image';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import { HoursRows } from '@/components/ui/HoursRows';
import { MenuRow } from '@/components/ui/MenuRow';
import styles from './page.module.css';

export default async function HomePage() {
  const site = await getSiteContent();
  const flagships = site.drinks.find((section) => section.id === 'flagships');

  return (
    <main id="main">
      <section className={styles.hero}>
        <Image
          src="/main-bar.webp"
          alt="The taproom at Flower Shop Beer Werks"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroInner}>
          <p className={styles.heroKicker}>Brewed in RiNo, Denver</p>
          <h1 className={styles.heroTitle}>Pull up a stool</h1>
          <p className={styles.heroBody}>
            Small-batch beer and cocktails from Jacob and Ava, poured a block off Delgany. Food
            truck out front, taps rotating all week.
          </p>
          <div className={styles.heroActions}>
            <Link href="/menu" className={styles.btnSolid}>
              See the Menu
            </Link>
            <Link href="/location" className={styles.btnOutline}>
              Find Us
            </Link>
          </div>
        </div>
      </section>

      {site.events.length > 0 ? (
        <section className={styles.whatsOn} aria-labelledby="whats-on">
          <div className={styles.whatsOnInner}>
            <div className={styles.sectionHead}>
              <h2 id="whats-on" className={styles.whatsOnTitle}>
                What&apos;s On
              </h2>
              <Link href="/events" className={styles.whatsOnLink}>
                All Events
              </Link>
            </div>
            <div className={styles.eventGrid}>
              {site.events.map((event, i) => (
                <article key={`${event.title}-${i}`} className={styles.eventCard}>
                  <p className={styles.eventDate}>{event.date}</p>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  <p className={styles.eventDetail}>{event.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.who} aria-labelledby="who-we-are">
        <div className={styles.whoInner}>
          <div>
            <p className={styles.kickerLight}>Who we are</p>
            <h2 id="who-we-are" className={styles.whoTitle}>
              A brewery run by two people who live here
            </h2>
            <p className={styles.whoBody}>
              Flower Shop Beer Werks is owned by head brewer Jacob Sabo and his wife, Ava Olmstead.
              We make unique takes on familiar styles, plus bespoke pours built for a particular
              kitchen, bar, or occasion.
            </p>
            <Link href="/about" className={styles.linkRule}>
              Read our story
            </Link>
          </div>
          <div className={styles.whoFrame}>
            <Image
              src="/tap-handles.webp"
              alt="Tap handles at the bar"
              width={800}
              height={460}
              sizes="(min-width: 1040px) 640px, 100vw"
              className={styles.whoImage}
            />
          </div>
        </div>
      </section>

      {flagships && flagships.items.length > 0 ? (
        <section className={styles.onTap} aria-labelledby="on-tap">
          <div className={styles.onTapInner}>
            <div className={styles.onTapHead}>
              <h2 id="on-tap" className={styles.onTapTitle}>
                On Tap
              </h2>
              <Link href="/menu" className={styles.onTapLink}>
                Full menu
              </Link>
            </div>
            {flagships.items.map((item, i) => (
              <MenuRow
                key={`${item.name}-${i}`}
                name={item.name}
                detail={item.style}
                abv={item.abv}
                variant="onTap"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.visit} aria-labelledby="visit">
        <div className={styles.visitInner}>
          <div>
            <p className={styles.kickerLight}>Visit</p>
            <h2 id="visit" className={styles.visitAddress}>
              {BUSINESS.street}
              <br />
              {BUSINESS.cityStateZip}
            </h2>
            <Link href="/location" className={styles.linkRule}>
              Directions &amp; map
            </Link>
          </div>
          <div>
            <p className={styles.kickerLight}>Hours</p>
            <HoursRows hours={site.hours} variant="light" />
          </div>
        </div>
      </section>
    </main>
  );
}
