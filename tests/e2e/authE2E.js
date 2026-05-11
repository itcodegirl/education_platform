import fs from 'node:fs';
import path from 'node:path';

export const requiredAuthEnv = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_EMAIL',
  'E2E_PASSWORD',
];

export const authDir = path.join(process.cwd(), 'playwright', '.auth');
export const authFile = path.join(authDir, 'user.json');
const authStatusFile = path.join(authDir, 'status.json');

export function getMissingAuthEnv() {
  return requiredAuthEnv.filter((name) => !process.env[name]);
}

export function writeEmptyAuthState() {
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }, null, 2));
}

export function markAuthReady() {
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(authStatusFile, JSON.stringify({ ok: true, reason: null }, null, 2));
}

export function markAuthUnavailable(reason) {
  writeEmptyAuthState();
  fs.writeFileSync(authStatusFile, JSON.stringify({ ok: false, reason }, null, 2));
}

export function getAuthSkipReason() {
  const missingEnv = getMissingAuthEnv();
  if (missingEnv.length > 0) {
    return `Set ${missingEnv.join(', ')} to enable authenticated E2E coverage.`;
  }

  if (!fs.existsSync(authStatusFile)) {
    return null;
  }

  try {
    const status = JSON.parse(fs.readFileSync(authStatusFile, 'utf8'));
    return status?.ok === false
      ? status.reason || 'Authenticated E2E setup did not complete.'
      : null;
  } catch {
    return 'Authenticated E2E setup status could not be read.';
  }
}
