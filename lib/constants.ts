/** Business facts. Single source — these appear on several pages each. */

export const BUSINESS = {
  name: 'Flower Shop Beer Werks',
  legalName: 'Flower Shop Beer Werks, LLC',
  tagline: 'Small-batch beer in RiNo. Open daily except Monday.',
  street: '3501 Delgany St',
  cityStateZip: 'Denver, CO 80216',
  /** Approximate — verify against the real address before launch. */
  coordinates: [39.7695, -104.9943] as const,
  mapsUrl: 'https://maps.google.com/?q=3501+Delgany+St+Denver+CO+80216',
  email: 'forget_me_not@flowershopbeerwerks.com',
  phoneDisplay: '(303) 817-1804',
  phoneHref: 'tel:3038171804',
  contactName: 'Ava Olmstead',
  contactTitle: 'Operations Manager',
  instagram: 'https://www.instagram.com/flowershopbeerwerks',
  facebook: 'https://www.facebook.com/profile.php?id=61571713204022',
} as const;

export const NAV_LINKS = [
  { href: '/menu', label: 'Food & Drink' },
  { href: '/events', label: "What's On" },
  { href: '/about', label: 'About' },
  { href: '/location', label: 'Location' },
  { href: '/contact', label: 'Contact' },
] as const;

/** Contact form topics, in order. First is the default. */
export const CONTACT_TOPICS = [
  'General question',
  'Bespoke brew or seltzer',
  'Wholesale or delivery',
  'Collaboration',
  'Private event',
  'Food truck booking',
] as const;
