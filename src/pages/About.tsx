import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { Link } from '../components/Link';
export function About({ rows }: { rows: Faculty[] }) {
  return (
    <>
      <PageHeading
        eyebrow="ABOUT THE INITIATIVE"
        title="Better connections begin with reliable information."
      >
        <p>
          COSSPP Global helps faculty, graduate students, and research partners discover expertise
          across Florida State University’s College of Social Sciences and Public Policy.
        </p>
      </PageHeading>
      <div className="about-layout">
        <div>
          <section className="profile-section">
            <h2>Built for academic collaboration</h2>
            <p>
              Find colleagues who share an interest in a country, a research question, or a method.
              The directory is designed to support interdisciplinary research, international
              partnerships, mentoring, conferences, and grant applications.
            </p>
            <p>
              Everyone with a current COSSPP faculty appointment is eligible for inclusion.
              International expertise is not equivalent to foreign citizenship.
            </p>
          </section>
          <section className="profile-section">
            <h2>About the directory’s scope</h2>
            <p>
              The initial collection covers the six principal academic units and selected
              interdisciplinary programs. The directory currently includes {rows.length} profiles
              and is updated as public academic sources are reviewed.
            </p>
            <p>
              Profiles offer a starting point for discovery, rather than a comprehensive account of
              each colleague’s work. Topics, geographic connections, and languages shown here
              reflect the material included in the directory; they do not define the full range of a
              person’s expertise or language skills.
            </p>
            <p>
              Appointment details reflect the sources reviewed on the dates shown. Linked FSU pages
              provide additional context. Where a live page was unavailable, an indexed copy was
              reviewed and identified in the source details.
            </p>
          </section>
          <section className="profile-section">
            <h2>How profiles are prepared</h2>
            <p>
              Current FSU directories and profiles are the starting point, followed by publicly
              accessible CVs, faculty-maintained websites, and reliable academic sources. Every
              published substantive field has source evidence and an access date.
            </p>
            <p>
              The project’s AI-assisted workflow checks profile details against public sources.
              Source review and faculty confirmation are separate steps: a profile is identified as
              faculty-confirmed only when that confirmation has been received. Source details
              distinguish automated extraction, agent review, and human review.
            </p>
            <p>
              Geographic tags describe research settings supported by the cited sources. They refer
              to places studied, not faculty citizenship or national origin.
            </p>
          </section>
          <section className="profile-section">
            <h2>Keeping your profile up to date</h2>
            <p>
              To update your information, please revise your own faculty profile page or publicly
              available CV.
            </p>
            <p>
              This directory is designed to refresh profiles automatically at regular intervals
              using those public sources.
            </p>
          </section>
          <section className="profile-section">
            <h2>Privacy & faculty control</h2>
            <p>
              Faculty choose whether to share language information. Published language entries
              require their explicit confirmation and permission, including any proficiency details.
              The directory does not collect or publish citizenship information, or infer language
              ability from personal background. Faculty photographs are not reproduced.
            </p>
            <p>
              The site has no account system, analytics, tracking cookies, or submission database.
              Theme preference is stored in your browser. Search text appears in shareable URLs;
              avoid entering private information. Following external source links is subject to
              those sites’ policies.
            </p>
          </section>
          <section className="profile-section">
            <h2>Search behavior</h2>
            <p>
              Search is case-insensitive and accent-insensitive. Multiple words must all match
              somewhere in a profile. Within a filter group, any selected choice matches (OR);
              across groups, every group must match (AND). Names sort by displayed full name.
              Filters are stored in the URL and can be bookmarked or shared.
            </p>
            <p>
              Regional searches also include country expertise: for example, Japan matches East
              Asia and Asia. These geographic groupings help discovery; they do not imply that a
              faculty member studies every country in the region. Profile tags retain the scope
              documented in their sources.
            </p>
            <p className="small muted">
              Geographic groupings are adapted from{' '}
              <a href="https://www.unicode.org/cldr/">Unicode CLDR</a> (
              <a href={`${import.meta.env.BASE_URL}unicode-license.txt`}>license</a>). Latin
              America includes the Caribbean; North America includes Central America and the
              Caribbean.
            </p>
            <p>
              Regular and teaching faculty with current appointments appear by default. Use the
              appointment checkbox to include visiting, adjunct, affiliated and upcoming listings,
              along with entries whose current appointment details are being reconciled by the
              directory editors. Department filters match primary and additional affiliations.
              “Other faculty listings” groups entries with a documented affiliation whose primary
              departmental placement is being reconciled by the editors.
            </p>
          </section>
        </div>
        <aside className="about-aside">
          <p className="eyebrow">PRIMARY STARTING POINTS</p>
          <a href="https://cosspp.fsu.edu/deans-office/faculty-and-staff/">
            COSSPP faculty & staff ↗
          </a>
          <a href="https://cosspp.fsu.edu/departments-and-programs/">Departments & programs ↗</a>
          <hr />
          <h2>Map data</h2>
          <p>
            Maps are made with public-domain data from{' '}
            <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>.
          </p>
          <hr />
          <h2>Independent by design</h2>
          <p>
            This project is independently developed and is not an officially endorsed FSU service.
          </p>
          <Link href="?page=directory">Explore the directory →</Link>
        </aside>
      </div>
    </>
  );
}
