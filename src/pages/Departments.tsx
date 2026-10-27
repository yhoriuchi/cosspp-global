import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { Link } from '../components/Link';
import { isActive, queryFor } from '../utils/search';
export function Departments({ rows }: { rows: Faculty[] }) {
  const active = rows.filter(isActive);
  const units = [...new Set(rows.map((r) => r.primary_department))].sort();
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
            <h2>{d === 'Unknown' ? 'Other faculty listings' : d}</h2>
            <div>
              <span>
                {active.filter((r) => r.primary_department === d).length}{' '}
                {d === 'Unknown' ? 'faculty profiles' : 'primary appointments'}
              </span>
              <span aria-hidden="true">↗</span>
            </div>
          </Link>
        ))}
      </div>
      <p className="muted">
        Department filters also include documented additional affiliations, so a filtered result may
        include colleagues whose primary appointment is elsewhere.
      </p>
    </>
  );
}
