import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadData } from './validate';
import { readCSV, writeCSV } from '../src/utils/csv';
const [mode, path] = process.argv.slice(2);
mkdirSync('data/review', { recursive: true });
if (mode === 'export') {
  const target = path || 'data/review/faculty-export.csv';
  writeFileSync(target, writeCSV(loadData()));
  console.log(
    `Exported public fields to ${target}. Nested cells contain JSON; import treats cells as text, never formulas.`,
  );
} else if (mode === 'import' && path) {
  const rows = readCSV(readFileSync(path, 'utf8'));
  const target = 'data/review/import-candidates.json';
  writeFileSync(target, JSON.stringify(rows, null, 2) + '\n');
  console.log(
    `Validated ${rows.length} candidates at ${target}. Review provenance before manually promoting to public dataset.`,
  );
} else throw new Error('Usage: data:export [path] or data:import path.csv');
