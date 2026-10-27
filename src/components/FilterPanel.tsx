import { researchRegions } from '../utils/geography';
import type { Faculty } from '../types/faculty';
import type { Filters } from '../utils/search';
type FilterKey = 'department' | 'country' | 'region' | 'language' | 'topic' | 'method';
export function FilterPanel({
  rows,
  filters,
  onChange,
}: {
  rows: Faculty[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const unique = (xs: string[]) => [...new Set(xs)].sort().map((s) => [s, s]);
  const countries = [
    ...new Map(
      rows.flatMap((r) => r.geographic_research_countries.map((c) => [c.code, c.name] as const)),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const languages = [
    ...new Map(
      rows.flatMap((r) => r.languages.map((l) => [l.code, l.language] as const)),
    ).entries(),
  ];
  const groups: [FilterKey, string, string[][]][] = [
    [
      'department',
      'Department',
      unique(rows.flatMap((r) => [r.primary_department, ...r.additional_affiliations])),
    ],
    ['country', 'Country studied', countries],
    ['region', 'Research region', unique(rows.flatMap(researchRegions))],
    ['language', 'Languages', languages],
    ['topic', 'Research topic', unique(rows.flatMap((r) => r.research_interests))],
    ['method', 'Research method', unique(rows.flatMap((r) => r.methodological_expertise))],
  ];
  return (
    <aside className="filters" aria-label="Faculty filters">
      <div className="filter-heading">
        <h2>Refine your search</h2>
        <span aria-hidden="true">≡</span>
      </div>
      <p className="filter-help">
        Match any choice within a group,
        <br />
        and every group you select.
      </p>
      {groups.map(([key, label, options]) => (
        <details
          key={key}
          open={['department', 'country', 'region'].includes(key) || filters[key].length > 0}
        >
          <summary>
            {label}
            {filters[key].length > 0 && <span className="filter-count">{filters[key].length}</span>}
          </summary>
          <fieldset>
            <legend className="sr-only">{label}</legend>
            {options.length ? (
              <div className="filter-options">
                {options.map(([value, name]) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={filters[key].includes(value)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          [key]: filters[key].includes(value)
                            ? filters[key].filter((x) => x !== value)
                            : [...filters[key], value],
                        })
                      }
                    />
                    <span>
                      {key === 'department' && name === 'Unknown' ? 'Other faculty listings' : name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted small">
                Language options will appear here as faculty choose to share them.
              </p>
            )}
          </fieldset>
        </details>
      ))}
      <label className="appointment-toggle">
        <input
          type="checkbox"
          checked={filters.appointments === 'all'}
          onChange={(e) =>
            onChange({ ...filters, appointments: e.target.checked ? 'all' : 'current' })
          }
        />
        <span>Include additional appointments and affiliations</span>
      </label>
    </aside>
  );
}
