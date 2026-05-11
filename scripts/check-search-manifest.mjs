/* global console, process */
import fs from 'node:fs/promises';
import { buildSearchManifestSource, searchManifestPath } from './search-manifest-helpers.mjs';

const actualSource = await fs.readFile(searchManifestPath, 'utf8').catch(() => null);
const expectedSource = await buildSearchManifestSource();

if (actualSource !== expectedSource) {
  console.error('Search manifest is stale. Run `npm run generate:search-manifest` and commit the updated file.');
  process.exit(1);
}

console.log('Search manifest is current.');
