import { describe, it, expect, vi } from 'vitest';
import { datasetSchema, facultySchema } from '../src/types/faculty';
import { filterFaculty, emptyFilters, parseFilters, queryFor } from '../src/utils/search';
import { readCSV, writeCSV } from '../src/utils/csv';
import {
  createWorldProjection,
  createResearchMap,
  TALLAHASSEE,
  WORLD_MAP_WIDTH,
  WORLD_MAP_HEIGHT,
} from '../src/utils/mapProjection';
import { geoPath } from 'd3-geo';

describe('world map framing', () => {
  it('centers Tallahassee exactly without hiding Japan or southern populated land', () => {
    const projection = createWorldProjection();
    const [x, y] = projection(TALLAHASSEE)!;
    expect(x).toBeCloseTo(WORLD_MAP_WIDTH / 2, 8);
    expect(y).toBeCloseTo(WORLD_MAP_HEIGHT / 2, 8);
    const locations: [number, number][] = [
      [139.69, 35.68],
      [77.21, 28.61],
      [-68.3, -54.8],
      [168.35, -46.4],
    ];
    for (const location of locations) {
      const [px, py] = projection(location)!;
      expect(px).toBeGreaterThan(0);
      expect(px).toBeLessThan(WORLD_MAP_WIDTH);
      expect(py).toBeGreaterThan(0);
      expect(py).toBeLessThan(WORLD_MAP_HEIGHT);
    }
  });
  it('restores the research map layout, retaining the Arctic and cropping Antarctica', () => {
    const { projection, height } = createResearchMap();
    const path = geoPath(projection);
    expect(projection([139.69, 35.68])![0]).toBeGreaterThan(WORLD_MAP_WIDTH / 2);
    expect(projection([-84.2807, 30.4383])![0]).toBeLessThan(WORLD_MAP_WIDTH / 2);
    expect(path({ type: 'Point', coordinates: [0, 89] })).not.toBeNull();
    expect(path({ type: 'Point', coordinates: [0, -63] })).toBeNull();
    const south = projection([-68.3, -54.8])!;
    expect(south[1]).toBeLessThan(height);
  });
  it('clips the Antarctic latitude band while retaining a north-up map', () => {
    const projection = createWorldProjection();
    const path = geoPath(projection);
    for (const longitude of [-180, -90, 0, 90, 180]) {
      expect(path({ type: 'Point', coordinates: [longitude, -63] })).toBeNull();
    }
    expect(projection([TALLAHASSEE[0], 50])![1]).toBeLessThan(WORLD_MAP_HEIGHT / 2);
    expect(projection([TALLAHASSEE[0], 0])![1]).toBeGreaterThan(WORLD_MAP_HEIGHT / 2);
  });
});
// Fictional fixtures stay in tests, never in data/public or the production bundle.
const fields = [
  'full_name',
  'academic_title',
  'primary_department',
  'appointment_type',
  'current_affiliation_status',
  'official_profile_url',
  'research_interests',
  'methodological_expertise',
  'geographic_research_countries',
  'geographic_research_regions',
  'languages',
  'short_biography',
];
const base = {
  id: 'fictional-test-one',
  full_name: 'Fictional Élise Test',
  academic_title: 'Test Professor',
  primary_department: 'Political Science',
  additional_affiliations: [],
  appointment_type: 'regular',
  current_affiliation_status: 'current',
  official_profile_url: 'https://example.org/faculty',
  research_interests: ['Migration'],
  methodological_expertise: ['Survey experiments'],
  geographic_research_countries: [{ code: 'JP', name: 'Japan' }],
  geographic_research_regions: ['East Asia'],
  languages: [
    {
      code: 'fr',
      language: 'French',
      speaking_proficiency: 'Fluent / Professional',
      reading_proficiency: 'Not specified',
      writing_proficiency: 'Not specified',
      verification_source: 'https://example.org/consent',
      faculty_confirmed: true,
      publication_approved: true,
      approval_date: '2026-10-27',
    },
  ],
  sources: [
    {
      url: 'https://example.org/faculty',
      accessed: '2026-10-27',
      fields,
      evidence: 'Fictional test fixture.',
      extraction: 'agent_reviewed',
    },
  ],
  last_updated: '2026-10-27',
  last_verified: '2026-10-27',
  verification_status: 'source_verified',
  faculty_review_status: 'not_requested',
  publication_status: 'public',
};
const a = facultySchema.parse(base),
  b = facultySchema.parse({
    ...base,
    id: 'fictional-test-two',
    full_name: 'Fictional Second Test',
    primary_department: 'Sociology',
    geographic_research_countries: [],
    geographic_research_regions: [],
    languages: [],
  });
