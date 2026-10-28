import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { Link } from '../components/Link';
import { isActive, queryFor } from '../utils/search';
export function Departments({ rows }: { rows: Faculty[] }) {
  const active = rows.filter(isActive);
  const browseUnit = (r: Faculty) =>
    r.primary_department !== 'Unknown' ? r.primary_department : r.additional_affiliations[0];
  const units = [...new Set(rows.map(browseUnit).filter((unit): unit is string => !!unit))].sort();
  return (
    <>
      <PageHeading eyebrow="ACROSS DISCIPLINES" title="One college. Many perspectives.">
        <p>
          Browse colleagues by academic unit. Counts show current regular and teaching faculty
          included in this directory.
        </p>
      </PageHeading>
      <div className="department-grid">
        {units.map((d, i) => (
          <Link className="department-card" href={queryFor({ department: [d] })} key={d}>
            <span className="number">{String(i + 1).padStart(2, '0')}</span>
            <h2>{d}</h2>
            <div>
              <span>
                {active.filter((r) => browseUnit(r) === d).length} faculty{' '}
                {active.filter((r) => browseUnit(r) === d).length === 1 ? 'profile' : 'profiles'}
              </span>
              <span aria-hidden="true">↗</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="muted">
        Profiles are grouped by primary appointment, or by a documented affiliation when primary
        placement has not been established. Department filters also include additional affiliations,
        so a filtered result may include colleagues whose primary appointment is elsewhere.
      </p>
    </>
  );
}
