import { buildReferenceData, writeReferenceDataFiles } from './lib/reference-data.mjs';

const referenceData = await buildReferenceData();
await writeReferenceDataFiles(referenceData);

globalThis.console.log(`Generated search manifest with ${referenceData.searchIndex.length} entries.`);
globalThis.console.log(`Generated course catalog with ${referenceData.courseCatalog.length} courses.`);
