import type { Faculty } from '../types/faculty';
export type Filters = {
  q: string;
  department: string[];
  country: string[];
  region: string[];
  language: string[];
  topic: string[];
  method: string[];
  appointments: string;
  sort: string;
};
export const emptyFilters: Filters = {
  q: '',
  department: [],
  country: [],
  region: [],
  language: [],
  topic: [],
  method: [],
  appointments: 'current',
  sort: 'name',
};
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
export function parseFilters(params: URLSearchParams): Filters {
  return {
    ...emptyFilters,
    q: params.get('q') || '',
    department: params.getAll('department'),
    country: params.getAll('country'),
    region: params.getAll('region'),
    language: params.getAll('language'),
    topic: params.getAll('topic'),
    method: params.getAll('method'),
    appointments: params.get('appointments') === 'all' ? 'all' : 'current',
    sort: params.get('sort') === 'department' ? 'department' : 'name',
  };
}
export function queryFor(f: Partial<Filters>, page = 'directory') {
  const p = new URLSearchParams({ page });
  for (const [k, v] of Object.entries(f)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else if (v) p.set(k, v);
  }
  return `?${p}`;
}
const match = (chosen: string[], values: string[]) =>
  chosen.length === 0 || chosen.some((x) => values.includes(x));
export const isActive = (r: Faculty) =>
  r.current_affiliation_status === 'current' &&
  ['regular', 'teaching'].includes(r.appointment_type);
export function filterFaculty(rows: Faculty[], f: Filters) {
  return rows
    .filter((r) => {
      const haystack = normalize(
        [
          r.full_name,
          r.primary_department,
          ...r.additional_affiliations,
          ...r.research_interests,
          ...r.methodological_expertise,
          ...r.research_keywords,
          ...r.geographic_research_countries.map((c) => c.name),
          ...r.geographic_research_regions,
          ...r.languages.map((l) => l.language),
          r.short_biography || '',
        ].join(' '),
      );
      return (
        (f.appointments === 'all' || isActive(r)) &&
        normalize(f.q)
          .trim()
          .split(/\s+/)
          .every((w) => haystack.includes(w)) &&
        match(f.department, [r.primary_department, ...r.additional_affiliations]) &&
        match(
          f.country,
          r.geographic_research_countries.map((c) => c.code),
        ) &&
        match(f.region, r.geographic_research_regions) &&
        match(
          f.language,
          r.languages.map((l) => l.code),
        ) &&
        match(f.topic, r.research_interests) &&
        match(f.method, r.methodological_expertise)
      );
    })
    .sort((a, b) =>
      f.sort === 'department'
        ? a.primary_department.localeCompare(b.primary_department) ||
          a.full_name.localeCompare(b.full_name)
        : a.full_name.localeCompare(b.full_name),
    );
}
