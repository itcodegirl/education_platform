/* global console, process */
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const roots = ['src', 'scripts', 'tests'];
const ignoredDirectories = new Set(['node_modules', 'dist', 'playwright-report', 'test-results']);
const typeScriptExtensions = new Set(['.ts', '.tsx', '.mts', '.cts']);

function collectTypeScriptFiles(directory, results) {
  if (!fs.existsSync(directory)) return;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      collectTypeScriptFiles(absolutePath, results);
      continue;
    }

    if (typeScriptExtensions.has(path.extname(entry.name))) {
      results.push(path.relative(projectRoot, absolutePath).replace(/\\/g, '/'));
    }
  }
}

const discoveredTypeScriptFiles = [];
roots.forEach((root) => {
  collectTypeScriptFiles(path.join(projectRoot, root), discoveredTypeScriptFiles);
});

if (discoveredTypeScriptFiles.length > 0) {
  console.error('Typecheck guard failed: TypeScript source files are present but no TypeScript compiler is configured yet.');
  discoveredTypeScriptFiles.forEach((file) => {
    console.error(`- ${file}`);
  });
  console.error('Add a real TypeScript toolchain before introducing typed source files.');
  process.exit(1);
}

console.log('Typecheck guard passed: this repository currently ships JavaScript-only source, so there is no TypeScript compiler step to run.');
