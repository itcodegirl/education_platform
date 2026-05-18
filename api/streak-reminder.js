// ===============================================
// STREAK REMINDER - Scheduled function
// Runs daily to find users at risk of losing their
// streak and logs them for email notification.
//
// Schedule (vercel.json):
//   { "path": "/api/streak-reminder", "schedule": "0 18 * * *" }
//
// Vercel cron calls this with:
//   GET /api/streak-reminder
//   Authorization: Bearer <CRON_SECRET>   (set automatically by Vercel)
//
// Manual POST triggers require either:
//   X-Webhook-Signature: HMAC-SHA256(body, STREAK_REMINDER_SECRET)
//   x-webhook-secret: <plain secret>  (legacy fallback)
// ===============================================

import { json, sendResponse } from './_shared.js';
import { createHmac, timingSafeEqual } from 'crypto';

export function verifyWebhookAuth(body, secret, sig, plain) {
  if (!secret) return false;
  if (sig) {
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    } catch {
      return false;
    }
  }
  return plain === secret;
}

export function buildStreakReminderHtml({ name, streakDays }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,sans-serif;color:#f0f0f0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;padding:0 16px">
    <tr><td>
      <div style="background:#1a1a2e;border-radius:12px;padding:40px 32px;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">🔥</div>
        <h1 style="margin:0 0 8px;font-size:24px;color:#fff">Don't break your streak, ${name}!</h1>
        <p style="margin:0 0 24px;color:#aaa;font-size:16px">
          You're on a <strong style="color:#ff6b35">${streakDays}-day streak</strong>.
          Complete one lesson today to keep it going.
        </p>
        <a href="https://codeherway.com"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;
                  padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px">
          Continue Learning →
        </a>
        <p style="margin:32px 0 0;color:#666;font-size:13px">
          You're receiving this because you have an active streak on CodeHerWay.<br>
          <a href="https://codeherway.com/profile" style="color:#7c3aed">Manage notifications</a>
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`;
}

// Disable Vercel's body parser so we can read the raw body for HMAC verification.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // Vercel cron sends GET with Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  const isVercelCron = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

  // Read raw body (needed for HMAC on manual POST triggers)
  let rawBody = '';
  if (req.method === 'POST') {
    rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  // Allow: Vercel cron (GET or POST), or authenticated manual POST
  if (!isVercelCron) {
    if (req.method !== 'POST') {
      sendResponse(res, json(405, { error: 'Method not allowed' }));
      return;
    }
    const secret = process.env.STREAK_REMINDER_SECRET;
    const hmacSig = req.headers['x-webhook-signature'] || req.headers['X-Webhook-Signature'] || '';
    const plainSecret = req.headers['x-webhook-secret'] || req.headers['X-Webhook-Secret'] || '';
    if (!verifyWebhookAuth(rawBody, secret, hmacSig, plainSecret)) {
      sendResponse(res, json(401, { error: 'Unauthorized' }));
      return;
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    sendResponse(res, json(500, { error: 'Supabase not configured. Set SUPABASE_SERVICE_KEY.' }));
    return;
  }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const streakRes = await fetch(
      `${supabaseUrl}/rest/v1/streaks?last_date=eq.${yesterdayStr}&days=gt.2&select=user_id,days,last_date`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!streakRes.ok) {
      sendResponse(res, json(502, { error: 'Failed to query streaks' }));
      return;
    }

    const atRiskUsers = await streakRes.json();

    if (atRiskUsers.length === 0) {
      sendResponse(res, json(200, { message: 'No at-risk users today', count: 0 }));
      return;
    }

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

    console.log(
      `[streak-reminder] ${reminders.length} users at risk of losing their streak`,
    );

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_ADDRESS = process.env.STREAK_REMINDER_FROM || 'CodeHerWay <hello@codeherway.com>';
    let emailsSent = 0;
    let emailErrors = 0;

    if (RESEND_API_KEY) {
      for (const r of reminders) {
        if (!r.email) continue;
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: FROM_ADDRESS,
              to: r.email,
              subject: `🔥 Keep your ${r.streakDays}-day streak alive, ${r.name}!`,
              html: buildStreakReminderHtml(r),
            }),
          });
          if (emailRes.ok) {
            emailsSent++;
          } else {
            emailErrors++;
            console.error(`[streak-reminder] Failed to send to ${r.email}: ${emailRes.status}`);
          }
        } catch (emailErr) {
          emailErrors++;
          console.error(`[streak-reminder] Error sending to ${r.email}:`, emailErr);
        }
      }
      console.log(`[streak-reminder] Emails: ${emailsSent} sent, ${emailErrors} errors`);
    }

    sendResponse(res, json(200, {
      message: `Found ${reminders.length} at-risk users`,
      count: reminders.length,
      emailsSent,
    }));
  } catch (error) {
    console.error('[streak-reminder] Error:', error);
    sendResponse(res, json(500, { error: 'Internal error' }));
  }
}
