# Flower Shop Beer Werks — development plan

Rebuild of the Squarespace site for Flower Shop Beer Werks (3501 Delgany St,
Denver, CO 80216). Seven views plus a password-gated owner dashboard so Jacob
Sabo and Ava Olmstead can edit menus, hours, events and the homepage banner
without a developer.

Source of truth for the design: `docs/design-handoff/`. The `design/` HTML is a
**reference prototype**, not code to port line by line; `design-system/styles.css`
is the token layer to bring in as-is.

---

## 1. Stack decisions

| Area | Decision | Why |
| --- | --- | --- |
| Framework | **Next.js 16 (App Router) + TypeScript** | Handoff's own recommendation. Needs server-rendered public pages, a handful of JSON endpoints, server-side email and a session cookie — all first-party here. |
| Styling | **Plain CSS: global token layer + CSS Modules per component** | The spec is written as exact CSS values against `styles.css` variables. A utility framework would mean re-deriving every value by eye, which the handoff explicitly forbids. One media query at 1040px replaces the prototype's `isMobile` resize listener. |
| Fonts | `next/font/google` → Archivo | Self-hosts and preloads automatically; the handoff asks for self-hosting. |
| Icons | `lucide-react` | Handoff asks for the real package over hand-inlined paths. |
| Map | `leaflet` 1.9.4 + `react-leaflet`, dynamically imported with `ssr: false` | Matches the prototype exactly; Leaflet touches `window` at import time. |
| Hosting | **Vercel** | Decided. First-party Next.js hosting: zero-config deploys, preview URLs, and no server for the owners or anyone else to maintain. |
| Data | **Neon Postgres** — one JSONB `site_content` row + a `contact_messages` table, behind a `lib/store.ts` interface | Decided. Vercel's filesystem is read-only, so a hosted DB is required. The interface stays so the adapter is swappable and local dev needs no database. |
| Auth | Shared password hashed in an env var, signed HTTP-only session cookie (`jose`) | Two owners; a shared credential is proportionate. Replaces the prototype's client-side string compare outright. |
| Email | **Resend**, API key in env | Handoff's suggestion; sends to `forget_me_not@flowershopbeerwerks.com`. |
| Validation | `zod` | Shared between the client form and the API route. |

### Rejected / deferred

- **MUI** — asked about, and the answer is no for this build. MUI implements
  Material Design: rounded corners, elevation shadows, centered button labels,
  Roboto and its own type scale. Modernist is the deliberate opposite of every
  one of those — radius 0 everywhere, nothing floats, labels flush left, Archivo
  throughout. Adopting MUI would mean overriding its theme on nearly every
  component and still shipping ~90KB of JS to a site that otherwise needs almost
  none, on pages that are mostly static text and rules.

  The real pull of MUI is accessible form controls for the dashboard, and that
  is worth taking seriously — but the dashboard is text inputs, textareas, one
  checkbox and a tab bar, and the handoff specifies its look in the same
  Modernist language as the public pages (2px borders, radius 0, accent ×
  buttons). Native elements plus correct labels and ARIA on the tab bar covers
  it. If a primitive does turn out to be worth pulling in, use a **headless**
  library (Radix UI, Base UI, React Aria) — they give the accessibility and
  keyboard behavior with no visual opinion to fight.
- **Tailwind** — see Styling above.
- **A CMS (Sanity, Payload)** — the content model is one JSON record edited by
  two people. A CMS is more surface area than the dashboard the design already
  specifies.
- **A date picker for events/hours** — the handoff is explicit that `date` and
  `value` are free text ("September 12, 2026", "12pm – 10pm"). Do not impose
  structure without asking.

---

## 2. Target structure

```
app/
  layout.tsx                 announcement bar + header + footer, fonts, metadata
  page.tsx                   /            Home
  menu/page.tsx              /menu        Food & Drink
  events/page.tsx            /events      What's On
  about/page.tsx             /about
  location/page.tsx          /location    (map is a client child)
  contact/page.tsx           /contact
  admin/page.tsx             /admin       noindex, session-gated
  api/
    site/route.ts            GET public · PUT owner
    auth/login/route.ts      POST, rate-limited
    auth/logout/route.ts     POST
    contact/route.ts         POST, rate-limited, validates + persists + mails
    messages/route.ts        GET / PATCH, owner
components/
  chrome/    AnnouncementBar, Header, MobileNav, Footer
  ui/        MenuRow, HoursRows, Kicker, Button, SectionHeader
  admin/     LoginPanel, TabBar, DrinksEditor, FoodEditor, HoursEditor,
             EventsEditor, BannerEditor, MessagesPanel
lib/
  content.ts    SiteContent + ContactMessage types, DEFAULTS, migrate()
  store.ts      persistence interface + adapter
  auth.ts       password verify, session sign/read, cookie helpers
  mail.ts       Resend wrapper
  theme.ts      accent ramp derivation (lift/darken)
  ratelimit.ts
styles/
  tokens.css    from design-system/styles.css — do not re-derive values
  globals.css   reset, focus-visible, ::selection, color-scheme: light
public/
  logo.webp, main-bar.webp, tap-handles.webp
```

