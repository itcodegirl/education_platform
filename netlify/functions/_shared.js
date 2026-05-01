// ═══════════════════════════════════════════════
// NETLIFY SHARED UTILITIES
// Shared by ai.js, practice-generate.js, and
// streak-reminder.js. Files prefixed with _ are
// not deployed as standalone Netlify Functions.
// ═══════════════════════════════════════════════

// ─── Response helper ──────────────────────────
/**
 * Build a Netlify function response with JSON body.
 * Sets Content-Type and X-Content-Type-Options on every response.
 */
export function json(statusCode, body) {
	return {
		statusCode,
		headers: {
			'Content-Type': 'application/json',
			'X-Content-Type-Options': 'nosniff',
		},
		body: JSON.stringify(body),
	};
}

// ─── Supabase config ─────────────────────────
/**
 * Returns the Supabase project URL and anon key from environment
 * variables. Supports both plain and VITE_-prefixed names so the
 * same .env file works locally with Vite and in Netlify Functions.
 */
export function getSupabaseConfig() {
	return {
		url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
		key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
	};
}

// ─── User verification ───────────────────────
/**
 * Validate a Supabase JWT against the Auth API.
 * Returns the user object on success, or null on any failure.
 */
export async function verifyUser(token) {
	const { url, key } = getSupabaseConfig();
	if (!url || !key) return null;

	try {
		const res = await fetch(`${url}/auth/v1/user`, {
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: key,
			},
		});
		if (!res.ok) return null;
		return res.json();
	} catch {
		return null;
	}
}

// ─── Persistent quota check ──────────────────
/**
 * Calls the Postgres consume_ai_quota() RPC with the user's JWT.
 * The RPC reads auth.uid() server-side so the user cannot spoof
 * their own id. Returns:
 *   true  — quota OK, request may proceed
 *   false — quota exceeded, return 429
 *   null  — RPC failed / unreachable (caller decides)
 */
export async function consumeQuotaPersistent(token) {
	const { url, key } = getSupabaseConfig();
	if (!url || !key) return null;

	try {
		const res = await fetch(`${url}/rest/v1/rpc/consume_ai_quota`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: key,
				'Content-Type': 'application/json',
			},
			body: '{}',
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data === true;
	} catch {
		return null;
	}
}

// ─── In-memory rate limit ────────────────────
/**
 * Factory that creates an isolated rate-limiter for a function.
 * Each function calls createRateLimiter() once at module scope so
 * they maintain separate Maps (hot-instance defense-in-depth).
 *
 * @param {number} windowMs   Sliding window in milliseconds (default: 60 000)
 * @param {number} maxRequests Max requests per window per user (default: 10)
 */
export function createRateLimiter(windowMs = 60_000, maxRequests = 10) {
	const rateLimits = new Map();

	return function checkRateLimit(userId) {
		const now = Date.now();
		let timestamps = rateLimits.get(userId) || [];
		timestamps = timestamps.filter((t) => t > now - windowMs);

		if (timestamps.length >= maxRequests) {
			return false;
		}

		timestamps.push(now);
		rateLimits.set(userId, timestamps);

		// Prune fully-expired entries to prevent unbounded memory growth.
		if (rateLimits.size > 200) {
			for (const [key, ts] of rateLimits) {
				if (ts.every((t) => t <= now - windowMs)) rateLimits.delete(key);
			}
		}

		return true;
	};
}
