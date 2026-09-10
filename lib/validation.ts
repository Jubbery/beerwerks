import { z } from 'zod';
import { CONTACT_TOPICS } from './constants';

/**
 * The contact schema, shared by the form and the API route.
 *
 * The client check is UX — it tells someone what to fix before a round trip.
 * The server runs this same schema because that is the actual control: an
 * unauthenticated endpoint cannot trust anything the browser sends.
 *
 * Every field is length-capped. Without caps a public endpoint accepts a
 * megabyte of text per request.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Tell us your name.').max(100, 'That name is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'We need an email to reply to.')
    .max(200, 'That email is too long.')
    .pipe(z.email('That does not look like an email address.')),
  phone: z.string().trim().max(40, 'That phone number is too long.').optional().default(''),
  topic: z.enum(CONTACT_TOPICS).catch(CONTACT_TOPICS[0]),
  message: z
    .string()
    .trim()
    .min(1, 'Add a message so we know what you need.')
    .max(4000, 'That message is too long — try trimming it down.'),
  /**
   * Honeypot. Real people never see this field, so anything in it is a bot.
   * Deliberately NOT rejected here: the route needs a filled honeypot to pass
   * validation so it can answer 200 and tell the bot nothing. Capped only so
   * it cannot be used to post bulk data.
   */
  website: z.string().max(200).optional().default(''),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Field-keyed errors, for rendering under each input. */
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export function fieldErrors(error: z.ZodError<ContactInput>): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ContactInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/* ── Site content ─────────────────────────────────────────────────────────
   PUT /api/site accepts a whole SiteContent record from the browser, so it is
   validated the same way the contact form is. Owner-authenticated is not the
   same as trusted: a malformed record here corrupts every public page.
   ─────────────────────────────────────────────────────────────────────── */

/** Owner-entered free text. Capped, but never reformatted or parsed. */
const text = (max: number) => z.string().max(max);

export const siteContentSchema = z.object({
  announcement: z.object({
    enabled: z.boolean(),
    text: text(200),
  }),
  hours: z
    .array(z.object({ label: text(60), value: text(60) }))
    .max(20),
  menuNote: text(1000),
  drinks: z
    .array(
      z.object({
        id: z.string().min(1).max(60),
        title: text(80),
        note: text(160),
        items: z
          .array(z.object({ name: text(120), style: text(160), abv: text(40) }))
          .max(100),
      }),
    )
    .max(30),
  food: z.object({
    truck: text(120),
    blurb: text(600),
    schedule: text(160),
    items: z.array(z.object({ name: text(120), note: text(300) })).max(100),
  }),
  events: z
    .array(z.object({ title: text(160), date: text(80), detail: text(1000) }))
    .max(50),
});
