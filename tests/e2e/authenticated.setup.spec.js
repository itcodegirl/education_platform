import fs from 'node:fs';
import path from 'node:path';
import { test } from '@playwright/test';
import { getMissingE2EAuthConfig, isE2EAuthRequired } from './authHelpers';

const authDir = path.join(process.cwd(), 'playwright', '.auth');
const authFile = path.join(authDir, 'user.json');

function writeEmptyState() {
	fs.mkdirSync(authDir, { recursive: true });
	fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
}

function getAppOrigin(testInfo) {
	const baseURL =
		testInfo.project.use?.baseURL ||
		process.env.PLAYWRIGHT_BASE_URL ||
		'http://127.0.0.1:4319';

	return new URL(baseURL).origin;
}

function getSupabaseUrl() {
	return process.env.VITE_SUPABASE_URL.trim().replace(/\/+$/, '');
}

function getSupabaseStorageKey() {
	const { hostname } = new URL(getSupabaseUrl());
	const projectRef = hostname.split('.')[0];
	return `sb-${projectRef}-auth-token`;
}

function normalizeSession(session) {
	const expiresIn = Number(session.expires_in) || 3600;

	return {
		...session,
		expires_at: session.expires_at || Math.floor(Date.now() / 1000) + expiresIn,
	};
}

function writeAuthenticatedState(session, appOrigin) {
	fs.mkdirSync(authDir, { recursive: true });
	fs.writeFileSync(
		authFile,
		JSON.stringify(
			{
				cookies: [],
				origins: [
					{
						origin: appOrigin,
						localStorage: [
							{ name: 'chw-onboarded', value: 'true' },
							{
								name: getSupabaseStorageKey(),
								value: JSON.stringify(normalizeSession(session)),
							},
						],
					},
				],
			},
			null,
			2,
		),
	);
}

async function signInWithSupabase(request) {
	const supabaseUrl = getSupabaseUrl();
	const anonKey = process.env.VITE_SUPABASE_ANON_KEY.trim();
	const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
		data: {
			email: process.env.E2E_EMAIL,
			password: process.env.E2E_PASSWORD,
		},
		headers: {
			apikey: anonKey,
			authorization: `Bearer ${anonKey}`,
		},
		timeout: 30000,
	});

	if (!response.ok()) {
		const body = await response.text();
		throw new Error(`E2E Supabase sign-in failed (${response.status()}): ${body.slice(0, 300)}`);
	}

	const session = await response.json();
	if (!session.access_token || !session.refresh_token || !session.user) {
		throw new Error('E2E Supabase sign-in returned an incomplete session.');
	}

	return session;
}

test('capture authenticated storage state', async ({ request }, testInfo) => {
	const missingEnv = getMissingE2EAuthConfig();
	if (missingEnv.length > 0) {
		writeEmptyState();
		if (isE2EAuthRequired()) {
			throw new Error(
				`Authenticated E2E requires GitHub Secrets or environment variables: ${missingEnv.join(', ')}.`,
			);
		}
		test.skip(true, `Set ${missingEnv.join(', ')} to generate authenticated storage state.`);
	}

	const session = await signInWithSupabase(request);
	writeAuthenticatedState(session, getAppOrigin(testInfo));
});
