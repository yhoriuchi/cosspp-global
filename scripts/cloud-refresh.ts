import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { datasetSchema, type Faculty } from '../src/types/faculty';

// Runs in a fresh, trusted CI job, never in the agent's working directory.
export function checkRefresh(before: Faculty[], input: unknown, today: string) {
  const after = datasetSchema.parse(input);
  const originals = new Map(before.map((person) => [person.id, person]));
  const ids = new Set(after.map((person) => person.id));
  if (!after.length || before.some((person) => !ids.has(person.id)))
    throw new Error('Automatic refresh cannot remove people or change stable IDs');
  let changed = 0;
  for (const person of after) {
    const previous = originals.get(person.id);
    if (isDeepStrictEqual(previous, person)) continue;
    changed++;
    if (person.last_updated !== today || person.last_verified !== today)
      throw new Error(`${person.id}: changed records need current review dates`);
    if (
      person.verification_status !== 'source_verified' ||
      person.faculty_review_status !== 'not_requested'
    )
      throw new Error(`${person.id}: automated changes cannot claim faculty confirmation`);
    for (const [field, value] of Object.entries(person)) {
      if (
        [
          'id',
          'sources',
          'last_updated',
          'last_verified',
          'verification_status',
          'faculty_review_status',
          'publication_status',
        ].includes(field)
      )
        continue;
      if (previous && isDeepStrictEqual(value, previous[field as keyof Faculty])) continue;
      if (!previous && Array.isArray(value) && value.length === 0) continue;
      // Even clearing a field needs evidence; an unavailable page is not a correction.
      if (
        !person.sources.some(
          (source) =>
            source.fields.includes(field) &&
            source.accessed === today &&
            source.retrieval === 'direct' &&
            source.extraction === 'agent_reviewed' &&
            source.reviewed_by === 'agent',
        )
      )
        throw new Error(`${person.id}: ${field} needs fresh, directly reviewed evidence`);
    }
    for (const language of person.languages) {
      if (previous?.languages.some((old) => isDeepStrictEqual(old, language))) continue;
      if (
        language.verified_on !== today ||
        !person.sources.some(
          (source) =>
            source.url === language.verification_source &&
            source.fields.includes('languages') &&
            source.accessed === today &&
            source.retrieval === 'direct' &&
            source.extraction === 'agent_reviewed' &&
            source.reviewed_by === 'agent',
        )
      )
        throw new Error(
          `${person.id}: changed language needs fresh, directly reviewed self-report evidence`,
        );
    }
    if (person.sources.some((source) => source.accessed > today))
      throw new Error(`${person.id}: future source date`);
    if (previous) {
      for (const field of Object.keys(previous)) {
        if (!(field in person))
          throw new Error(`${person.id}: automatic refresh cannot drop ${field}`);
      }
    }
  }
  if (changed > 30)
    throw new Error('More than 30 changed profiles: review the batch before promotion');
  return { after, changed };
}

if (process.argv[1]?.endsWith('cloud-refresh.ts')) {
  const path = process.argv[2];
  if (!path) throw new Error('Provide the candidate JSON path');
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.size > 5_000_000) throw new Error('Invalid candidate file');
  const before = datasetSchema.parse(JSON.parse(readFileSync('data/public/faculty.json', 'utf8')));
  const { after, changed } = checkRefresh(
    before,
    JSON.parse(readFileSync(path, 'utf8')),
    new Date().toISOString().slice(0, 10),
  );
  if (changed) {
    // Keep original row order so the Git diff isolates real changes.
    const byId = new Map(after.map((person) => [person.id, person]));
    const ordered = before.map((person) => byId.get(person.id)!);
    const existing = new Set(before.map((person) => person.id));
    ordered.push(...after.filter((person) => !existing.has(person.id)));
    writeFileSync('data/public/faculty.json', JSON.stringify(ordered, null, 2) + '\n');
    const inventory = new Map<
      string,
      {
        url: string;
        access_dates: Set<string>;
        retrieval_methods: Set<string>;
        faculty_ids: Set<string>;
      }
    >();
    for (const person of ordered)
      for (const source of person.sources) {
        const item = inventory.get(source.url) ?? {
          url: source.url,
          access_dates: new Set<string>(),
          retrieval_methods: new Set<string>(),
          faculty_ids: new Set<string>(),
        };
        item.access_dates.add(source.accessed);
        item.retrieval_methods.add(source.retrieval);
        item.faculty_ids.add(person.id);
        inventory.set(source.url, item);
      }
    writeFileSync(
      'data/sources/inventory.json',
      JSON.stringify(
        [...inventory.values()]
          .sort((a, b) => a.url.localeCompare(b.url))
          .map((item) => ({
            url: item.url,
            access_dates: [...item.access_dates].sort(),
            retrieval_methods: [...item.retrieval_methods].sort(),
            faculty_ids: [...item.faculty_ids].sort(),
          })),
        null,
        2,
      ) + '\n',
    );
  }
  console.log(`Cloud refresh: ${changed} changed profiles; ${after.length} total.`);
}
