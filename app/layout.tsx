import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { AnnouncementBar } from '@/components/chrome/AnnouncementBar';
import { Header } from '@/components/chrome/Header';
import { Footer } from '@/components/chrome/Footer';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import '@/styles/globals.css';

// Self-hosted at build time by next/font — no request to Google at runtime,
// which is also what keeps the CSP's font-src limited to 'self'.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: {
    default: `${BUSINESS.name} — Small-batch beer in RiNo, Denver`,
    template: `%s — ${BUSINESS.name}`,
  },
  description:
    'Small-batch beer and cocktails from Jacob and Ava, poured a block off Delgany in RiNo, Denver. Food truck out front, taps rotating all week.',
  openGraph: {
    title: BUSINESS.name,
    description: BUSINESS.tagline,
    type: 'website',
    locale: 'en_US',
    siteName: BUSINESS.name,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteContent();

  return (
    <html lang="en" className={archivo.variable}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AnnouncementBar
          enabled={site.announcement.enabled}
          text={site.announcement.text}
        />
        <Header />
        {children}
        <Footer hours={site.hours} />
      </body>
    </html>
  );
}
