import { geoMercator, geoNaturalEarth1 } from 'd3-geo';

export const TALLAHASSEE: [number, number] = [-84.2807, 30.4383];
export const WORLD_MAP_WIDTH = 960;
const inset = 4;
const scale = (WORLD_MAP_WIDTH - inset * 2) / (2 * Math.PI);
const mercatorY = (latitude: number) =>
  Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
// Mirror the south limit around Tallahassee in projected coordinates. This keeps
// the marker exactly centered, retains southern inhabited land and omits Antarctica.
export const WORLD_MAP_HEIGHT = Math.ceil(
  2 * (scale * (mercatorY(TALLAHASSEE[1]) - mercatorY(-60)) + inset),
);

export function createWorldProjection() {
  return geoMercator()
    .rotate([-TALLAHASSEE[0], 0])
    .center([0, TALLAHASSEE[1]])
    .scale(scale)
    .translate([WORLD_MAP_WIDTH / 2, WORLD_MAP_HEIGHT / 2])
    .clipExtent([
      [inset, inset],
      [WORLD_MAP_WIDTH - inset, WORLD_MAP_HEIGHT - inset],
    ]);
}

// Keep the original, unrotated Natural Earth layout for research exploration.
// Crop below 60° S and fit the full world width, without cropping the Arctic.
export function createResearchMap() {
  const projection = geoNaturalEarth1().fitWidth(WORLD_MAP_WIDTH - inset * 2, {
    type: 'Sphere',
  });
  const top = projection([0, 90])![1];
  const bottom = projection([0, -60])![1];
  const height = Math.ceil(bottom - top + inset * 2);
  const [x, y] = projection.translate();
  projection.translate([x + inset, y + inset - top]).clipExtent([
    [inset, inset],
    [WORLD_MAP_WIDTH - inset, height - inset],
  ]);
  return { projection, height };
}
