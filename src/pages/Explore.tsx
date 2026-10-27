import type { Faculty } from '../types/faculty';
import { PageHeading } from '../components/Layout';
import { WorldMap } from '../components/WorldMap';
import { Link } from '../components/Link';
import { queryFor, isActive } from '../utils/search';
export function Explore({ rows }: { rows: Faculty[] }) {
  const active = rows.filter(isActive);
  const countries = [
    ...new Map(
      active.flatMap((r) => r.geographic_research_countries.map((c) => [c.code, c.name] as const)),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  const regions = [...new Set(active.flatMap((r) => r.geographic_research_regions))].sort();
  return (
    <>
      <PageHeading eyebrow="EXPLORE GEOGRAPHY" title="A world of research connections.">
        <p>
          Discover where current faculty conduct research. The map describes countries studied,
          never citizenship or national origin.
        </p>
      </PageHeading>
      <WorldMap rows={active} />
      <p className="small muted">
        Shaded countries link to research connections in this directory. The map is a starting point
        for exploration, rather than a complete inventory of faculty research. Regional and
        transnational connections appear in the lists below. Map boundaries are illustrative; some
        small territories are omitted at this scale.
      </p>
      <section className="home-section">
        <h2>Browse research countries</h2>
        <p className="muted">The same geographic searches, accessible without the map.</p>
        <div className="place-grid">
          {countries.map(([code, name]) => (
            <Link href={queryFor({ country: [code] })} key={code}>
              <span>{name}</span>
              <span>
                {
                  active.filter((r) => r.geographic_research_countries.some((c) => c.code === code))
                    .length
                }{' '}
                <span className="sr-only">faculty</span> ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-section">
        <h2>Regions & cross-national research</h2>
        <div className="place-grid">
          {regions.map((region) => (
            <Link href={queryFor({ region: [region] })} key={region}>
              <span>{region}</span>
              <span>
                {active.filter((r) => r.geographic_research_regions.includes(region)).length}{' '}
                <span className="sr-only">faculty</span> ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
