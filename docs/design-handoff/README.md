# Handoff: Flower Shop Beer Werks — website rebuild

## Overview

A replacement for the current Squarespace site of Flower Shop Beer Werks, a
small brewery and taproom at 3501 Delgany St, Denver, CO 80216, owned by head
brewer Jacob Sabo and operations manager Ava Olmstead.

Seven views: Home, Food & Drink, What's On, About, Location (live map),
Contact (emails the owners), and a password-gated owner dashboard where Jacob
and Ava edit the menus, hours, events, and a homepage banner without a
developer.

Target repository: `Jubbery/beerwerks` (branch `main`, currently empty).

## About the design files

The files in `design/` are **design references written in HTML** — a working
prototype of the intended look and behavior, not production code to ship.
The task is to **recreate these designs in the target codebase**, using its
framework and conventions. The repo is empty today, so pick the framework:
Next.js (App Router) + TypeScript is the natural fit — the prototype is already
component-shaped, needs a handful of JSON endpoints, and wants server-side
email for the contact form.

The prototype is a single streaming component with a `state` object, a
`renderVals()` method returning every value and handler, and an HTML template
that binds to them. It maps onto a React tree almost 1:1: `state` → `useState`
or a server-fetched record, `renderVals()` → the component body, the template →
JSX. Read it as a spec, not as a file to port line by line.

`design-system/` holds the Modernist token sheet and its written guide. Every
color, font, and spacing value in the prototype comes from there. Bring
`styles.css` in as your token layer — do not re-derive the values by eye.

## Fidelity

**High fidelity.** Final colors, typography, spacing, copy, and interactions.
Recreate the UI closely. Exact values are in Design Tokens below, and the
prototype is the tiebreaker for anything not written down.

Two deliberate content placeholders, called out in Known Gaps.

---

## Architecture

### Routing

The prototype uses hash routes because it must run as one file. **Use real
paths.**

| Prototype | Ship as | Notes |
| --- | --- | --- |
| `#/` | `/` | |
| `#/menu` | `/menu` | |
| `#/events` | `/events` | |
| `#/about` | `/about` | |
| `#/location` | `/location` | |
| `#/contact` | `/contact` | |
| `#/admin` | `/admin` | Behind a real session check; `noindex` |

Every route scrolls to top on entry and closes the mobile nav.

### Content model

One JSON record drives every public page. It is the seed data in the
prototype's `defaults()` method; move it into a database table or a single
JSON document.

```ts
type SiteContent = {
  announcement: { enabled: boolean; text: string };
  hours:  { label: string; value: string }[];
  menuNote: string;
  drinks: {
    id: string;        // 'flagships' | 'rotating' | 'cocktails' | 'seltzer' | 'na' | 'sec_<ts>'
    title: string;
    note: string;      // small gray line beside the section title
    items: { name: string; style: string; abv: string }[];
  }[];
  food: {
    truck: string;
    blurb: string;
    schedule: string;
    items: { name: string; note: string }[];
  };
  events: { title: string; date: string; detail: string }[];
};

type ContactMessage = {
  id: string; name: string; email: string; phone: string;
  topic: string; message: string;
  receivedAt: string;  // ISO 8601
  read: boolean;
};
```

`date` on events and `value` on hours are **free text**, not dates — the owners
type "September 12, 2026" and "12pm – 10pm". Keep them strings; do not impose a
date picker without asking.

### API

`design/lib/api.js` is the whole surface, written as documented stubs over
`localStorage`. Keep the signatures, replace the bodies.

| Function | Endpoint | Auth |
| --- | --- | --- |
| `loadSite()` | `GET /api/site` | public |
| `saveSite(content)` | `PUT /api/site` | owner |
| `login(password)` | `POST /api/auth/login` | public |
| `currentSession()` / `logout()` | session read / destroy | — |
| `submitContact(message)` | `POST /api/contact` | public |
| `loadMessages()` | `GET /api/messages` | owner |
| `updateMessages(list)` | `PATCH /api/messages` | owner |

