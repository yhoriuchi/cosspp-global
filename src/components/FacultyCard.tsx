import type { Faculty } from '../types/faculty';
import { Link } from './Link';
import { affiliationLabel, appointmentLabel } from '../utils/profileDisplay';
export function profileHref(id: string) {
  const p = new URLSearchParams(window.location.search);
  p.set('page', 'profile');
  p.set('id', id);
  return `?${p}`;
}
export function FacultyCard({ person: r }: { person: Faculty }) {
  return (
    <article className="faculty-card">
      <div className="card-top">
        <div className="avatar" aria-hidden="true">
          {r.full_name
            .split(/\s+/)
            .map((x) => x[0])
            .filter(Boolean)
            .filter((_, i, a) => i === 0 || i === a.length - 1)
            .join('')}
        </div>
        <span className="department-label">{affiliationLabel(r)}</span>
      </div>
      <h3>
        <Link href={profileHref(r.id)}>{r.preferred_display_name || r.full_name}</Link>
      </h3>
      <p className="academic-title">{r.academic_title}</p>
      {(r.current_affiliation_status !== 'current' ||
        !['regular', 'teaching'].includes(r.appointment_type)) && (
        <p className="status-tag">{appointmentLabel(r)}</p>
      )}
      {r.research_interests.length > 0 && (
        <p className="interests">{r.research_interests.slice(0, 3).join(' · ')}</p>
      )}
      <div className="tags">
        {r.geographic_research_countries.slice(0, 3).map((c) => (
          <span className="tag country" key={c.code}>
            {c.name}
          </span>
        ))}
        {r.geographic_research_regions.slice(0, 2).map((region) => (
          <span className="tag region" key={region}>
            {region}
          </span>
        ))}
        {r.languages.map((l) => (
          <span className="tag language" key={l.code}>
            {l.language}
          </span>
        ))}
      </div>
      <Link className="card-link" href={profileHref(r.id)}>
        View profile <span aria-hidden="true">↗</span>
        <span className="sr-only"> of {r.full_name}</span>
      </Link>
    </article>
  );
}
