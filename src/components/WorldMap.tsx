import { useEffect, useState } from 'react';
import { geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Faculty } from '../types/faculty';
import { queryFor } from '../utils/search';
import { navigate } from '../utils/navigation';
import { Link } from './Link';
import {
  createWorldProjection,
  createResearchMap,
  TALLAHASSEE,
  WORLD_MAP_WIDTH,
  WORLD_MAP_HEIGHT,
} from '../utils/mapProjection';
type World = FeatureCollection<Geometry, { code: string; name: string }>;
type WorldMapProps =
  { variant: 'illustration'; rows?: never } | { variant?: 'research'; rows: Faculty[] };
export function WorldMap({ rows = [], variant = 'research' }: WorldMapProps) {
  const illustration = variant === 'illustration';
  const [world, setWorld] = useState<World>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}world.geojson`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Map unavailable');
        return r.json();
      })
      .then(setWorld)
      .catch((e) => {
        if (e.name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, []);
  const counts = new Map<string, number>();
  rows.forEach((r) =>
    r.geographic_research_countries.forEach((c) =>
      counts.set(c.code, (counts.get(c.code) || 0) + 1),
    ),
  );
  const { projection, height } = illustration
    ? { projection: createWorldProjection(), height: WORLD_MAP_HEIGHT }
    : createResearchMap();
  const path = geoPath(projection);
  const [originX, originY] = projection(TALLAHASSEE)!;
  return (
    <div className="map-wrap">
      {failed ? (
        <p className="map-fallback">
          The map could not load.{' '}
          {illustration ? (
            <Link href="?page=explore">Browse research countries and regions.</Link>
          ) : (
            'All geographic searches remain available in the country and region lists below.'
          )}
        </p>
      ) : !world ? (
        <p className="map-fallback">
          {illustration ? 'Loading the world map…' : 'Loading the research map…'}
        </p>
      ) : (
        <svg
          className={`world-map ${illustration ? 'world-map-illustration' : 'world-map-research'}`}
          viewBox={`0 0 ${WORLD_MAP_WIDTH} ${height}`}
          role={illustration ? 'img' : 'group'}
          aria-labelledby="map-title map-description"
        >
          <title id="map-title">
            {illustration
              ? 'World map centered on Tallahassee'
              : 'Countries studied by listed current faculty'}
          </title>
          <desc id="map-description">
            {illustration
              ? 'An illustration with all countries in the same color. Tallahassee, home to Florida State University, is marked at the center. Antarctica is outside the displayed area.'
              : 'Highlighted countries have documented research. Select a country to filter the directory. Equivalent links appear below the map. Antarctica is outside the displayed area.'}
          </desc>
          <path className="ocean" d={path({ type: 'Sphere' }) || ''} />
          {world.features.map((f, i) => {
            if (f.properties.code === 'AQ') return null;
            const n = counts.get(f.properties.code) || 0;
            const d = path(f) || '';
            if (!d) return null;
            if (illustration) {
              return (
                <path
                  className="illustration-land"
                  data-country={f.properties.code}
                  key={i}
                  d={d}
                />
              );
            }
            return n ? (
              <a
                key={i}
                href={queryFor({ country: [f.properties.code] })}
                aria-label={`${f.properties.name}: ${n} researchers`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    navigate(queryFor({ country: [f.properties.code] }));
                  }
                }}
              >
                <path className="mapped" data-country={f.properties.code} d={d}>
                  <title>
                    {f.properties.name}: {n} researchers
                  </title>
                </path>
              </a>
            ) : (
              <path className="unmapped" data-country={f.properties.code} key={i} d={d}>
                <title>{f.properties.name}</title>
              </path>
            );
          })}
          {illustration && (
            <g className="map-origin" aria-hidden="true">
              <circle className="map-origin-ring" cx={originX} cy={originY} r="8" />
              <circle className="map-origin-dot" cx={originX} cy={originY} r="4" />
              <text x={originX} y={originY + 25} textAnchor="middle">
                Tallahassee
              </text>
            </g>
          )}
        </svg>
      )}
      {!illustration && (
        <div className="map-legend">
          <span>
            <i /> Research connections in this directory
          </span>
          <span>
            <i /> Other countries
          </span>
          <a href="https://www.naturalearthdata.com/about/terms-of-use/">Made with Natural Earth</a>
        </div>
      )}
    </div>
  );
}
