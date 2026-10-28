import { readFileSync } from 'node:fs';
import { datasetSchema } from '../src/types/faculty';
export const loadData = () =>
  datasetSchema.parse(JSON.parse(readFileSync('data/public/faculty.json', 'utf8')));
if (process.argv[1]?.endsWith('validate.ts')) {
  const rows = loadData();
  if (!rows.length) throw new Error('Production dataset cannot be empty');
  console.log(
    `Validated ${rows.length} public records, source evidence, strict fields, country codes and language provenance.`,
  );
}
