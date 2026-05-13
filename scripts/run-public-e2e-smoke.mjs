/* global console, process, setTimeout */
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';

const PUBLIC_SMOKE_SPECS = Object.freeze([
  'tests/e2e/accessibility.smoke.spec.js',
  'tests/e2e/auth.smoke.spec.js',
  'tests/e2e/public-learning-entry.spec.js',
]);

const PUBLIC_SMOKE_PROJECTS = Object.freeze([
  'chromium',
  'mobile-chrome',
]);

const HOST = '127.0.0.1';
const DEFAULT_PORT = Number(process.env.PUBLIC_E2E_PORT || 4319);

function normalizeEnv(env) {
  if (process.platform !== 'win32') return env;

  const normalized = {};
  const seen = new Set();
  Object.keys(env)
    .sort()
    .forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (seen.has(lowerKey)) return;
      seen.add(lowerKey);
      normalized[key] = env[key];
    });

  return normalized;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: normalizeEnv(process.env),
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });

    child.on('error', (error) => {
      resolve({ status: 1, error });
    });

    child.on('exit', (status, signal) => {
      resolve({ status: status ?? 1, signal });
    });
  });
}

function quoteWindowsArg(arg) {
  if (!/[\s"]/u.test(arg)) return arg;
  return `"${arg.replaceAll('"', '\\"')}"`;
}

function getShellCommand(command, args) {
  if (process.platform !== 'win32') {
    return { command, args };
  }

  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')],
  };
}

function waitForUrl(url, { timeoutMs = 120_000, intervalMs = 500 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }

        setTimeout(attempt, intervalMs);
      });

      request.setTimeout(intervalMs, () => {
        request.destroy();
      });
    };

    attempt();
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, HOST);
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset < 50; offset += 1) {
    const candidate = startPort + offset;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No available local port found starting at ${startPort}.`);
}

function stopProcessTree(child) {
  if (!child?.pid || child.exitCode !== null) return Promise.resolve();

  if (process.platform === 'win32') {
    return runCommand('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  }

  child.kill('SIGTERM');
  return Promise.resolve();
}

async function startViteServer(port) {
  const baseURL = `http://${HOST}:${port}`;
  const serverCommand = getShellCommand(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'run',
    'dev',
    '--',
    '--host',
    HOST,
    '--port',
    String(port),
    '--strictPort',
  ]);
  const child = spawn(serverCommand.command, serverCommand.args, {
    cwd: process.cwd(),
    env: normalizeEnv({
      ...process.env,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'example-anon-key',
    }),
    stdio: 'inherit',
    windowsHide: true,
  });

  child.on('error', (error) => {
    console.error(error);
  });

  await waitForUrl(baseURL);
  return { baseURL, child };
}

async function runPlaywright(baseURL, projectName) {
  const playwrightCommand = getShellCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
    'playwright',
    'test',
    ...PUBLIC_SMOKE_SPECS,
    `--project=${projectName}`,
    '--reporter=list',
    '--workers=1',
    '--timeout=90000',
  ]);
  return runCommand(playwrightCommand.command, playwrightCommand.args, {
    env: normalizeEnv({
      ...process.env,
      PLAYWRIGHT_BASE_URL: baseURL,
      PLAYWRIGHT_DISABLE_ARTIFACTS: '1',
    }),
  });
}

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

try {
  let status = 0;

  for (const projectName of PUBLIC_SMOKE_PROJECTS) {
    let serverProcess;
    let baseURL = externalBaseURL;

    try {
      if (!externalBaseURL) {
        const port = await findAvailablePort(DEFAULT_PORT);
        const managedServer = await startViteServer(port);
        baseURL = managedServer.baseURL;
        serverProcess = managedServer.child;
      }

      const result = await runPlaywright(baseURL, projectName);
      if (result.error) {
        console.error(result.error);
      }

      status = result.status;
    } finally {
      if (serverProcess) {
        await stopProcessTree(serverProcess);
      }
    }

    if (status !== 0) break;
  }

  process.exitCode = status;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  const forcedExitTimer = setTimeout(() => {
    process.exit(process.exitCode || 0);
  }, 100);
  forcedExitTimer.unref?.();
}