---

## 3. Content model and persistence

Types come straight from the handoff (`SiteContent`, `ContactMessage`).
`DEFAULTS` is the prototype's `defaults()` seed verbatim — the five flagships,
the four empty categories with their notes, three hours rows, the grand-opening
event, the banner text.

**`migrate()` behavior is a hard requirement, not a nicety.** New default menu
sections fold into content the owner has already saved, positionally, by `id`.
Never overwrite owner content with new defaults. This survives the move to a
database as an ordinary read-time merge.

Everything goes behind one interface so the backend is a late decision:

```ts
interface Store {
  getSite(): Promise<SiteContent | null>;
  putSite(c: SiteContent): Promise<void>;
  listMessages(): Promise<ContactMessage[]>;
  putMessages(m: ContactMessage[]): Promise<void>;
  addMessage(m: ContactMessage): Promise<void>;
}
```

Two adapters:

- **Production — Neon Postgres.** A `site_content` table holding one JSONB row,
  and a `contact_messages` table. Accessed over the pooled connection string in
  `DATABASE_URL`. Schema changes go in `db/migrations/` and run on deploy.
- **Local dev — a JSON file** under `.data/`, so the site runs with no database
  and no network. A dev convenience only: Vercel's filesystem is read-only, so
  this adapter must never be selected in production. Guard it — fail the build
  or throw at startup if `NODE_ENV === 'production'` and the file adapter is
  active, rather than silently losing every owner edit.

Back up the `site_content` row on a schedule. It is the owners' work, it is
small, and Neon's point-in-time restore covers it — confirm the retention
window on the chosen plan.

Public pages fetch server-side and cache; `PUT /api/site` calls
`revalidatePath()` so owner edits appear immediately.

---

## 4. Security

The dashboard is being handed to the owners, so this section is a requirement
list, not a set of suggestions. Every prototype auth affordance is a demo and
gets replaced outright.

**Credentials**

- Delete `DEMO_PASSWORD` and the on-screen **"Demo password: flowershop"** hint.
  Neither ships.
- The owner password lives as an **argon2id hash** in `OWNER_PASSWORD_HASH` —
  never a plaintext env var, never in the repo. Compare in constant time.
- Generate a long random password for the owners at handoff and give it to them
  through a password manager, not email or text.

**Session**

- Signed JWT (`jose`) in an **HTTP-only, `Secure`, `SameSite=Lax`** cookie, with
  a signing secret in `SESSION_SECRET` (32+ random bytes, rotatable).
- Fixed expiry — 30 days, so the owners are not re-authenticating constantly,
  with "Sign out" clearing the cookie server-side.
- Every write verifies the session **server-side**. `PUT /api/site` and
  `GET|PATCH /api/messages` must not trust a client `authed` flag; middleware
  gates `/admin` before the page renders.

**Public endpoints**

- Rate limit `POST /api/auth/login` (per IP, with backoff on repeated failures)
  and `POST /api/contact`. Both are unauthenticated and both cost money or
  reputation when abused.
- The login response must not distinguish "wrong password" from any other
  failure beyond the single error line the design specifies.
- Contact input is validated server-side with the same zod schema as the
  client — the client check is UX, not a control. Cap field lengths.
- Escape the message body in the outgoing email; a contact form that renders
  submitted HTML into the owners' inbox is a phishing vector aimed at them.
- Add a honeypot field and a timing check before reaching for a CAPTCHA.

**Everything else**

- `/admin` gets `robots: noindex`; keep it out of the sitemap.
- Security headers via `next.config`: HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, and a CSP once the Leaflet tile and font origins are known.
- Secrets live in Vercel's environment variables, scoped per environment.
  Preview deploys must not share the production database.
- Owner edits are stored as content and rendered as text — never
  `dangerouslySetInnerHTML`. An owner typing `<script>` into the banner should
  see those characters on the page, not run them.

---

## 5. Making the dashboard safe for the owners to use

Jacob and Ava are not developers and there is no one to call when something
goes wrong. The dashboard has to fail visibly and never lose work:

- **Never a silent failure.** The prototype saves optimistically on every
  keystroke and cannot report an error. Production shows three real states —
  saving, saved, and *failed, with what to do* — and keeps the unsaved text in
  the field so a dropped connection never eats an edit.
- **Debounce ~500ms**, then save. No "Save" button to forget, but no save
  storm either.
- **`migrate()` is the guard against wiping their work** (§3). Shipping a new
  menu category must never overwrite content they have already entered.
- **A "Reset to defaults" button is destructive and unlabeled as such.** It
  needs a confirmation step before it discards everything they have typed.
- **Deleting a message is irreversible.** Confirm it too.
- Keep the free-text fields free text (§1). A date picker that rejects
  "September 12, 2026" is a support call.
- Test the whole dashboard on a phone. The owners will edit hours from behind
  the bar, and the 44px touch targets in the design exist for that reason.

