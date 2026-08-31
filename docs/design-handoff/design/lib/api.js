/**
 * Flower Shop Beer Werks — data + messaging API.
 *
 * This is the ONLY place the prototype touches persistence or the network.
 * Everything is a documented stub backed by localStorage so the site works
 * offline today. To take it live in Claude Code, replace the bodies below —
 * the call signatures are what the UI depends on.
 *
 * ---------------------------------------------------------------------------
 * PORTING NOTES
 * ---------------------------------------------------------------------------
 * loadSite()            -> GET  /api/site            returns SiteContent
 * saveSite(content)     -> PUT  /api/site            owner-authenticated
 * login(password)       -> POST /api/auth/login      returns { token }
 * submitContact(msg)    -> POST /api/contact         sends mail to the owners
 * loadMessages()        -> GET  /api/messages        owner-authenticated
 *
 * SiteContent shape (see DEFAULTS in the Design Component logic class):
 *   { announcement: {enabled, text}, hours: [{label, value}],
 *     drinks: [{id, title, note, items: [{name, style, abv}]}],
 *     food: {truck, blurb, schedule, items: [{name, note}]},
 *     events: [{title, date, detail}], contact: {...} }
 *
 * ContactMessage shape:
 *   { id, name, email, phone, topic, message, receivedAt, read }
 *
 * Suggested production wiring: any small JSON API (Cloudflare Worker + KV,
 * Supabase, or a Next.js route handler). For email use Resend / Postmark /
 * SendGrid and send to forget_me_not@flowershopbeerwerks.com.
 */

const SITE_KEY = 'fsbw.site.v1';
const MSG_KEY = 'fsbw.messages.v1';
const AUTH_KEY = 'fsbw.auth.v1';

/** Demo-only owner password. Replace with real auth before launch. */
export const DEMO_PASSWORD = 'flowershop';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* storage unavailable — prototype keeps working in memory */
  }
};

/** GET /api/site */
export async function loadSite() {
  return read(SITE_KEY, null);
}

/** PUT /api/site — owner-authenticated. */
export async function saveSite(content) {
  write(SITE_KEY, content);
  return { ok: true };
}

/** POST /api/auth/login */
export async function login(password) {
  const ok = password === DEMO_PASSWORD;
  if (ok) write(AUTH_KEY, { token: 'demo', at: Date.now() });
  return { ok, error: ok ? null : 'That password does not match.' };
}

export async function currentSession() {
  return read(AUTH_KEY, null);
}

export async function logout() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    /* no-op */
  }
  return { ok: true };
}

/**
 * POST /api/contact
 * Production: validate, rate-limit, persist, then send mail to the owners.
 * Stub: stores the message locally so the owner dashboard can show it.
 */
export async function submitContact(message) {
  const list = read(MSG_KEY, []);
  const record = {
    id: 'msg_' + Date.now(),
    receivedAt: new Date().toISOString(),
    read: false,
    ...message,
  };
  write(MSG_KEY, [record, ...list]);
  return { ok: true, id: record.id };
}

/** GET /api/messages — owner-authenticated. */
export async function loadMessages() {
  return read(MSG_KEY, []);
}

/** PATCH /api/messages/:id */
export async function updateMessages(list) {
  write(MSG_KEY, list);
  return { ok: true };
}
