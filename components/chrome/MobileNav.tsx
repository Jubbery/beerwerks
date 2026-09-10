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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Keep Tab inside the overlay. aria-modal tells assistive tech to ignore
      // the page behind, but no browser actually contains focus, so without
      // this a keyboard user tabs out of an open menu into links they cannot
      // see and have no way back from.
      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
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
    <div ref={dialogRef} className={styles.overlay} role="dialog" aria-modal="true" aria-label="Menu">
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
