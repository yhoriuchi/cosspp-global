import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { FacultyCard } from '../components/FacultyCard';
import { emptyFilters, filterFaculty, parseFilters, queryFor, type Filters } from '../utils/search';
import { navigate } from '../utils/navigation';
export function Directory({ rows, params }: { rows: Faculty[]; params: URLSearchParams }) {
  const f = parseFilters(params);
  const results = filterFaculty(rows, f);
  const set = (next: Filters) => navigate(queryFor(next), true);
  const hasFilters =
    f.q ||
    Object.entries(f).some(
      ([k, v]) => (Array.isArray(v) && v.length) || (k === 'appointments' && v === 'all'),
    );
  return (
    <>
      <PageHeading eyebrow="THE FACULTY DIRECTORY" title="Find expertise. Make connections.">
        <p>Explore colleagues, research interests, and connections across the college.</p>
      </PageHeading>
      <section className="directory-results" aria-label="Matching faculty">
        <SearchBar value={f.q} onChange={(q) => set({ ...f, q })} />
        <FilterPanel rows={rows} filters={f} onChange={set} />
        <div className="results-toolbar">
          <p role="status" aria-live="polite">
            <strong>{results.length}</strong> faculty{' '}
            {hasFilters ? 'matching your search' : 'in the directory'}
          </p>
          <label>
            Sort by{' '}
            <select value={f.sort} onChange={(e) => set({ ...f, sort: e.target.value })}>
              <option value="name">Name A–Z</option>
              <option value="department">Department</option>
            </select>
          </label>
          <button className="text-button" onClick={() => set({ ...emptyFilters })}>
            Clear filters
          </button>
        </div>
        {hasFilters && (
          <div className="active-filters">
            {(['department', 'country', 'region', 'language', 'topic', 'method'] as const).flatMap(
              (key) =>
                f[key].map((value) => (
                  <button
                    key={`${key}-${value}`}
                    onClick={() => set({ ...f, [key]: f[key].filter((x) => x !== value) })}
                    aria-label={`Remove ${key} filter ${value}`}
                  >
                    {key}:{' '}
                    {key === 'department' && value === 'Unknown' ? 'Other faculty listings' : value}{' '}
                    <span aria-hidden="true">×</span>
                  </button>
                )),
            )}
          </div>
        )}
        <p className="directory-note">
          {f.appointments === 'all'
            ? 'Showing all listed appointment categories and affiliations.'
            : 'Showing current regular and teaching faculty. Use the appointment filter to explore additional listings.'}
        </p>
        {results.length ? (
          <div className="card-grid">
            {results.map((r) => (
              <FacultyCard person={r} key={r.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">◎</span>
            <h2>No results for this search</h2>
            <p>Try another keyword or adjust your filters to explore more profiles.</p>
            <button className="button" onClick={() => set({ ...emptyFilters })}>
              Reset search
            </button>
          </div>
        )}
      </section>
    </>
  );
}
