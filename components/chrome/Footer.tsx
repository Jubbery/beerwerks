import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram } from 'lucide-react';
import { BUSINESS } from '@/lib/constants';
import type { SiteContent } from '@/lib/content';
import { HoursRows } from '@/components/ui/HoursRows';
import styles from './Footer.module.css';

export function Footer({ hours }: { hours: SiteContent['hours'] }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.columns}>
        <div>
          <Image
            src="/logo.webp"
            alt={BUSINESS.name}
            width={120}
            height={30}
            className={styles.logo}
          />
          <p className={styles.tagline}>{BUSINESS.tagline}</p>
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
        </div>

        <div>
          <h2 className={styles.label}>Hours</h2>
          <HoursRows hours={hours} variant="footer" />
        </div>

        <div>
          <h2 className={styles.label}>Taproom</h2>
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
            Find us
          </a>
        </div>

        <div>
          <h2 className={styles.label}>Contact</h2>
          <p className={styles.contactName}>{BUSINESS.contactName}</p>
          <p className={styles.contactTitle}>{BUSINESS.contactTitle}</p>
          <a href={BUSINESS.phoneHref} className={styles.contactLink}>
            {BUSINESS.phoneDisplay}
          </a>
          <a href={`mailto:${BUSINESS.email}`} className={styles.contactLink}>
            {BUSINESS.email}
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>© {BUSINESS.legalName} 2026</p>
        <Link href="/admin" className={styles.owners}>
          Owners
        </Link>
      </div>
    </footer>
  );
}
