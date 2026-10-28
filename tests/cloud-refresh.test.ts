import { describe, expect, it } from 'vitest';
import { datasetSchema } from '../src/types/faculty';
import { checkRefresh } from '../scripts/cloud-refresh';

// Fictional record; never exported to the public dataset.
const today = '2026-10-27';
function fixture() {
  const row = {
    id: 'example-researcher',
    full_name: 'Example Researcher',
    academic_title: 'Professor',
    primary_department: 'Example Department',
    additional_affiliations: [],
    appointment_type: 'regular',
    current_affiliation_status: 'current',
    official_profile_url: 'https://example.edu/profile',
    research_interests: ['Urban policy'],
    methodological_expertise: [],
    geographic_research_countries: [],
    geographic_research_regions: [],
    languages: [],
    last_updated: '2026-10-20',
    last_verified: '2026-10-20',
    verification_status: 'source_verified',
    faculty_review_status: 'not_requested',
    publication_status: 'public',
    sources: [
      {
        url: 'https://example.edu/profile',
        accessed: '2026-10-20',
        fields: [
          'full_name',
          'academic_title',
          'primary_department',
          'appointment_type',
          'current_affiliation_status',
          'official_profile_url',
          'research_interests',
        ],
        evidence: 'Fictional fixture for validation.',
        extraction: 'agent_reviewed',
        reviewed_by: 'agent',
        retrieval: 'direct',
      },
    ],
  };
  return datasetSchema.parse([row]);
}
function change() {
  const rows = fixture();
  rows[0].research_interests = ['Urban policy', 'Transportation'];
  rows[0].last_updated = today;
  rows[0].last_verified = today;
  rows[0].sources.push({
    ...rows[0].sources[0],
    accessed: today,
    fields: ['research_interests'],
    evidence: 'Explicitly lists transportation research.',
  });
  return rows;
}
describe('cloud data promotion', () => {
  it('accepts no change and a freshly reviewed substantive change', () => {
    expect(checkRefresh(fixture(), fixture(), today).changed).toBe(0);
    expect(checkRefresh(fixture(), change(), today).changed).toBe(1);
  });
  it('rejects record deletion and replacement IDs', () => {
    expect(() => checkRefresh(fixture(), [], today)).toThrow(/remove/);
    const rows = change();
    rows[0].id = 'changed-id';
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/stable IDs/);
  });
  it('requires fresh direct evidence even for clearing a substantive field', () => {
    const rows = change();
    rows[0].research_interests = [];
    rows[0].sources.pop();
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/fresh/);
    const indexed = change();
    indexed[0].sources[1].retrieval = 'search_index';
    expect(() => checkRefresh(fixture(), indexed, today)).toThrow(/directly/);
  });
  it('rejects artificial faculty confirmation and stale review dates', () => {
    const rows = change();
    rows[0].faculty_review_status = 'confirmed';
    rows[0].verification_status = 'faculty_confirmed';
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/faculty confirmation/);
    const stale = change();
    stale[0].last_verified = '2026-10-20';
    expect(() => checkRefresh(fixture(), stale, today)).toThrow(/current review/);
  });
  it('accepts directly reviewed public self-report and rejects stale or indexed language evidence', () => {
    const rows = change();
    rows[0].languages = [
      {
        code: 'en',
        language: 'English',
        speaking_proficiency: 'Not specified',
        reading_proficiency: 'Not specified',
        writing_proficiency: 'Not specified',
        verification_source: 'https://example.edu/profile',
        evidence_type: 'public_profile',
        source_statement: 'English',
        verified_on: today,
      },
    ];
    rows[0].sources[1].fields.push('languages');
    expect(checkRefresh(fixture(), rows, today).changed).toBe(1);
    rows[0].sources[1].retrieval = 'search_index';
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/directly/);
    rows[0].sources[1].retrieval = 'direct';
    rows[0].sources[1].accessed = '2026-10-20';
    rows[0].languages[0].verified_on = '2026-10-20';
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/fresh/);
  });
  it('rejects fabricated future access dates and unexpected fields', () => {
    const rows = change();
    rows[0].sources[0].accessed = '2030-01-01';
    expect(() => checkRefresh(fixture(), rows, today)).toThrow(/future/);
    expect(() =>
      checkRefresh(fixture(), [{ ...change()[0], citizenship: 'Example' }], today),
    ).toThrow();
  });
});
