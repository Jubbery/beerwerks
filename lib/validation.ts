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
