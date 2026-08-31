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
| Data | **Single JSON record + a messages table** behind a `lib/store.ts` interface | See §3 — the concrete backend depends on the hosting answer, so the interface lands first and the adapter swaps underneath. |
| Auth | Shared password hashed in an env var, signed HTTP-only session cookie (`jose`) | Two owners; a shared credential is proportionate. Replaces the prototype's client-side string compare outright. |
| Email | **Resend**, API key in env | Handoff's suggestion; sends to `forget_me_not@flowershopbeerwerks.com`. |
| Validation | `zod` | Shared between the client form and the API route. |

### Rejected / deferred

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

Adapters, in order of preference once hosting is known:

- **Vercel + Neon/Turso** — one `site_content` row (JSONB) + a
  `contact_messages` table. The default recommendation.
- **A VPS / container host** — SQLite on a mounted volume, same schema.
- **Local dev, today** — a JSON file under `.data/`, so page and dashboard work
  can start before the hosting question is answered.

A serverless filesystem is read-only, so the file adapter is a dev convenience
only and must not ship as the production adapter.

Public pages fetch server-side and cache; `PUT /api/site` calls
`revalidatePath()` so owner edits appear immediately.

---

## 4. Security work (all of it replaces prototype affordances)

- Delete `DEMO_PASSWORD` and the on-screen **"Demo password: flowershop"** hint.
- Owner password: hash in `OWNER_PASSWORD_HASH` (argon2/bcrypt), never a plaintext env var.
- Session: signed, HTTP-only, `SameSite=Lax`, `Secure` cookie with an expiry.
- `PUT /api/site`, `GET|PATCH /api/messages` verify the session server-side —
  not a client `authed` flag.
- Rate limit `POST /api/auth/login` and `POST /api/contact` (both unauthenticated).
- `/admin` gets `robots: noindex`.
- Contact input validated server-side with the same zod schema as the client;
  message body escaped in the outgoing email.

---

## 5. Design details that are easy to get wrong

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

## 6. Improvements over the prototype (called for by the handoff)

- Contact form: real inline validation + a pending state (prototype has neither).
- Dashboard saves: debounce ~500ms with a real save state **including failure**
  (prototype saves optimistically on every keystroke and cannot fail).
- Real paths instead of hash routes.
- Real auth instead of a string compare.

---

## 7. Phasing

| Phase | Work | Done when |
| --- | --- | --- |
| **0 — Scaffold** | Next 16 + TS, tokens from `styles.css`, Archivo, assets into `public/`, ESLint/Prettier, `.env.example` | `npm run dev` serves a blank page on the right ground with the right type |
| **1 — Chrome** | AnnouncementBar, Header (desktop nav + hamburger + full-screen overlay), Footer, the 1040px media query | Chrome matches spec at both breakpoints, overlay closes on link/resize |
| **2 — Content layer** | Types, `DEFAULTS`, `migrate()`, `Store` interface + dev file adapter, `GET /api/site` | Public pages can read real content |
| **3 — Public pages** | Home, Menu, Events, About, Location (+ map), Contact UI | All six render at high fidelity, fluid between breakpoints |
| **4 — Contact backend** | zod schema, rate limit, persist, Resend mail, success panel, validation + pending states | A submitted message arrives by email and lands in storage |
| **5 — Auth + dashboard** | Login route, session cookie, six editor tabs, debounced save with failure state, Messages panel | Owners can edit every field and see it live; demo hint gone |
| **6 — Production** | Real store adapter, metadata/SEO/OG, a11y pass, responsive QA, deploy | Live on the real domain |

Phases 0–3 are unblocked today. Phase 4 needs the email account, phase 6 needs
the hosting answer.

---

## 8. Open questions

Blocking for the phases noted; none block phases 0–3.

1. **Hosting target?** Drives the store adapter and the production DB. Vercel +
   Neon is the recommendation absent a reason otherwise. *(blocks phase 6)*
2. **Email provider account.** Resend or Postmark, plus DNS access to verify
   the sending domain — mail from an unverified domain will land in spam.
   *(blocks phase 4)*
3. **Light-on-dark logo variant.** The `brightness(0) invert(1)` filter is a
   workaround; a proper white-wordmark/red-mark asset from the owners is better.
4. **"Proudly Serving" partner section** — dropped from the current site for a
   missing logo asset. Should it return?
5. **Prices?** Not in the design anywhere. Adding them needs a `price` field on
   the item shape and a fourth cell in the Menu Row — the handoff says ask first.
6. **Map coordinates** `[39.7695, -104.9943]` are approximate and must be
   verified against the real address before launch.
7. **Real ABVs** — every flagship currently reads the owners' placeholder
   `ABV 00.0%`. Owners fill these in via the dashboard, but confirm they know.

## 9. Known gaps carried forward

Deliberate, from the handoff — not defects to fix silently:

- Rotating Taps, Cocktails, Seltzer, Non-Alcoholic and food-truck items are
  empty; the categories exist with their notes and the owners add items.
- Event dates and hours values are free text, not structured dates.
- The dashboard has no drag-reordering for menu items or events, and no image
  upload.
