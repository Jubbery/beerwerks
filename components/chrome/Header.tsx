'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram } from 'lucide-react';
import { BUSINESS, NAV_LINKS } from '@/lib/constants';
import { MobileNav } from './MobileNav';
import styles from './Header.module.css';

export function Header() {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.brand} aria-label={`${BUSINESS.name} — home`}>
            <Image
              src="/logo.webp"
              alt={BUSINESS.name}
              width={136}
              height={34}
              className={styles.logo}
              priority
            />
          </Link>

          <nav className={styles.desktop} aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={styles.navLink}
                aria-current={pathname === link.href ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}

            <span className={styles.socials}>
              <a
                href={BUSINESS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BUSINESS.name} on Instagram`}
                className={styles.socialIcon}
              >
                <Instagram size={22} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
              </a>
              <a
                href={BUSINESS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${BUSINESS.name} on Facebook`}
                className={styles.socialIcon}
              >
                <Facebook size={22} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
              </a>
            </span>

            <Link href="/location" className={styles.cta}>
              Visit Us
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            aria-expanded={navOpen}
            className={styles.hamburger}
          >
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </button>
        </div>
      </header>

      <MobileNav open={navOpen} onClose={closeNav} />
    </>
  );
}
