/**
 * Accent ramp derivation.
 *
 * The shipped ramp is hard-coded in styles/tokens.css because the owners' red
 * (#ae1800) is final. This module preserves the derivation the design handoff
 * specifies so that if the accent ever changes, the four steps are regenerated
 * rather than guessed at — in particular `accentOnDark`, which exists because
 * #ae1800 on #0d0c0c is 2.7:1 and fails contrast.
 */

const clamp255 = (v: number) => Math.max(0, Math.min(255, v));
const hex2 = (v: number) => Math.round(clamp255(v)).toString(16).padStart(2, '0');

function parseHex(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '');
  if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Mix a hex toward black by `amount` (0–1). Negative lightens. */
export function darken(hex: string, amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return '#' + rgb.map((v) => hex2(v * (1 - amount))).join('');
}

/**
 * Raise a hex to a target HSL lightness, keeping hue and saturation.
 *
 * The Modernist guide moves the accent one step *lighter* on a dark ground.
 * Darkening a red to sit on black fails outright, so the dark-ground step is
 * lifted instead.
 */
export function lift(hex: string, lightness: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const l0 = (max + min) / 2;
  const sat = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0;
  const L = Math.max(l0, lightness);
  const c = (1 - Math.abs(2 * L - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = L - c / 2;
  const seg = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(hue / 60) % 6];

  return '#' + seg.map((v) => hex2((v + m) * 255)).join('');
}

/**
 * The derivable steps, from a base accent.
 *
 * `accentDeep` is deliberately NOT returned here. The handoff's token table
 * specifies #4c1000 for the #ae1800 base, and that value is not the output of
 * this module's darken() at any amount — the channels do not scale uniformly,
 * so it was chosen by hand, not derived. It is also the one step used for
 * body-size text on the light ground, where contrast matters most.
 *
 * If the accent ever changes: take accent600 and accentOnDark from here, then
 * pick accentDeep by hand and verify it at 4.5:1 against --color-bg (#f3f2f2)
 * before shipping it.
 */
export function accentRamp(accent: string) {
  return {
    accent,
    accent600: darken(accent, 0.14),
    accentOnDark: lift(accent, 0.62),
  };
}
