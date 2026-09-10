import 'server-only';
import { BUSINESS } from './constants';
import type { ContactMessage } from './content';

/**
 * Outgoing mail, via Resend's REST API.
 *
 * Called over fetch rather than the SDK: it is one request, and it keeps the
 * dependency list and the cold start smaller.
 */

/** Escape before interpolating owner-facing HTML. A contact form that renders
 *  submitted markup into the owners' inbox is a phishing vector aimed at them. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Send a contact submission to the owners.
 *
 * Returns rather than throws: the message is already persisted by the time
 * this runs, so a mail failure must not fail the request or lose the enquiry.
 * The owners still see it in the dashboard.
 */
export async function sendContactNotification(message: ContactMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[mail] RESEND_API_KEY not set — message stored but not emailed');
    return;
  }

  // Must be a domain verified in Resend, or the mail is rejected or spam-filed.
  const from = process.env.MAIL_FROM ?? `Website <noreply@flowershopbeerwerks.com>`;

  const body = {
    from,
    to: [BUSINESS.email],
    // So a reply from the inbox goes to the person who wrote in.
    reply_to: message.email,
    subject: `${message.topic} — ${message.name}`,
    html: `
      <div style="font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.6;">
        <p style="margin:0 0 4px"><strong>${escapeHtml(message.name)}</strong></p>
        <p style="margin:0 0 16px; color:#605d5d">
          ${escapeHtml(message.email)} &middot; ${escapeHtml(message.phone)}
        </p>
        <p style="margin:0 0 16px"><strong>About:</strong> ${escapeHtml(message.topic)}</p>
        <div style="white-space: pre-wrap; border-left: 3px solid #ae1800; padding-left: 14px">${escapeHtml(
          message.message,
        )}</div>
        <p style="margin:24px 0 0; color:#605d5d; font-size:13px">
          Sent from the contact form at ${escapeHtml(BUSINESS.name)}.
        </p>
      </div>
    `,
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[mail] Resend rejected the send', res.status, await res.text());
    }
  } catch (error) {
    console.error('[mail] could not reach Resend', error);
  }
}
