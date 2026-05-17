// ═══════════════════════════════════════════════
// SHARED UTILITIES
// Shared by ai.js, practice-generate.js,
// analytics-ingest.js, analytics-snapshots.js,
// and streak-reminder.js.
// ═══════════════════════════════════════════════

// ─── Response helpers ─────────────────────────
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

export function sendResponse(res, response) {
	Object.entries(response.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
	res.status(response.statusCode).send(response.body);
}

// ─── Supabase config ─────────────────────────
export function getSupabaseConfig() {
	return {
		url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
		key: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
	};
}

// ─── User verification ───────────────────────
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
async function isProfileDisabled(token, userId) {
	const { url, key } = getSupabaseConfig();
	if (!url || !key || !userId) return true;

	const params = new URLSearchParams({
		select: 'is_disabled',
		id: `eq.${userId}`,
		limit: '1',
	});

	try {
		const res = await fetch(`${url}/rest/v1/profiles?${params.toString()}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				apikey: key,
			},
		});
		if (!res.ok) return true;

		const rows = await res.json().catch(() => null);
		if (!Array.isArray(rows) || rows.length !== 1) return true;
		return rows[0]?.is_disabled === true;
	} catch {
		return true;
	}
}

export async function verifyActiveUser(token) {
	const user = await verifyUser(token);
	if (!user?.id) return null;

	const disabled = await isProfileDisabled(token, user.id);
	return disabled ? null : user;
}

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

		if (rateLimits.size > 200) {
			for (const [key, ts] of rateLimits) {
				if (ts.every((t) => t <= now - windowMs)) rateLimits.delete(key);
			}
		}

		return true;
	};
}
