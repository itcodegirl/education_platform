// ═══════════════════════════════════════════════
// STREAK REMINDER — Scheduled Netlify function
// Runs daily to find users at risk of losing their
// streak and logs them for email notification.
//
// To enable email sending, configure a provider
// (Resend, SendGrid, etc.) and uncomment the send logic.
//
// Schedule: Add to netlify.toml:
//   [functions."streak-reminder"]
//   schedule = "0 18 * * *"
// ═══════════════════════════════════════════════

import { json } from './_shared.js';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a HMAC-SHA256 signature from the X-Webhook-Signature header.
 * Uses timing-safe comparison to prevent timing attacks.
 * Falls back to plain secret comparison if no signature header is present
 * (backward-compatible with simple secret approach).
 *
 * @param {string} body    Raw request body string
 * @param {string} secret  Shared secret from environment
 * @param {string} sig     Value of X-Webhook-Signature header (may be empty)
 * @param {string} plain   Value of x-webhook-secret header (legacy fallback)
 * @returns {boolean}
 */
function verifyWebhookAuth(body, secret, sig, plain) {
  if (!secret) return false;
  // Prefer HMAC signature if provided
  if (sig) {
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false; // Buffer lengths differ → invalid signature
    }
  }
  // Legacy: plain secret header comparison
  return plain === secret;
}

export async function handler(event) {
  // Only allow scheduled invocations or POST from admin
  if (event.httpMethod !== 'POST' && !event.headers['x-netlify-event']) {
    return json(405, { error: 'Method not allowed' });
  }

  // For scheduled invocations Netlify sets x-netlify-event: 'schedule'.
  // For manual POST triggers require either:
  //   - X-Webhook-Signature: HMAC-SHA256(body, STREAK_REMINDER_SECRET)  ← preferred
  //   - x-webhook-secret: <plain secret>                                 ← legacy fallback
  const isScheduled = event.headers['x-netlify-event'] === 'schedule';
  if (!isScheduled) {
    const secret = process.env.STREAK_REMINDER_SECRET;
    const hmacSig = event.headers['x-webhook-signature'] || event.headers['X-Webhook-Signature'] || '';
    const plainSecret = event.headers['x-webhook-secret'] || event.headers['X-Webhook-Secret'] || '';
    if (!verifyWebhookAuth(event.body || '', secret, hmacSig, plainSecret)) {
      return json(401, { error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return json(500, { error: 'Supabase not configured. Set SUPABASE_SERVICE_KEY.' });
  }

  try {
    // Find users whose last streak date was yesterday (at risk of losing streak)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const res = await fetch(
      `${supabaseUrl}/rest/v1/streaks?last_date=eq.${yesterdayStr}&days=gt.2&select=user_id,days,last_date`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!res.ok) {
      return json(502, { error: 'Failed to query streaks' });
    }

    const atRiskUsers = await res.json();

    if (atRiskUsers.length === 0) {
      return json(200, { message: 'No at-risk users today', count: 0 });
    }

    // Get email addresses for at-risk users
    const userIds = atRiskUsers.map((u) => u.user_id);
    const profileRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    const profileData = profileRes.ok ? await profileRes.json() : { users: [] };
    const emailMap = new Map();
    (profileData.users || []).forEach((u) => {
      if (userIds.includes(u.id)) {
        emailMap.set(u.id, { email: u.email, name: u.user_metadata?.display_name || 'Learner' });
      }
    });

    // Log at-risk users (replace with actual email sending)
    const reminders = atRiskUsers.map((u) => {
      const info = emailMap.get(u.user_id);
      return {
        userId: u.user_id,
        email: info?.email,
        name: info?.name,
        streakDays: u.days,
        lastActive: u.last_date,
      };
    });

    // Avoid logging PII (email, name) to Netlify function logs.
    // Count + anonymized streak distribution is enough for observability.
    console.log(
      `[streak-reminder] ${reminders.length} users at risk of losing their streak`,
    );

    // ─── Email sending (uncomment when provider is configured) ───
    //
    // const RESEND_API_KEY = process.env.RESEND_API_KEY;
    // if (RESEND_API_KEY) {
    //   for (const r of reminders) {
    //     if (!r.email) continue;
    //     await fetch('https://api.resend.com/emails', {
    //       method: 'POST',
    //       headers: {
    //         Authorization: `Bearer ${RESEND_API_KEY}`,
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({
    //         from: 'Cinova <noreply@cinova.app>',
    //         to: r.email,
    //         subject: `Don't lose your ${r.streakDays}-day streak! 🔥`,
    //         html: `
    //           <h2>Hey ${r.name}!</h2>
    //           <p>You've built a <strong>${r.streakDays}-day streak</strong> on Cinova — don't let it slip!</p>
    //           <p>Just one lesson today keeps your streak alive.</p>
    //           <a href="https://cinova.app/" style="display:inline-block;padding:12px 24px;background:#ff6b9d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Continue Learning →</a>
    //           <p style="color:#888;font-size:12px;margin-top:24px;">You're receiving this because you have an active streak on Cinova. Reply STOP to opt out.</p>
    //         `,
    //       }),
    //     });
    //   }
    // }

    // Don't return names/emails in the response — the function can be
    // reached with the shared secret and the response shouldn't leak PII.
    return json(200, {
      message: `Found ${reminders.length} at-risk users`,
      count: reminders.length,
    });
  } catch (error) {
    console.error('[streak-reminder] Error:', error);
    return json(500, { error: 'Internal error' });
  }
}

