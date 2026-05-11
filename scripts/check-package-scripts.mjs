/* global console, process */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function findMatchingBrace(text, openIndex) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = openIndex; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inString) {
      if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function extractObjectBody(text, objectName) {
  const objectMatch = new RegExp(`"${objectName}"\\s*:\\s*\\{`).exec(text);
  if (!objectMatch) return null;

  const openIndex = objectMatch.index + objectMatch[0].lastIndexOf('{');
  const closeIndex = findMatchingBrace(text, openIndex);
  if (closeIndex === -1) return null;

  return text.slice(openIndex + 1, closeIndex);
}

function findObjectKeys(objectBody) {
  const keys = [];
  const keyPattern = /"((?:\\"|[^"])*)"\s*:/g;
  let match = keyPattern.exec(objectBody);

  while (match) {
    keys.push(match[1].replaceAll('\\"', '"'));
    match = keyPattern.exec(objectBody);
  }

  return keys;
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });

  return [...duplicates].sort((a, b) => a.localeCompare(b));
}

export async function checkPackageScripts(rootDir = process.cwd()) {
  const packagePath = path.join(rootDir, 'package.json');
  const packageText = await readFile(packagePath, 'utf8');
  const scriptsBody = extractObjectBody(packageText, 'scripts');
  const failures = [];

  if (!scriptsBody) {
    failures.push('package.json is missing a scripts object.');
    return { ok: false, failures };
  }

  const scriptNames = findObjectKeys(scriptsBody);
  const duplicateScripts = findDuplicates(scriptNames);
  if (duplicateScripts.length > 0) {
    failures.push(`Duplicate package scripts: ${duplicateScripts.join(', ')}`);
  }

  return {
    ok: failures.length === 0,
    failures,
  };
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const result = await checkPackageScripts();

  if (!result.ok) {
    console.error('Package script audit failed:');
    result.failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('Package script audit passed.');
}
