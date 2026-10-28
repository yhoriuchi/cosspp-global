import { researchRegions, regionsForCountry } from '../utils/geography';
import { units, unitGroups, unitLabel } from '../utils/units';
import type { Faculty } from '../types/faculty';
import { reconcileGeography, type Filters } from '../utils/search';
type FilterKey = 'department' | 'country' | 'region' | 'language';
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
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const groups: [FilterKey, string, string[][]][] = [
    [
      'department',
      'Unit',
      unique(
        rows
          .flatMap((r) => [r.primary_department, ...r.additional_affiliations])
          .filter((unit) => unit !== 'Unknown'),
      ),
    ],
    [
      'country',
      'Country',
      countries.filter(
        ([code]) =>
          !filters.region.length ||
          filters.region.some((region) => regionsForCountry(code).some((r) => r === region)),
      ),
    ],
    ['region', 'Region', unique(rows.flatMap(researchRegions))],
    ['language', 'Language', languages],
  ];
  return (
    <section className="filters" aria-label="Faculty filters">
      <div className="filter-selects">
        {groups.map(([key, label, options]) => (
          <label key={key}>
            <span>{label}</span>
            <select
              value={filters[key].length > 1 ? '__multiple__' : filters[key][0] || ''}
              disabled={key === 'region' && filters.country.length === 1}
              aria-describedby={
                key === 'region' && filters.country.length === 1 ? 'region-country-hint' : undefined
              }
              onChange={(e) =>
                onChange(
                  reconcileGeography({ ...filters, [key]: e.target.value ? [e.target.value] : [] }),
                )
              }
            >
              <option value="">All</option>
              {filters[key].length > 1 && (
                <option value="__multiple__" disabled>
                  {filters[key].length} selected
                </option>
              )}
              {key === 'department'
                ? unitGroups.map((group) => {
                    const available = units.filter(
                      (unit) =>
                        unit.group === group && options.some(([value]) => value === unit.key),
                    );
                    return available.length ? (
                      <optgroup label={group} key={group}>
                        {available.map((unit) => (
                          <option key={unit.key} value={unit.key}>
                            {unitLabel(unit.key)}
                          </option>
                        ))}
                      </optgroup>
                    ) : null;
                  })
                : options.map(([value, name]) => (
                    <option key={value} value={value}>
                      {name}
                    </option>
                  ))}
            </select>
          </label>
        ))}
      </div>
      {filters.country.length === 1 && (
        <p id="region-country-hint" className="small muted">
          Region is set by Country. Choose All under Country to change the region.
        </p>
      )}
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
    </section>
  );
}
