'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram } from 'lucide-react';
import { BUSINESS, NAV_LINKS } from '@/lib/constants';
import styles from './MobileNav.module.css';

/**
 * The full-screen mobile menu.
 *
 * Closes on: any link, the close button, Escape, and a resize back above the
 * 1040px breakpoint — otherwise rotating a phone leaves the overlay stranded
 * over the desktop layout.
 */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const media = window.matchMedia('(min-width: 1040px)');
    const onBreakpoint = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    media.addEventListener('change', onBreakpoint);

    // The page behind must not scroll under the overlay.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      media.removeEventListener('change', onBreakpoint);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Menu">
      <div className={styles.top}>
        <Image
          src="/logo.webp"
          alt={BUSINESS.name}
          width={120}
          height={30}
          className={styles.logo}
          priority
        />
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu" className={styles.close}>
          ×
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={onClose} className={styles.link}>
            {link.label}
          </Link>
        ))}
      </nav>

      <Link href="/location" onClick={onClose} className={styles.cta}>
        Visit Us
      </Link>

      <div className={styles.socials}>
        <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className={styles.social}>
          <Instagram size={20} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
          Instagram
        </a>
        <a href={BUSINESS.facebook} target="_blank" rel="noopener noreferrer" className={styles.social}>
          <Facebook size={20} strokeWidth={2} strokeLinecap="square" aria-hidden="true" />
          Facebook
        </a>
      </div>
    </div>
  );
}
