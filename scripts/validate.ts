import { readFileSync } from 'node:fs';
import { validateUnitMembership } from '../src/utils/units';
import { datasetSchema } from '../src/types/faculty';
export const loadData = () => {
  const rows = datasetSchema.parse(JSON.parse(readFileSync('data/public/faculty.json', 'utf8')));
  validateUnitMembership(rows);
  return rows;
};
if (process.argv[1]?.endsWith('validate.ts')) {
  const rows = loadData();
  if (!rows.length) throw new Error('Production dataset cannot be empty');
  console.log(
    `Validated ${rows.length} public records, source evidence, strict fields, country codes and language provenance.`,
  );
}