---

## 6. Design details that are easy to get wrong

Pulled out because the handoff flags each one as a bug already hit or a
contrast failure:

- **`--accent-on-dark: #ff583d`** for accent text on dark grounds. The base
  `#ae1800` on `#0d0c0c` is 2.7:1 and fails. Keep the HSL-lift derivation
  (lightness → 0.62) so a future accent change stays legible.
- **Logo on dark: `filter: brightness(0) invert(1)`**, never plain `invert(1)`
  — that turns the red flower cyan.
- **Every dashboard input needs an explicit `color`**, plus
  `color-scheme: light` on `html`. Unset renders white-on-white under a dark
  system scheme.
- **Radius 0 everywhere** — including Leaflet's popup wrapper and zoom controls,
  which must be overridden.
- **Button labels flush left**, including the full-width contact submit.
- **Map**: `scrollWheelZoom: false`; grayscale the *tile pane only* so the
  marker keeps its color; 18×18px accent square `divIcon`, not the default pin;
  `invalidateSize()` after mount.
- **Photographs**: `grayscale(1) contrast(1.05–1.08)`, heroes add
  `brightness(0.7)`. Never tint.
- Global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`;
  `::selection` `#ffc4b8` on `#201e1d`.
- Nav links need `white-space: nowrap` or they wrap mid-phrase.
- Every route scrolls to top on entry and closes the mobile nav; a resize across
  1040px also closes it.

**About-page copy is the owners' own, carried over verbatim. Do not rewrite it.**

---

## 7. Improvements over the prototype (called for by the handoff)

- Contact form: real inline validation + a pending state (prototype has neither).
- Dashboard saves: debounce ~500ms with a real save state **including failure**
  (prototype saves optimistically on every keystroke and cannot fail).
- Real paths instead of hash routes.
- Real auth instead of a string compare.

---

## 8. Phasing

| Phase | Work | Done when |
| --- | --- | --- |
| **0 — Scaffold** | Next 16 + TS, tokens from `styles.css`, Archivo, assets into `public/`, ESLint/Prettier, `.env.example` | `npm run dev` serves a blank page on the right ground with the right type |
| **1 — Chrome** | AnnouncementBar, Header (desktop nav + hamburger + full-screen overlay), Footer, the 1040px media query | Chrome matches spec at both breakpoints, overlay closes on link/resize |
| **2 — Content layer** | Types, `DEFAULTS`, `migrate()`, `Store` interface + dev file adapter, `GET /api/site` | Public pages can read real content |
| **3 — Public pages** | Home, Menu, Events, About, Location (+ map), Contact UI | All six render at high fidelity, fluid between breakpoints |
| **4 — Contact backend** | zod schema, rate limit, persist, Resend mail, success panel, validation + pending states | A submitted message arrives by email and lands in storage |
| **5 — Auth + dashboard** | Login route, session cookie, six editor tabs, debounced save with failure state, Messages panel | Owners can edit every field and see it live; demo hint gone |
| **6 — Production** | Neon adapter + migrations, security headers, metadata/SEO/OG, a11y pass, responsive QA, Vercel deploy | Live on the real domain, owners signed in with their own credential |

Phases 0–3 are unblocked. Phase 4 needs the email account and DNS access;
phase 6 needs the Neon project and the production domain.

---

## 9. Open questions

Hosting and styling are settled: **Vercel + Neon Postgres**, plain CSS with
CSS Modules. What is still open, none of it blocking phases 0–3:

1. **Vercel and Neon accounts.** Created under whose login? These should belong
   to the business, not to a developer's personal account, so the owners keep
   control of their own site. *(blocks phase 6)*
2. **Email provider account.** Resend or Postmark, plus DNS access to verify
   the sending domain — mail from an unverified domain will land in spam.
   *(blocks phase 4)*
3. **The domain.** Who holds `flowershopbeerwerks.com`, and when does it cut
   over from Squarespace? *(blocks phase 6)*
4. **Light-on-dark logo variant.** The `brightness(0) invert(1)` filter is a
   workaround; a proper white-wordmark/red-mark asset from the owners is better.
5. **"Proudly Serving" partner section** — dropped from the current site for a
   missing logo asset. Should it return?
6. **Prices?** Not in the design anywhere. Adding them needs a `price` field on
   the item shape and a fourth cell in the Menu Row — the handoff says ask first.
7. **Map coordinates** `[39.7695, -104.9943]` are approximate and must be
   verified against the real address before launch.
8. **Real ABVs** — every flagship currently reads the owners' placeholder
   `ABV 00.0%`. Owners fill these in via the dashboard, but confirm they know.

## 10. Known gaps carried forward

Deliberate, from the handoff — not defects to fix silently:

- Rotating Taps, Cocktails, Seltzer, Non-Alcoholic and food-truck items are
  empty; the categories exist with their notes and the owners add items.
- Event dates and hours values are free text, not structured dates.
- The dashboard has no drag-reordering for menu items or events, and no image
  upload.
