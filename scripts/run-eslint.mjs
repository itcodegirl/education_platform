/* global console, process */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const eslintArgs = process.argv.slice(2);

function resolveEslintCli() {
  const packageJsonPath = require.resolve('eslint/package.json');
  const cliPath = path.join(path.dirname(packageJsonPath), 'bin', 'eslint.js');
  if (existsSync(cliPath)) return cliPath;
  throw new Error('Could not resolve eslint/bin/eslint.js.');
}

const child = spawn(process.execPath, [resolveEslintCli(), ...eslintArgs], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }

  process.exit(code ?? 0);
});
