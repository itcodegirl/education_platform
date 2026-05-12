/* global console, process, setTimeout */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const port = process.env.PLAYWRIGHT_PORT || '4319';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const testArgs = process.argv.slice(2);

function getChildEnv(extra = {}) {
  const env = {};
  const pathValue = process.env.Path || process.env.PATH;

  Object.entries(process.env).forEach(([key, value]) => {
    if (key.toLowerCase() !== 'path') {
      env[key] = value;
    }
  });

  if (pathValue) {
    env.Path = pathValue;
  }

  return { ...env, ...extra };
}

function stopProcessTree(child) {
  if (!child?.pid) return;

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
    return;
  }

  child.kill('SIGTERM');
}

function waitForServer(url, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });

      request.on('error', retry);
      request.setTimeout(5000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      const timer = setTimeout(check, 1000);
      timer.unref?.();
    };

    check();
  });
}

function resolvePlaywrightCli() {
  const packageJsonPath = require.resolve('playwright/package.json');
  const localCli = path.join(path.dirname(packageJsonPath), 'cli.js');
  if (existsSync(localCli)) return localCli;
  throw new Error('Could not resolve playwright/cli.js.');
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 0);
    });
  });
}

async function main() {
  if (testArgs.length === 0) {
    console.error('Usage: node scripts/run-public-playwright.mjs <playwright args...>');
    process.exit(1);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(
    `${npmCommand} run dev -- --host 127.0.0.1 --port ${port}`,
    {
      stdio: 'inherit',
      shell: true,
      env: getChildEnv({ PLAYWRIGHT_PORT: port }),
    },
  );

  let serverExited = false;
  server.on('exit', () => {
    serverExited = true;
  });

  try {
    await waitForServer(baseURL);
    if (serverExited) {
      throw new Error('Dev server exited before Playwright started.');
    }

    const exitCode = await run(process.execPath, [resolvePlaywrightCli(), 'test', ...testArgs], {
      env: getChildEnv({
        PLAYWRIGHT_BASE_URL: baseURL,
        PLAYWRIGHT_PORT: port,
      }),
    });

    stopProcessTree(server);
    process.exit(exitCode);
  } catch (error) {
    console.error(error);
    stopProcessTree(server);
    process.exit(1);
  }
}

await main();
