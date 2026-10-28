import type { Faculty } from '../types/faculty';
import { Link } from './Link';
import { affiliationLabel, appointmentLabel, displayedLanguages } from '../utils/profileDisplay';
import { researchRegions } from '../utils/geography';
import { FacultyPortrait } from './FacultyPortrait';
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
        <Link
          className="portrait-link"
          href={profileHref(r.id)}
          aria-label={`Open profile of ${r.full_name}`}
        >
          <FacultyPortrait person={r} />
        </Link>
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
        {researchRegions(r).map((region) => (
          <span
            className="tag region"
            key={region}
            title={
              r.geographic_research_regions.includes(region)
                ? undefined
                : 'Regional grouping of the research locations listed in this profile.'
            }
          >
            {region}
          </span>
        ))}
        {displayedLanguages(r).map((l) => (
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
