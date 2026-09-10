/**
 * Generate the link-preview card (app/opengraph-image.png).
 *
 *   npm run og
 *
 * Rendered ahead of time and committed rather than generated per request:
 * it changes only when the branding does, and a static PNG costs nothing to
 * serve. Re-run this if the photograph, the wordmark or the accent changes.
 *
 * Requires Archivo ExtraBold to be visible to fontconfig, since the text is
 * drawn through librsvg. The font is vendored at assets/fonts/ (SIL Open Font
 * License). On Debian/Ubuntu:
 *
 *   sudo cp assets/fonts/Archivo-ExtraBold.ttf /usr/share/fonts/truetype/
 *   sudo fc-cache -f
 */
import sharp from 'sharp';

const W = 1200;
const H = 630;

const ACCENT = '#ae1800';
const ON_DARK = '#ff583d';
const INK = '#f3f2f2';

// The taproom photograph, treated the way the site's heroes are — grayscale,
// contrast lifted, darkened — so the card reads as the same design. It is
// darker here than on the site because the wordmark sits on it in the brand
// red rather than white, and that red needs the ground to fall away behind it.
const photo = await sharp('public/main-bar.webp')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .grayscale()
  .linear(1.08, -8)
  .modulate({ brightness: 0.42 })
  .toBuffer();

// The wordmark in the brand red.
//
// This paints a flat colour through the logo's own alpha channel — a MASK, not
// a filter. Inverting the artwork instead would flip the red flower mark to
// cyan and the black wordmark to white, giving two colours where the mark
// needs one.
const sized = sharp('public/logo.webp').resize({ width: 620 });
const { info } = await sized.clone().png().toBuffer({ resolveWithObject: true });
const alpha = await sized.clone().ensureAlpha().extractChannel('alpha').toBuffer();

const logo = await sharp({
  create: { width: info.width, height: info.height, channels: 3, background: ACCENT },
})
  .joinChannel(alpha)
  .png()
  .toBuffer();

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .kicker { font-family: 'Archivo'; font-weight: 800; font-size: 26px; letter-spacing: 6.5px; fill: ${ON_DARK}; }
    .sub    { font-family: 'Archivo'; font-weight: 800; font-size: 30px; letter-spacing: 1px; fill: ${INK}; }
    .meta   { font-family: 'Archivo'; font-weight: 800; font-size: 23px; letter-spacing: 4px; fill: #d7d3d3; }
  </style>
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0d0c0c" opacity="0.45"/>
  <text x="72" y="150" class="kicker">BREWED IN RINO, DENVER</text>
  <text x="72" y="415" class="sub">SMALL-BATCH BEER &amp; COCKTAILS</text>
  <text x="72" y="470" class="meta">3501 DELGANY ST &#183; DENVER, CO</text>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${ACCENT}"/>
</svg>`);

const card = await sharp(photo)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: logo, top: 210, left: 72 },
  ])
  .png()
  .toBuffer();

// Both conventions get the same artwork. Next fills og:image from
// opengraph-image and twitter:image from twitter-image; without the second
// file, platforms that read only the Twitter tags get no card at all.
await sharp(card).toFile('app/opengraph-image.png');
await sharp(card).toFile('app/twitter-image.png');

console.log(`Wrote app/opengraph-image.png and app/twitter-image.png (${W}x${H})`);
