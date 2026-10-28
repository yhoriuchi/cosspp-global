import type { Faculty } from '../types/faculty';
import { Link } from '../components/Link';
import { queryFor } from '../utils/search';
import { PageHeading } from '../components/Layout';
import { affiliationLabel, appointmentLabel, displayedLanguages } from '../utils/profileDisplay';
import { researchRegions } from '../utils/geography';
import { FacultyPortrait } from '../components/FacultyPortrait';
export function Profile({ person: r, params }: { person?: Faculty; params: URLSearchParams }) {
  if (!r)
    return (
      <>
        <PageHeading eyebrow="DIRECTORY" title="Profile not found">
          <p>This link does not match a faculty record.</p>
        </PageHeading>
        <Link className="button" href="?page=directory">
          Return to directory
        </Link>
      </>
    );
  const back = new URLSearchParams(params);
  back.set('page', 'directory');
  back.delete('id');
  return (
    <>
      <Link className="back-link" href={`?${back}`}>
        ← Back to faculty directory
      </Link>
      <div className="profile-heading">
        <FacultyPortrait key={r.id} person={r} large />
        <PageHeading
          eyebrow={affiliationLabel(r).toUpperCase()}
          title={r.preferred_display_name || r.full_name}
        >
          <p>{r.academic_title}</p>
        </PageHeading>
      </div>
      {r.photo && (
        <p className="photo-credit small">
          <a href={r.photo.source_url}>Photo: official FSU page ↗</a>
        </p>
      )}
      <nav className="profile-resource-links" aria-label="Detailed faculty information">
        <a className="button" href={r.official_profile_url}>
          Official FSU profile ↗
        </a>
        {r.personal_website_url && (
          <a className="button" href={r.personal_website_url}>
            Personal academic website ↗
          </a>
        )}
        {r.cv_url && (
          <a className="button" href={r.cv_url}>
            Curriculum vitae (CV) ↗
          </a>
        )}
      </nav>
      <div className="profile-layout">
        <div>
          <div className="profile-section">
            <h2>Research & expertise</h2>
            {r.short_biography && <p>{r.short_biography}</p>}
            {r.research_interests.length ? (
              <div className="topic-tags">
                {r.research_interests.map((t) => (
                  <Link key={t} href={queryFor({ topic: [t] })}>
                    {t}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">
                Visit the <a href={r.official_profile_url}>official FSU page</a> for more
                information.
              </p>
            )}
          </div>
          {r.methodological_expertise.length > 0 && (
            <div className="profile-section">
              <h2>Methods</h2>
              <div className="topic-tags">
                {r.methodological_expertise.map((m) => (
                  <Link key={m} href={queryFor({ method: [m] })}>
                    {m}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!!(r.geographic_research_countries.length || r.geographic_research_regions.length) && (
            <div className="profile-section">
              <h2>Geographic research expertise</h2>
              <p className="muted small">
                Research locations documented in the sources below, with regional groupings for the
                countries studied.
              </p>
              <div className="tags">
                {r.geographic_research_countries.map((c) => (
                  <Link className="tag country" key={c.code} href={queryFor({ country: [c.code] })}>
                    {c.name}
                  </Link>
                ))}
                {researchRegions(r).map((region) => (
                  <Link
                    className="tag region"
                    key={region}
                    href={queryFor({ region: [region] })}
                    title={
                      r.geographic_research_regions.includes(region)
                        ? undefined
                        : 'Regional grouping of the research locations listed in this profile.'
                    }
                  >
                    {region}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {displayedLanguages(r).length > 0 && (
            <div className="profile-section">
              <h2>Languages</h2>
              {displayedLanguages(r).map((l) => (
                <div key={l.code}>
                  <h3>{l.language}</h3>
                  {l.proficiency_statement && <p>{l.proficiency_statement}</p>}
                  {[
                    ['Speaking', l.speaking_proficiency],
                    ['Reading', l.reading_proficiency],
                    ['Writing', l.writing_proficiency],
                  ]
                    .filter(([, level]) => level !== 'Not specified')
                    .map(([skill, level]) => (
                      <p key={skill}>
                        {skill}: {level}
                      </p>
                    ))}
                  <p className="muted small">
                    Self-reported in a{' '}
                    <a href={l.verification_source}>
                      {l.evidence_type === 'public_cv' ? 'public CV' : 'faculty profile'} ↗
                    </a>
                    . Reviewed {l.verified_on}.
                  </p>
                </div>
              ))}
            </div>
          )}
          {r.phd && (
            <div className="profile-section">
              <h2>Academic background</h2>
              <p>
                PhD{r.phd.field ? ` in ${r.phd.field}` : ''}, {r.phd.institution}
                {r.phd.year ? `, ${r.phd.year}` : ''}
              </p>
            </div>
          )}
          {r.additional_affiliations.length > 0 && (
            <div className="profile-section">
              <h2>Additional affiliations</h2>
              <ul>
                {r.additional_affiliations.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {r.international_academic_experience.length > 0 && (
            <div className="profile-section">
              <h2>International academic experience</h2>
              <ul>
                {r.international_academic_experience.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {r.selected_publications.length > 0 && (
            <div className="profile-section">
              <h2>Selected publications</h2>
              <ul>
                {r.selected_publications.map((p) => (
                  <li key={p.url}>
                    <a href={p.url}>{p.citation}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="profile-section">
            <h2>Last updated</h2>
            <p>
              <time dateTime={r.last_updated}>{r.last_updated}</time>
            </p>
          </div>
        </div>
        <aside className="profile-aside">
          <p className="eyebrow">CONTACT</p>
          {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
          {r.office && <p>{r.office}</p>}
          <hr />
          <p className="eyebrow">APPOINTMENT</p>
          <p>{appointmentLabel(r)}</p>
          <hr />
          <h2>Keeping your profile up to date</h2>
          <p>
            To update your information, please revise your own faculty profile page or publicly
            available CV.
          </p>
          <p>
            This directory is designed to refresh profiles automatically at regular intervals using
            those public sources.
          </p>
        </aside>
      </div>
    </>
  );
}
