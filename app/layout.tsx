import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { AnnouncementBar } from '@/components/chrome/AnnouncementBar';
import { Header } from '@/components/chrome/Header';
import { Footer } from '@/components/chrome/Footer';
import { BUSINESS } from '@/lib/constants';
import { getSiteContent } from '@/lib/site';
import { SITE_URL } from '@/lib/site-url';
import '@/styles/globals.css';

// Self-hosted at build time by next/font — no request to Google at runtime,
// which is also what keeps the CSP's font-src limited to 'self'.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-archivo',
});

const DESCRIPTION =
  'Small-batch beer and cocktails from Jacob and Ava, poured a block off Delgany in RiNo, Denver. Food truck out front, taps rotating all week.';

export const metadata: Metadata = {
  // Makes every relative URL below absolute, which link previews require —
  // iMessage, Slack and the rest will not resolve a relative og:image.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BUSINESS.name} — Small-batch beer in RiNo, Denver`,
    template: `%s — ${BUSINESS.name}`,
  },
  description: DESCRIPTION,
  applicationName: BUSINESS.name,
  alternates: { canonical: '/' },
  openGraph: {
    // Kept short: iMessage and Slack truncate a long title mid-word.
    title: BUSINESS.name,
    description: DESCRIPTION,
    url: '/',
    siteName: BUSINESS.name,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: BUSINESS.name,
    description: DESCRIPTION,
  },
  // The card image itself comes from app/opengraph-image.png and
  // app/twitter-image.png by file convention — Next adds the tags, including
  // the dimensions that stop clients rendering a small square thumbnail.
  robots: { index: true, follow: true },
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
