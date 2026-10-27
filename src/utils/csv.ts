import { datasetSchema, type Faculty } from '../types/faculty';
// Nested cells are JSON. Quoting is RFC 4180, including embedded newlines/quotes.
export function writeCSV(rows: Faculty[]) {
  if (!rows.length) return '';
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))] as (keyof Faculty)[];
  const quote = (v: unknown) => {
    const raw = String(v ?? '');
    const safe = /^[\s]*[=+@-]/.test(raw) ? "'" + raw : raw;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return [
    keys.map(quote).join(','),
    ...rows.map((r) =>
      keys.map((k) => quote(typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k])).join(','),
    ),
  ].join('\r\n');
}
export function parseCSV(s: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('Unterminated CSV quotation');
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
export function readCSV(s: string): Faculty[] {
  const [header, ...rows] = parseCSV(s);
  if (!header) return [];
  if (new Set(header).size !== header.length) throw new Error('Duplicate CSV headers');
  return datasetSchema.parse(
    rows.map((row) => {
      if (row.length !== header.length) throw new Error('CSV column count mismatch');
      return Object.fromEntries(
        header.flatMap((k, i) => {
          if (row[i] === '') return [];
          if (/^'[\s]*[=+@-]/.test(row[i])) row[i] = row[i].slice(1);
          let value: unknown = row[i];
          if (/^[\[{]/.test(row[i]) || ['true', 'false'].includes(row[i]))
            value = JSON.parse(row[i]);
          return [[k, value]];
        }),
      );
    }),
  );
}