describe('directory search', () => {
  it('matches accent-insensitive name and ignores case', () =>
    expect(filterFaculty([a, b], { ...emptyFilters, q: 'ELISE' })).toEqual([a]));
  it('matches country names as text', () =>
    expect(filterFaculty([a, b], { ...emptyFilters, q: 'Japan' })).toEqual([a]));
  it.each([
    ['country', ['JP']],
    ['region', ['East Asia']],
    ['department', ['Political Science']],
    ['language', ['fr']],
  ] as const)('filters %s', (key, value) =>
    expect(filterFaculty([a, b], { ...emptyFilters, [key]: [...value] })).toEqual([a]),
  );
  it('uses OR within categories and AND between categories', () => {
    expect(
      filterFaculty([a, b], {
        ...emptyFilters,
        department: ['Political Science', 'Sociology'],
        country: ['JP'],
      }),
    ).toEqual([a]);
    expect(
      filterFaculty([a, b], { ...emptyFilters, department: ['Sociology'], country: ['JP'] }),
    ).toEqual([]);
  });
  it('matches topics and methods together', () =>
    expect(
      filterFaculty([a, b], {
        ...emptyFilters,
        topic: ['Migration'],
        method: ['Survey experiments'],
      }),
    ).toHaveLength(2));
  it('does not interpret missing fields as a match', () =>
    expect(filterFaculty([b], { ...emptyFilters, language: ['fr'] })).toEqual([]));
  it('keeps upcoming, unknown and visiting out of defaults', () => {
    const pending = { ...a, current_affiliation_status: 'upcoming' as const };
    const visitor = { ...b, appointment_type: 'visiting' as const };
    expect(filterFaculty([pending, visitor], emptyFilters)).toEqual([]);
    expect(
      filterFaculty([pending, visitor], { ...emptyFilters, appointments: 'all' }),
    ).toHaveLength(2);
  });
  it('round trips repeated query parameters', () => {
    const f = {
      ...emptyFilters,
      q: 'Élise & Japan',
      department: ['Political Science', 'Sociology'],
      country: ['JP', 'KR'],
    };
    expect(parseFilters(new URLSearchParams(queryFor(f).slice(1)))).toEqual(f);
  });
});
describe('publication gate', () => {
  it('accepts China with different browser locale labels while rejecting wrong names', () => {
    const original = Intl.DisplayNames.prototype.of;
    const localeName = vi.spyOn(Intl.DisplayNames.prototype, 'of').mockImplementation(function (
      this: Intl.DisplayNames,
      code: string,
    ) {
      return code === 'CN' ? 'China mainland' : original.call(this, code);
    });
    try {
      expect(() =>
        facultySchema.parse({ ...a, geographic_research_countries: [{ code: 'CN', name: 'China' }] }),
      ).not.toThrow();
      expect(() =>
        facultySchema.parse({ ...a, geographic_research_countries: [{ code: 'CN', name: 'Japan' }] }),
      ).toThrow();
    } finally {
      localeName.mockRestore();
    }
  });
  it('rejects duplicate IDs and normalized names', () => {
    expect(() => datasetSchema.parse([a, a])).toThrow(/Duplicate/);
    expect(() =>
      datasetSchema.parse([a, { ...a, id: 'other', full_name: 'Fictional Elise Test' }]),
    ).toThrow(/Duplicate/);
  });
  it('rejects invalid and mismatched country codes', () => {
    expect(() =>
      facultySchema.parse({ ...a, geographic_research_countries: [{ code: 'XX', name: 'Japan' }] }),
    ).toThrow();
    expect(() =>
      facultySchema.parse({ ...a, geographic_research_countries: [{ code: 'KR', name: 'Japan' }] }),
    ).toThrow();
  });
  it('rejects duplicate geography and mismatched language names', () => {
    expect(() =>
      facultySchema.parse({
        ...a,
        geographic_research_countries: [
          ...a.geographic_research_countries,
          ...a.geographic_research_countries,
        ],
      }),
    ).toThrow();
    expect(() =>
      facultySchema.parse({ ...a, languages: [{ ...a.languages[0], language: 'Korean' }] }),
    ).toThrow();
  });
  it('rejects unknown/private fields', () =>
    expect(() => facultySchema.parse({ ...a, internal_notes: 'Never publish' })).toThrow());
  it('rejects unsupported public claims', () =>
    expect(() => facultySchema.parse({ ...a, sources: [] })).toThrow());
  it('does not promote automatic extraction without review', () => {
    expect(() =>
      facultySchema.parse({
        ...a,
        sources: a.sources.map((s) => ({ ...s, extraction: 'automatic' })),
      }),
    ).toThrow();
    expect(() =>
      facultySchema.parse({
        ...a,
        sources: a.sources.map((s) => ({ ...s, extraction: 'automatic', reviewed_by: 'agent' })),
      }),
    ).not.toThrow();
  });
  it('requires BOTH language confirmation and publication consent', () => {
    for (const key of ['faculty_confirmed', 'publication_approved'])
      expect(() =>
        facultySchema.parse({ ...a, languages: [{ ...a.languages[0], [key]: false }] }),
      ).toThrow();
  });
  it('rejects invalid languages and unsafe URLs', () => {
    expect(() =>
      facultySchema.parse({ ...a, languages: [{ ...a.languages[0], code: 'xxx' }] }),
    ).toThrow();
    expect(() =>
      facultySchema.parse({ ...a, official_profile_url: 'javascript:alert(1)' }),
    ).toThrow();
  });
  it('rejects unresolved records in public verification status', () =>
    expect(() => facultySchema.parse({ ...a, verification_status: 'pending_review' })).toThrow());
});
describe('CSV interchange', () => {
  it('round trips nested data, commas, quotes, newlines and optional fields', () => {
    const extra = { ...b, short_biography: 'Study of "migration",\nacross borders.' };
    expect(readCSV(writeCSV([a, extra]))).toEqual([a, extra]);
  });
  it('neutralizes spreadsheet formulas while preserving round trips', () => {
    const record = { ...a, short_biography: '=1+1' };
    expect(writeCSV([record])).toContain("'=1+1");
    expect(readCSV(writeCSV([record]))).toEqual([record]);
  });
  it('refuses malformed CSV and unknown columns', () => {
    expect(() => readCSV('"broken')).toThrow();
    expect(() => readCSV('id,private\na,b')).toThrow();
  });
});
