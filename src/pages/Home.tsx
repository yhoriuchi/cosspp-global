import { useState } from 'react';
import { units, unitCounts } from '../utils/units';
import type { Faculty } from '../types/faculty';
import { SearchBar } from '../components/SearchBar';
import { Link } from '../components/Link';
import { WorldMap } from '../components/WorldMap';
import { queryFor, isActive } from '../utils/search';
import { navigate } from '../utils/navigation';
export function Home({ rows }: { rows: Faculty[] }) {
  const [q, setQ] = useState('');
  const active = rows.filter(isActive);
  const countries = new Set(
    active.flatMap((r) => r.geographic_research_countries.map((c) => c.code)),
  );
  const counts = unitCounts(active);
  const academicUnits = units.filter(
    (unit) => ['Departments & school', 'Programs'].includes(unit.group) && counts.has(unit.key),
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">DISCOVERY STARTS WITH A CONNECTION</p>
          <h1 tabIndex={-1}>
            Local colleagues.
            <br />
            <em>Global perspectives.</em>
          </h1>
          <p className="hero-description">
            Discover research expertise and connect with colleagues across Florida State
            University’s College of Social Sciences and Public Policy.
          </p>
          <SearchBar
            value={q}
            onChange={setQ}
            onSubmit={() => navigate(queryFor({ q }))}
            id="home-search"
            large
          />
          <div className="try-search">
            <span>Example searches</span>
            {['Migration', 'Climate', 'Japan'].map((t) => (
              <Link key={t} href={queryFor({ q: t })}>
                {t} ↗
              </Link>
            ))}
          </div>
        </div>
        <aside className="home-map" aria-label="World map illustration">
          <WorldMap variant="illustration" />
          <p className="home-map-caption">From Tallahassee to the world.</p>
          <Link href="?page=explore">Explore research geography ↗</Link>
        </aside>
      </section>
      <section className="stats-band" aria-label="Current directory coverage">
        <div>
          <strong>{active.length}</strong>
          <span>current faculty listed</span>
        </div>
        <div>
          <strong>{academicUnits.length}</strong>
          <span>academic units represented</span>
        </div>
        <div>
          <strong>{countries.size}</strong>
          <span>research countries represented</span>
        </div>
        <p>
          A growing directory, grounded in public academic sources.
          <br />
          <Link href="?page=about">About the directory →</Link>
        </p>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MANY WAYS TO CONNECT</p>
            <h2>Where will your next collaboration begin?</h2>
          </div>
          <Link href="?page=directory">Browse all faculty ↗</Link>
        </div>
        <div className="discovery-grid">
          {[
            [
              '01',
              'Explore by place',
              'Find scholars working on countries, regions, and questions that cross borders.',
              'explore',
              'Explore geography',
            ],
            [
              '02',
              'Cross disciplines',
              'Discover complementary expertise across academic units.',
              'departments',
              'Browse units',
            ],
            [
              '03',
              'Follow a question',
              'Search research topics and methods to find a shared intellectual interest.',
              'directory',
              'Search the directory',
            ],
          ].map(([n, title, body, page, label]) => (
            <Link className="discovery-card" href={`?page=${page}`} key={n}>
              <span className="number">{n}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <span className="discovery-link">
                {label} <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="principle">
        <span className="eyebrow">CONNECTIONS THROUGH RESEARCH</span>
        <h2>International connections take many forms.</h2>
        <p>
          Explore shared interests across countries, cultures, and disciplines. This directory
          brings together colleagues across the college and offers a starting point for new
          collaborations.
        </p>
        <Link href="?page=about">Read about the project →</Link>
      </section>
    </>
  );
}
