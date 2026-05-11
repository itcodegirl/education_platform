/* global console */
import { writeSearchManifest, searchManifestPath } from './search-manifest-helpers.mjs';

await writeSearchManifest();
console.log(`Search manifest updated: ${searchManifestPath}`);
