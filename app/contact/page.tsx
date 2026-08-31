import type { Metadata } from 'next';
import { Facebook, Instagram } from 'lucide-react';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import { HoursRows } from '@/components/ui/HoursRows';
import { ContactForm } from '@/components/contact/ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Get in touch with Flower Shop Beer Werks — bespoke brews, wholesale, collaborations and private events. Reach ${BUSINESS.contactName} at ${BUSINESS.email}.`,
};

export default async function ContactPage() {
  const site = await getSiteContent();

  return (
    <main id="main" className={styles.page}>
      <div className={styles.inner}>
        <p className={styles.kicker}>{BUSINESS.legalName}</p>
        <h1 className={styles.title}>Contact Us</h1>

        <div className={styles.columns}>
          <div>
            <ContactForm />
          </div>

          <div>
            <section className={styles.block}>
              <h2 className={styles.label}>Or reach us directly</h2>
              <p className={styles.person}>
                {BUSINESS.contactName} — {BUSINESS.contactTitle}
              </p>
              <p className={styles.contactLine}>
                <a href={BUSINESS.phoneHref} className={styles.contactLink}>
                  {BUSINESS.phoneDisplay}
                </a>
              </p>
              <p className={styles.contactLine}>
                <a href={`mailto:${BUSINESS.email}`} className={styles.emailLink}>
                  {BUSINESS.email}
                </a>
              </p>
            </section>

            <section className={styles.block}>
              <h2 className={styles.label}>Follow along</h2>
              <div className={styles.socials}>
                <a
                  href={BUSINESS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.social}
                >
                  <Instagram size={18} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
                  Instagram
                </a>
                <a
                  href={BUSINESS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.social}
                >
                  <Facebook size={18} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
                  Facebook
                </a>
              </div>
            </section>

            <section className={styles.block}>
              <h2 className={styles.label}>Taproom</h2>
              <p className={styles.address}>
                {BUSINESS.street}
                <br />
                {BUSINESS.cityStateZip}
              </p>
              <HoursRows hours={site.hours} variant="light" />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
