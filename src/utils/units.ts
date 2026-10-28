import type { Faculty } from '../types/faculty';

// Organization categories reviewed against official FSU pages on 2026-10-27.
// Data keys and department URL parameters remain stable for existing links.
export const unitGroups = [
  'Departments & school',
  'Programs',
  'COSSPP centers, institutes & lab',
  'Other FSU affiliations',
] as const;
export const units: {
  key: string;
  label: string;
  group: (typeof unitGroups)[number];
  source_url: string;
  parent?: string;
}[] = [
  {
    key: 'Economics',
    label: 'Economics',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Geography',
    label: 'Geography',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Political Science',
    label: 'Political Science',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Public Administration and Policy',
    label: 'Askew School of Public Administration and Policy',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Sociology',
    label: 'Sociology',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Urban and Regional Planning',
    label: 'Urban and Regional Planning',
    group: 'Departments & school',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'African American Studies',
    label: 'African American Studies',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Emergency Management and Homeland Security',
    label: 'Emergency Management and Homeland Security',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Integrated Studies',
    label: 'Integrated Studies',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/integratedstudies/',
    parent: 'Interdisciplinary Social Science',
  },
  {
    key: 'Interdisciplinary Social Science',
    label: 'Interdisciplinary Social Science',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'International Affairs',
    label: 'International Affairs',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Public Health',
    label: 'Public Health',
    group: 'Programs',
    source_url: 'https://cosspp.fsu.edu/departments-and-programs/',
  },
  {
    key: 'Center for Demography and Population Health',
    label: 'Center for Demography and Population Health',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Center for Disaster Risk Policy',
    label: 'Center for Disaster Risk Policy',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Claude Pepper Center',
    label: 'Claude Pepper Center',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'DeVoe L. Moore Institute',
    label: 'DeVoe L. Moore Institute',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Gus A. Stavros Center',
    label: 'Gus A. Stavros Center',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Pepper Institute on Aging and Public Policy',
    label: 'Pepper Institute on Aging and Public Policy',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Spatial Data Science Center',
    label: 'Spatial Data Science Center',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
  },
  {
    key: 'Sustainability and Governance Lab',
    label: 'Sustainability and Governance Lab',
    group: 'COSSPP centers, institutes & lab',
    source_url: 'https://cosspp.fsu.edu/sglab/',
  },
  {
    key: 'Center for Global Engagement',
    label: 'Center for Global Engagement',
    group: 'Other FSU affiliations',
    source_url: 'https://cge.fsu.edu/about-us/cge-staff',
  },
  {
    key: 'FSU College of Law',
    label: 'FSU College of Law',
    group: 'Other FSU affiliations',
    source_url: 'https://cosspp.fsu.edu/polisci/faculty/ryan-owens/',
  },
  {
    key: 'Institute for Successful Longevity',
    label: 'Institute for Successful Longevity',
    group: 'Other FSU affiliations',
    source_url: 'https://isl.fsu.edu/',
  },
  {
    key: 'Native American and Indigenous Studies Center',
    label: 'Native American and Indigenous Studies Center',
    group: 'Other FSU affiliations',
    source_url: 'https://nais.fsu.edu/',
  },
];
units.push({
  key: 'LeRoy Collins Institute',
  label: 'LeRoy Collins Institute',
  group: 'COSSPP centers, institutes & lab',
  source_url: 'https://cosspp.fsu.edu/centers-and-institutes/',
});
const byKey = new Map(units.map((unit) => [unit.key, unit]));
export const unitLabel = (key: string) => byKey.get(key)?.label || key;
export function facultyUnits(
  person: Pick<Faculty, 'primary_department' | 'additional_affiliations'>,
): string[] {
  return [
    ...new Set(
      [person.primary_department, ...person.additional_affiliations].filter(
        (key) => key !== 'Unknown',
      ),
    ),
  ];
}
export function unitCounts(rows: Faculty[]) {
  const counts = new Map<string, number>();
  for (const person of rows)
    for (const key of facultyUnits(person)) counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}
export function validateUnitMembership(rows: Faculty[]) {
  for (const person of rows)
    for (const key of facultyUnits(person)) {
      if (!byKey.has(key)) throw new Error(`${person.id}: unreviewed unit classification ${key}`);
    }
}
