import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { Link } from '../components/Link';
import { isActive, queryFor } from '../utils/search';
import { units, unitGroups, unitCounts } from '../utils/units';
export function Departments({ rows }: { rows: Faculty[] }) {
  const counts = unitCounts(rows.filter(isActive));
  return (
    <>
      <PageHeading eyebrow="ACROSS DISCIPLINES" title="One college. Many perspectives.">
        <p>Browse faculty by unit and documented affiliation.</p>
      </PageHeading>
      <p className="muted">
        Counts match the current regular and teaching faculty returned by each Unit filter. Faculty
        with multiple affiliations appear in more than one unit. This is a directory of represented
        units, not a complete organizational chart.
      </p>
      {unitGroups.map((group) => {
        const listed = units.filter(
          (unit) => unit.group === group && (counts.get(unit.key) || 0) > 0,
        );
        if (!listed.length) return null;
        return (
          <section className="profile-section" key={group}>
            <h2>{group}</h2>
            <div className="department-grid">
              {listed.map((unit) => (
                <Link
                  className="department-card"
                  href={queryFor({ department: [unit.key] })}
                  key={unit.key}
                >
                  <h3>{unit.label}</h3>
                  {unit.parent && <p className="small muted">Within {unit.parent}</p>}
                  <div>
                    <span>
                      {counts.get(unit.key)} faculty{' '}
                      {counts.get(unit.key) === 1 ? 'profile' : 'profiles'}
                    </span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <p className="muted">
        Other FSU affiliations are listed separately from COSSPP units. Units represented only by
        additional appointment categories can be found using the Unit filter and appointment
        checkbox.
      </p>
    </>
  );
}
