/**
 * The content model. One record drives every public page.
 *
 * Free-text is deliberate: `hours[].value` and `events[].date` are strings the
 * owners type ("12pm – 10pm", "September 12, 2026"), not dates. Do not impose
 * a picker or a parser on them — the handoff is explicit, and a field that
 * rejects what an owner types is a support call.
 */

export type DrinkItem = { name: string; style: string; abv: string };

export type DrinkSection = {
  /** 'flagships' | 'rotating' | 'cocktails' | 'seltzer' | 'na' | 'sec_<ts>' */
  id: string;
  title: string;
  /** small gray line beside the section title */
  note: string;
  items: DrinkItem[];
};

export type FoodItem = { name: string; note: string };

export type SiteContent = {
  announcement: { enabled: boolean; text: string };
  hours: { label: string; value: string }[];
  menuNote: string;
  drinks: DrinkSection[];
  food: { truck: string; blurb: string; schedule: string; items: FoodItem[] };
  events: { title: string; date: string; detail: string }[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  /** ISO 8601 */
  receivedAt: string;
  read: boolean;
};

/** The owners' placeholder, entered as given. They fill real values in via the
 *  dashboard — this is a known gap, not a bug to silently correct. */
const ABV_PLACEHOLDER = 'ABV 00.0%';

/** Seed content, carried over from the design prototype's defaults(). */
export function defaults(): SiteContent {
  return {
    announcement: { enabled: true, text: 'Grand opening — September 12, 2026' },
    hours: [
      { label: 'Monday', value: 'Closed' },
      { label: 'Tue–Thu, Sun', value: '12pm – 10pm' },
      { label: 'Fri–Sat', value: '12pm – 12am' },
    ],
    menuNote:
      'Beer and cocktails are poured inside at the bar. Food comes from the truck parked out front — the lineup changes, so check the panel below before you order.',
    drinks: [
      {
        id: 'flagships',
        title: 'Flagships',
        note: 'Always on',
        items: [
          { name: 'Cjoors', style: 'Nordic Ale', abv: ABV_PLACEHOLDER },
          { name: 'Blank & Blank', style: 'Cederwood Infused IPA', abv: ABV_PLACEHOLDER },
          { name: 'Cheetah Coalition', style: 'Lavender Cream Ale', abv: ABV_PLACEHOLDER },
          { name: 'Break a Few Bees', style: 'Honey Ale', abv: ABV_PLACEHOLDER },
          { name: 'MOP-C', style: 'Cherry Lemon Lime Sour', abv: ABV_PLACEHOLDER },
        ],
      },
      { id: 'rotating', title: 'Rotating Taps', note: 'Ask what just went on', items: [] },
      { id: 'cocktails', title: 'Cocktails', note: 'Mixed to order at the bar', items: [] },
      { id: 'seltzer', title: 'Seltzer', note: 'Customizable — built to order', items: [] },
      { id: 'na', title: 'Non-Alcoholic', note: 'Soda and zero-proof', items: [] },
    ],
    food: {
      truck: 'Food truck out front',
      blurb:
        'A rotating truck parks on the curb most nights. The kitchen changes, the beer does not.',
      schedule: 'Wed–Sun · 5pm until the truck runs out',
      items: [],
    },
    events: [
      {
        title: 'Grand Opening',
        date: 'September 12, 2026',
        detail: 'Doors open at noon. All five flagships on tap, food truck out front.',
      },
    ],
  };
}

/**
 * Fold newly-shipped defaults into content the owners have already saved.
 *
 * This is the guard against destroying their work. Shipping a new menu
 * category (Cocktails was added this way) must make it appear without wiping
 * anything they have entered, so defaults only ever FILL GAPS — a stored value
 * always wins over a default. Run on every read.
 */
export function migrate(stored: unknown): SiteContent {
  const base = defaults();
  if (!stored || typeof stored !== 'object') return base;

  const s = stored as Partial<SiteContent>;
  const site: SiteContent = { ...base, ...s };

  // Menu sections: keep the owners' list and order, then splice in any default
  // section they have never seen, at roughly its default position.
  site.drinks = Array.isArray(s.drinks) ? s.drinks.slice() : base.drinks;
  base.drinks.forEach((def, i) => {
    if (!site.drinks.some((g) => g.id === def.id)) {
      site.drinks.splice(Math.min(i, site.drinks.length), 0, def);
    }
  });

  site.food = { ...base.food, ...(s.food ?? {}) };
  site.announcement = { ...base.announcement, ...(s.announcement ?? {}) };
  site.hours = Array.isArray(s.hours) ? s.hours : base.hours;
  site.events = Array.isArray(s.events) ? s.events : base.events;

  return site;
}
