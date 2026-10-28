import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadData } from './validate';
import { isActive, normalize } from '../src/utils/search';
const rows = loadData();
const count = (fn: (r: (typeof rows)[number]) => boolean) => rows.filter(fn).length;
const potential_duplicates: { ids: string[]; reason: string }[] = [];
for (let i = 0; i < rows.length; i++)
  for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i],
      b = rows[j];
    const an = normalize(a.full_name)
        .replace(/[^a-z ]/g, '')
        .split(/\s+/),
      bn = normalize(b.full_name)
        .replace(/[^a-z ]/g, '')
        .split(/\s+/);
    const sameName = an[0] === bn[0] && an.at(-1) === bn.at(-1);
    const sameEmail = a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase();
    const sameProfile =
      /\/faculty\/[^/#]+\/$/.test(a.official_profile_url) &&
      a.official_profile_url === b.official_profile_url;
    if (sameName || sameEmail || sameProfile)
      potential_duplicates.push({
        ids: [a.id, b.id],
        reason: sameEmail
          ? 'Same professional email'
          : sameProfile
            ? 'Same individual profile URL'
            : 'Same first and last name',
      });
  }
const report = {
  generated: new Date().toISOString(),
  total: rows.length,
  current_regular_and_teaching: count(isActive),
  departments: Object.fromEntries(
    [...new Set(rows.map((r) => r.primary_department))].sort().map((d) => [
      d,
      {
        all: count((r) => r.primary_department === d),
        default_visible: count((r) => r.primary_department === d && isActive(r)),
      },
    ]),
  ),
  with_official_profile_url: count((r) => !!r.official_profile_url),
  with_individual_profile_url: count((r) => /\/faculty\/[^/#]+\/$/.test(r.official_profile_url)),
  with_cv: count((r) => !!r.cv_url),
  with_research: count((r) => !!r.research_interests.length),
  with_geography: count(
    (r) => !!(r.geographic_research_countries.length || r.geographic_research_regions.length),
  ),
  with_country: count((r) => !!r.geographic_research_countries.length),
  with_publicly_self_reported_languages: count((r) => !!r.languages.length),
  awaiting_faculty_review: count((r) => r.faculty_review_status !== 'confirmed'),
  potential_duplicates,
  link_checks: existsSync('data/review/link-report.json')
    ? JSON.parse(readFileSync('data/review/link-report.json', 'utf8'))
    : 'Not run',
  limitations:
    'Denominator is collected records, not an independently verified college census. Individual profile detection is a URL-pattern heuristic; official directory/card links are fallbacks. Missing research/languages means unrecorded, never absent.',
};
mkdirSync('data/review', { recursive: true });
writeFileSync('data/review/coverage.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, link_checks: 'See private report' }, null, 2));
