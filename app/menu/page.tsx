import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/site';
import { MenuRow } from '@/components/ui/MenuRow';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Food & Drink',
  description:
    'Beer and cocktails poured inside at the bar, food from the truck parked out front.',
};

export default async function MenuPage() {
  const site = await getSiteContent();

  // A section earns its place if it has items or a note — an owner who empties
  // a category without a note should not leave a bare heading behind.
  const sections = site.drinks.filter((s) => s.items.length > 0 || s.note.trim());

  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Drinks inside, food out front</p>
        <h1 className={styles.title}>Food &amp; Drink</h1>
        {site.menuNote ? <p className={styles.note}>{site.menuNote}</p> : null}

        {sections.map((section) => (
          <section key={section.id} className={styles.section}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              {section.note ? <p className={styles.sectionNote}>{section.note}</p> : null}
            </div>
            {section.items.map((item, i) => (
              <MenuRow
                key={`${item.name}-${i}`}
                name={item.name}
                detail={item.style}
                abv={item.abv}
              />
            ))}
          </section>
        ))}

        <section className={styles.truck}>
          <p className={styles.truckKicker}>Outside — the food truck</p>
          <h2 className={styles.truckTitle}>{site.food.truck}</h2>
          {site.food.blurb ? <p className={styles.truckBlurb}>{site.food.blurb}</p> : null}
          {site.food.schedule ? (
            <p className={styles.truckSchedule}>{site.food.schedule}</p>
          ) : null}
          {site.food.items.map((item, i) => (
            <MenuRow key={`${item.name}-${i}`} name={item.name} detail={item.note} variant="food" />
          ))}
        </section>
      </div>
    </main>
  );
}