`POST /api/contact` must validate, rate-limit (it is an unauthenticated public
endpoint), persist the message, and send mail to
`forget_me_not@flowershopbeerwerks.com`. Resend or Postmark; put the API key in
an env var.

Auth in the prototype is a client-side string comparison against
`flowershop` — a demo affordance, not security. Replace it outright. Two owners,
so a single shared credential with a signed HTTP-only session cookie is
proportionate; add rate limiting on the login route.

### Seed migration

`migrate()` in the prototype folds newly-shipped default menu sections into
content the owner has already saved, so adding a category (Cocktails was added
this way) does not wipe their edits. Once content is in a database this becomes
an ordinary migration — but keep the behavior in mind: **never overwrite owner
content with new defaults.**

---

## Screens

### Global chrome

**Announcement bar** — full width, above the header, only when
`announcement.enabled` and text is non-empty. Background `--accent` (#ae1800),
white text, 13px/700, `letter-spacing: .1em`, uppercase, `padding: 10px 24px`.
Leading 8×8px solid white square, `gap: 12px`.

**Header** — `position: sticky; top: 0; z-index: 50`. Background #0d0c0c,
`border-bottom: 2px solid var(--accent)`. Inner row max-width 1360px,
`padding: 14px 24px`, `display: flex; justify-content: space-between; gap: 24px`.
Logo 34px tall, `filter: brightness(0) invert(1)` (see Assets).

Desktop nav (viewport ≥ 1040px): `display: flex; gap: 34px`. Links are
`#f3f2f2`, 12px/700, `letter-spacing: .16em`, uppercase, `white-space: nowrap`
(they wrap mid-phrase without it), hover `--accent-on-dark`. Order: Food & Drink,
What's On, About, Location, Contact. Then a social group — `gap: 14px`,
`padding-left: 8px`, `border-left: 2px solid #444141`, Instagram + Facebook
Lucide icons at 22px, `#f3f2f2`, hover `--accent-on-dark`. Then the CTA:
"Visit Us", solid `--accent` fill, white, `padding: 13px 22px`, 12px/800,
`letter-spacing: .16em`, uppercase, `nowrap`, links to Location, hover
`--accent-600`.

Mobile (< 1040px): a 48×48px hamburger, `border: 2px solid #f3f2f2`, three
22×2px bars, `gap: 5px`. Tapping it opens a **full-screen overlay** —
`position: fixed; inset: 0; z-index: 100`, background #0d0c0c, logo + 48px
close button on top, then nav rows: 30px/800 uppercase `#f3f2f2`,
`padding: 20px 0`, `border-bottom: 1px solid #444141`, above a
`border-top: 2px solid var(--accent)`. Below: the Visit Us CTA at
`padding: 20px 24px`, then two equal-width outlined social buttons
(`border: 2px solid #444141`, icon + label, `gap: 12px`). Every link closes the
overlay. A resize across the breakpoint also closes it.

**Footer** — background #0d0c0c, `border-top: 2px solid var(--accent)`. Four
columns, `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 40px`,
`padding: 64px 24px 32px`:

1. Logo (30px, inverted), tagline "Small-batch beer in RiNo. Open daily except
   Monday." at 15px `#9b9797`, then outlined Instagram/Facebook buttons
   (`border: 2px solid #444141`, `padding: 11px 14px`, hover border and text to
   `--accent-on-dark`).
2. "Hours" label + the hours rows.
3. "Taproom" label + address + "Find us" → Google Maps.
4. "Contact" label + Ava's name/title, phone, email.

Column labels are 12px/800, `letter-spacing: .2em`, uppercase,
`--accent-on-dark`. Hours rows: `justify-content: space-between`,
`padding: 8px 0`, `border-bottom: 1px solid #2d2b2b`, 14px, label 700 `#f3f2f2`,
value `#9b9797`.

Bottom bar: `border-top: 1px solid #2d2b2b`, `padding: 20px 24px 40px`,
`justify-content: space-between`. Left "© Flower Shop Beer Werks, LLC 2026"
12px `#9b9797`. Right "Owners" → `/admin`, 11px `#9b9797`, uppercase,
`letter-spacing: .16em`, hover `--accent-on-dark`. This is the only entry point
to the dashboard.

### Home `/`

1. **Hero.** `min-height: 74vh`, `display: flex; align-items: flex-end`,
   background #0d0c0c. `assets/main-bar.webp` absolutely positioned,
   `object-fit: cover`, `filter: grayscale(1) contrast(1.08) brightness(0.7)`.
   Content max-width 1360px, `padding: 120px 24px 64px`, flush left.
   - Kicker "Brewed in RiNo, Denver" — 13px/800, `.24em`, uppercase,
     `--accent-on-dark`.
   - H1 "Pull up a stool" — `clamp(46px, 10vw, 128px)`, weight 800,
     `line-height: .92`, `letter-spacing: -.03em`, uppercase, `max-width: 14ch`,
     `#f3f2f2`.
   - Body — `clamp(16px, 2vw, 21px)`, `line-height: 1.5`, `max-width: 46ch`,
     `#d7d3d3`, `text-wrap: pretty`: "Small-batch beer and cocktails from Jacob
     and Ava, poured a block off Delgany. Food truck out front, taps rotating
     all week."
   - Buttons, `gap: 12px`: "See the Menu" (solid `--accent`, white,
     `padding: 18px 28px`) and "Find Us" (`border: 2px solid #f3f2f2`,
     `padding: 16px 28px`, hover inverts to `#f3f2f2` bg / `#0d0c0c` text).
     Both 13px/800, `.16em`, uppercase.

2. **What's On** — the one red field on the page. Background `--accent`, white
   text, `border-bottom: 2px solid #0d0c0c`, `padding: 56px 24px`. Header row:
   H2 "What's On" `clamp(30px, 5vw, 56px)`/800 uppercase, and "All Events" →
   `/events` (12px/800, `border-bottom: 2px solid #fff`, hover `#0d0c0c`).
   Event cards in `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`
   with `gap: 2px` over a `rgba(255,255,255,.4)` background, so the gap reads as
   hairline rules between cells. Each cell: `--accent` background,
   `padding: 28px 24px 32px`, date 12px/800 `.18em` uppercase at 85% opacity,
   title 26px/800, detail 15px/1.5 at 92%.

3. **Who we are** — background #f3f2f2, `border-bottom: 2px solid #201e1d`,
   `padding: 80px 24px`, two columns
   `repeat(auto-fit, minmax(320px, 1fr))`, `gap: 56px`, `align-items: center`.
   Left: kicker "Who we are" (12px/800 `.24em` uppercase `--accent-deep`), H2
   "A brewery run by two people who live here" `clamp(30px, 4.4vw, 54px)`/800
   uppercase `line-height: 1.02`, body 17px/1.62 `max-width: 52ch`, then "Read
   our story" → `/about` (12px/800 uppercase, `border-bottom: 2px solid
   var(--accent)`, `padding-bottom: 5px`). Right: `assets/tap-handles.webp` in a
   `2px solid #201e1d` frame, `max-height: 460px`, `object-fit: cover`,
   `filter: grayscale(1) contrast(1.05)`.

4. **On Tap** — background #0d0c0c, `padding: 80px 24px`. Header row H2 "On Tap"
   + "Full menu" link, `padding-bottom: 24px`,
   `border-bottom: 2px solid var(--accent)`. Then the flagship rows (see Menu
   Row below).

5. **Visit** — background #f3f2f2, `padding: 80px 24px`, two columns
   `repeat(auto-fit, minmax(280px, 1fr))`, `gap: 48px`. Left: "Visit" kicker,
   address as an H2 `clamp(28px, 3.6vw, 44px)`/800 uppercase, "Directions & map"
   link. Right: "Hours" kicker + hours rows (`padding: 12px 0`,
   `border-bottom: 1px solid #d7d3d3`, 16px, label 700, value `#605d5d`).

### Food & Drink `/menu`

Background #0d0c0c throughout, `padding: 72px 24px 96px`, max-width 1360px.
Kicker "Drinks inside, food out front" (`--accent-on-dark`), H1 "Food & Drink"
`clamp(44px, 9vw, 112px)`/800 uppercase, then `menuNote` at 18px/1.6
`max-width: 56ch` `#d7d3d3`.

One section per drinks category with items or a note — order: Flagships,
Rotating Taps, Cocktails, Seltzer, Non-Alcoholic. `margin-bottom: 72px`.
Section header: `padding-bottom: 20px`,
`border-bottom: 2px solid var(--accent)`, title `clamp(26px, 4vw, 44px)`/800
uppercase beside its note at 14px `#9b9797`, `gap: 20px`, baseline-aligned.

**Menu Row** (used here and in On Tap) — a wrapping flex row,
`align-items: baseline`, `gap: 14px`, `padding: 24px 0`,
`border-bottom: 1px solid #444141`:

- name — `clamp(20px, 2.8vw, 30px)`, weight 800, `letter-spacing: -.01em`,
  uppercase, `flex: none`
- a leader rule — `flex: 1 1 40px; height: 1px; background: #605d5d; min-width: 20px`
- style — 15px `#d7d3d3`
- ABV — 13px/800, `letter-spacing: .1em`, `--accent-on-dark`, `nowrap`

(On Tap uses `clamp(22px, 3vw, 34px)` names, `padding: 22px 0`, `gap: 16px`.)

**Food truck panel**, last: `border: 2px solid var(--accent)`,
`padding: 40px 32px 44px`. Kicker "Outside — the food truck"
(`--accent-on-dark`), H2 `food.truck` `clamp(28px, 4.4vw, 48px)`/800 uppercase,
blurb 17px/1.6 `#d7d3d3`, schedule 13px/800 `.14em` uppercase `#f3f2f2`, then
item rows (name 20px/800 uppercase, leader rule, note 15px `#d7d3d3`,
`border-top: 1px solid #444141`).

### What's On `/events`

Background #f3f2f2, `padding: 72px 24px 96px`. Kicker "Taproom calendar"
(`--accent-deep`), H1 "What's On". Each event is a
`repeat(auto-fit, minmax(240px, 1fr))` grid, `gap: 24px`, `padding: 36px 0`,
`border-top: 2px solid #201e1d`: date at 15px/800 `.14em` uppercase
`--accent-deep` in column 1, then a `grid-column: span 2` block with the title
`clamp(26px, 3.6vw, 40px)`/800 uppercase and detail 17px/1.6 `max-width: 56ch`.
Closing rule + "More on the way. Follow along on Instagram for taproom updates."

### About `/about`

Photo hero: `min-height: 46vh`, `assets/tap-handles.webp`,
`filter: grayscale(1) contrast(1.08) brightness(var(--hero-dim))`,
`border-bottom: 2px solid var(--accent)`, kicker "Since 2025", H1 "Who we are"
`clamp(44px, 8vw, 104px)`.

Body on #f3f2f2, two columns `repeat(auto-fit, minmax(300px, 1fr))`,
`gap: 56px`, `padding: 72px 24px 96px`. Left: two paragraphs at 19px/1.62 —
**this copy is the owners' own, carried over from the current site verbatim.
Do not rewrite it.**

> Flower Shop Beer Werks is owned by head brewer Jacob Sabo and his wife, Ava
> Olmstead. Jacob is also a founding member of the Cheetah Coalition, a brewery
> co-op designed to incubate new craft breweries for distribution before
> shouldering the costs of renting or buying a physical location.

> Flower Shop Beer Werks aims to create unique takes on familiar styles, as well
> as to create a personalized flavor profile for your needs. We also offer
> customizable restaurant and bar exclusives, rotating varietals, and are always
> looking for collaboration.

Right column, two ruled blocks (`border-top: 2px solid #201e1d`,
`padding-top: 24px`): "The flagships" — name/style pairs,
`justify-content: space-between`, `padding: 12px 0`,
`border-bottom: 1px solid #d7d3d3`; and "Collaborate" — "Bespoke IPA,
customizable seltzer, delivery and pricing — reach out to Ava." plus a solid
`--accent` "Get in touch" button.

### Location `/location`

Background #f3f2f2. Kicker "RiNo, Denver", H1 "Find Us", then three columns
`repeat(auto-fit, minmax(260px, 1fr))`, `gap: 40px`:

1. "Address" — `3501 Delgany St / Denver, CO 80216` at 20px/700, "Open in maps"
   → `https://maps.google.com/?q=3501+Delgany+St+Denver+CO+80216`.
2. "Hours" — the hours rows.
3. "Getting here" — "Street parking on Delgany. A short walk from the 38th &
   Blake station." / "Food truck parks out front — look for it on the curb."

**Map**, full-bleed, `border-top`/`border-bottom: 2px solid #201e1d`,
`height: 56vh; min-height: 380px`. The prototype uses Leaflet 1.9.4 with
OpenStreetMap tiles:

- center/marker `[39.7695, -104.9943]`, zoom 16
- `scrollWheelZoom: false` — the map must not hijack page scrolling
- tiles grayscaled by setting `filter: grayscale(1) contrast(1.05)` on the
  **tile pane only**, so the marker keeps its color
- marker is an 18×18px `--accent` square with a `2px solid #0d0c0c` border
  (a `divIcon`), not Leaflet's default pin
- popup: "Flower Shop Beer Werks / 3501 Delgany St, Denver, CO 80216", open on
  load; popup wrapper and zoom controls forced to `border-radius: 0`
- `invalidateSize()` after mount, since the container is measured late

The coordinates are approximate — verify against the real address before
launch. If you swap to Mapbox or Google, keep the grayscale treatment, the
square marker, and disabled scroll-zoom.

### Contact `/contact`

Background #f3f2f2, `padding: 72px 24px 96px`. Kicker "Flower Shop Beer Werks,
LLC", H1 "Contact Us", then two columns
`repeat(auto-fit, minmax(300px, 1fr))`, `gap: 56px`.

**Left — the form**, `display: flex; flex-direction: column; gap: 22px`. Every
field is a label above an input: label 12px/800, `.16em`, uppercase; input
`background: #fff`, `border: 2px solid #201e1d`, `padding: 14px`, 16px text,
`color: #201e1d`.

| Field | Type | Required |
| --- | --- | --- |
| Name | text | yes |
| Email | email | yes |
| Phone (optional) | tel | no |
| What's this about | select | defaults to General |
| Message | textarea, 6 rows, `resize: vertical` | yes |

Select options: General question, Bespoke brew or seltzer, Wholesale or
delivery, Collaboration, Private event, Food truck booking.

Submit: full-width solid `--accent`, white, `padding: 20px 26px`, 13px/800,
`.16em`, uppercase, **`text-align: left`** (the system flush-lefts button
labels, including in wide buttons). Under it, 13px `#605d5d`: "Goes to
forget_me_not@flowershopbeerwerks.com."

On success the form is replaced by a `2px solid var(--accent)` panel: H2
"Message sent", body "Thanks — Ava or Jacob will get back to you at {email}.
Usually within a day or two.", and a "Send another" outlined button that resets.
Empty phone is stored as an em dash. Add real inline validation and a pending
state on submit — the prototype has neither.

**Right column**, three ruled blocks: "Or reach us directly" (Ava Olmstead —
Operations Manager, `(303) 817-1804` as `tel:3038171804`,
`forget_me_not@flowershopbeerwerks.com` as `mailto:`, both underlined in accent,
`word-break: break-all` on the email); "Follow along" (outlined Instagram and
Facebook buttons, `border: 2px solid #201e1d`, hover inverts to `#201e1d`
background); "Taproom" (address + hours rows).

### Owner dashboard `/admin`

Background #eae9e9. Unauthenticated it shows a 480px-wide centered sign-in:
kicker "Owners only", H1 "Sign in" at 44px, a password input, an error line in
`--accent-deep` when wrong, and a solid `--accent` submit. **The prototype's
"Demo password: flowershop" hint must be deleted when real auth lands.**

Authenticated: max-width 1200px, `padding: 48px 24px 96px`.

Header row (`border-bottom: 2px solid #201e1d`): "Owner dashboard" kicker + H1
"Manage the site" on the left; a save-state word ("Saved", clears after 1.6s)
and a "Sign out" outlined button on the right.

Tab bar: `display: flex; gap: 2px` over a `#d7d3d3` background so the gaps read
as rules. Tabs — Drink Menu, Food Truck, Hours, Events, Banner, Messages — are
12px/800 `.14em` uppercase, `padding: 14px 18px`. Active tab is `#201e1d` on
`#f3f2f2` text; inactive is the inverse.

Editors share one pattern: white inputs on a `#f3f2f2` card with
`border: 2px solid #201e1d`, `padding: 24px`; a 44px-wide accent-outlined `×`
button removes a row; a dark "Add item" button appends one. **Every input needs
an explicit `color`** — leaving it unset renders white-on-white under a dark
system color scheme, which is a bug we already hit here. Setting
`color-scheme: light` on `html` is the belt-and-braces fix.

- **Drink Menu** — one card per category: editable title (17px/800 uppercase)
  and note, then a row per item (name / style / ABV / remove). "Add item" per
  card, "Add a menu section" below all of them (appends
  `{ id: 'sec_<timestamp>' }`).
- **Food Truck** — truck name, schedule, blurb textarea, then item rows
  (name / description / remove) and "Add item".
- **Hours** — label/value rows plus "Add a row". Free text, both fields.
- **Events** — one card per event: title + date on a row, detail textarea
  below, "Add an event" at the end.
- **Banner** — a checkbox ("Show the banner on every page", 22px,
  `accent-color: var(--accent)`), the text input, and a live preview of the bar
  rendered underneath.
- **Messages** — a card per submission: name 18px/800, `email · phone` at 14px
  `#605d5d`, a topic tag (`#ffe0d9` background, `#7c1405` text, 11px/800
  uppercase) and a localized timestamp right-aligned, the body at 16px/1.6 with
  `white-space: pre-wrap`, then "Reply by email" (a prefilled `mailto:` with
  `Re: <topic>`) and "Delete". Empty state: "No messages yet. Anything sent from
  the contact page lands here."

Footer of every tab: a "Reset to defaults" button and the line "Changes save
automatically and appear on the live pages."

Saves are optimistic and immediate on every keystroke in the prototype. In
production **debounce** (~500ms) and show a real save state, including failure.

---

## Interactions & behavior

- **Responsive** — one breakpoint at **1040px**. Above it the desktop nav row;
  below it the hamburger and full-screen overlay. Everything else is fluid:
  `clamp()` type and `repeat(auto-fit, minmax(...))` grids, no other media
  queries. In the prototype the breakpoint is a resize listener writing an
  `isMobile` flag because inline styles cannot hold media queries — in a real
  stylesheet, use a media query.
- **Hover** — links on dark go to `--accent-on-dark`; solid accent buttons go to
  `--accent-600`; outlined buttons invert (fill with their border color).
- **Focus** — `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`
  globally. Never leave the browser default.
- **Selection** — `::selection` is `#ffc4b8` on `#201e1d`.
- No scroll animations, no reveal-on-scroll, no carousels. The rules and the
  type do the work.
- Minimum touch target 44px — the `×` buttons and hamburger are sized for it.

## State

Public pages need only the `SiteContent` record (fetch server-side; it is
cacheable and revalidated when the owner saves).

Client state, all local:

| State | Where |
| --- | --- |
| `navOpen` | mobile overlay |
| `form`, `sent`, `sentEmail` | contact page |
| `authed` | dashboard session |
| `tab` | dashboard tab bar |
| `messages` | dashboard Messages tab |
| `saveState` | transient "Saved" flag |

## Design tokens

From `design-system/styles.css` (Modernist). Read them from there; the values
below are for reference.

**Ground and ink**

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#f3f2f2` | light page ground |
| `--color-surface` | `#eae9e9` | dashboard ground |
| `--color-text` | `#201e1d` | ink |
| dark ground | `#0d0c0c` | hero, On Tap, menu, header, footer |
| neutrals | `#d7d3d3` `#9b9797` `#605d5d` `#444141` `#2d2b2b` | secondary text, rules |

**Accent** — the brand red is a single tweakable value with derived steps. The
owners chose a darker red than the system default:

| Token | Value | Use |
| --- | --- | --- |
| `--accent` | `#ae1800` | red fields, button fills, 2px accent rules |
| `--accent-600` | `#961500` | pressed / hover on solid accent |
| `--accent-deep` | `#4c1000` | accent-colored text on the LIGHT ground |
| `--accent-on-dark` | `#ff583d` | accent-colored text on DARK grounds |

`--accent-on-dark` matters. The Modernist guide moves the accent one step
*lighter* on a dark ground; `#ae1800` on `#0d0c0c` is 2.7:1 and fails. `#ff583d`
is 6.25:1 on black and 3.4:1 over the hero photograph. In the prototype it is
derived by lifting the accent's HSL lightness to 0.62, so any accent the owners
pick stays legible — keep that derivation (or hard-code the four steps if the
red is now final).

**Type** — Archivo throughout (Google Fonts, weights 100–900). Headings weight
800, `letter-spacing: -.02em` to `-.03em`, uppercase, `line-height: .92–1.05`.
Body 15–19px, `line-height: 1.5–1.62`. Labels and kickers 11–13px, weight 800,
`letter-spacing: .14em–.24em`, uppercase. Fluid heads use
`clamp(min, vw, max)` — values are per-screen above.

**Spacing** — 4 / 8 / 12 / 16 / 24 / 32px, sections at 56–96px vertical,
page gutter 24px, max content width 1360px (1200px on the dashboard).

**Radius — 0 everywhere.** No exceptions, including inputs, buttons, cards,
map popups and zoom controls. Leaflet's defaults must be overridden.

**Rules** — 2px `#201e1d` (or the accent) between major sections; 1px
`#d7d3d3` on light / `#444141`–`#2d2b2b` on dark for row separators. Do not
soften them to hairlines or replace them with whitespace.

**Elevation** — effectively unused. The design is flat; nothing floats.

**Imagery** — every photograph is `filter: grayscale(1) contrast(1.05–1.08)`,
and hero images add `brightness(0.7)`. Never tint or colorize.

## Assets

In `design/assets/`:

- `logo.webp` — the wordmark: red flower mark + black wordmark on transparency.
  On dark grounds the prototype applies `filter: brightness(0) invert(1)` to get
  a solid white mark. **Plain `invert(1)` turns the red flower cyan** — do not
  use it. Better: ask the owners for a proper light-on-dark variant (white
  wordmark, red mark) and drop the filter.
- `tap-handles.webp`, `main-bar.webp` — owner-supplied photographs of the
  taproom, used in the home and about heroes and the "Who we are" block.

Icons are [Lucide](https://lucide.dev) (`instagram`, `facebook`), inline SVG on
`currentColor`, `stroke-width: 2`, `stroke-linecap: square`. Use the real Lucide
package rather than the hand-inlined paths.

Fonts: Archivo from Google Fonts. Self-host for performance.

## Known gaps

- **ABVs read `ABV 00.0%`** — the owners' placeholder, entered as given. They
  fill real values in via the dashboard.
- **Rotating Taps, Cocktails, Seltzer, Non-Alcoholic and the food-truck items
  are empty** — the categories exist with their notes; the owners add items.
- **No prices anywhere.** If prices are wanted, the item shape needs a `price`
  field and the Menu Row needs a fourth cell — ask before adding.
- Event and hours values are free text, not structured dates.
- The contact form has no inline validation or pending state.
- The dashboard has no reordering (drag or move) for menu items or events, and
  no image upload.
- The current Squarespace site has a "Proudly Serving" section with a partner
  logo; it was dropped for lack of the asset. Confirm whether it should return.

## Files

```
design/
  Flower Shop Beer Werks.dc.html   the full prototype — all seven views
  lib/api.js                       the API surface, as documented stubs
  assets/                          logo + two photographs
design-system/
  styles.css                       Modernist tokens and component classes
  readme.md                        the design system's own guide
```

Open the prototype directly in a browser. Sign in to the dashboard at
`#/admin` with `flowershop` to see the editors and how edits flow to the
public pages.
