# Design system

An academic editorial style: warm ivory ground, white panels, garnet emphasis and muted gold details. Serif headings pair with a local sans-serif stack; no external font service. The masthead uses plain university/college text. Official logo display is withheld pending permission confirmation; the original directory title, homepage map illustration and initials placeholders remain. The footer identifies independent development.

The landing page emphasizes the search task, actual dataset counts and discovery routes. Directory controls use semantic checkboxes and OR-within/AND-across logic. Cards omit empty research summaries; profiles instead offer a neutral link to the official FSU page. Profiles separate research evidence from appointment status. Country, region and self-reported-language tags have distinct labels and colors. The homepage uses a Tallahassee-centered Mercator illustration, while Explore geography uses the original Natural Earth projection; country and region links provide an equivalent non-map experience. Research geography is explicitly distinguished from nationality.

Responsive grids adapt at 1050/800/540px. The directory places four native dropdowns (Department, Country, Region, Language) below free-text search: one row on larger screens, two columns on phones. Topics and methods are available through text search and existing profile links; the search hint states this explicitly. Navigation wraps; all controls have accessible names and visible focus. A skip link targets main, route changes focus the page heading, results announce their count, and reduced-motion preferences suppress transitions. Dark mode respects system preference until changed, then stores the selected preference locally. Faculty cards use small circular official portraits that link to profiles; a larger portrait appears beside the profile name. Initials remain when a photo is absent or fails to load.

Automated accessibility checks supplement keyboard/responsive inspection; they cannot establish complete WCAG conformance or replace a screen-reader user evaluation. See QA.md for what was actually checked.

Map attribution: Natural Earth 1:110m Admin-0 countries, public domain. Geometry downloaded 2026-10-27 from the official project repository and rounded to three decimals; only ISO code/name and geometry retained. Map boundaries are illustrative and some small states/territories are absent at this scale. All recorded countries remain available as links. See THIRD_PARTY.md.

## Public wording review — 2026-10-27

Homepage shortcuts are explicitly labeled “Example searches”; Migration, Climate and Japan are illustrative keyword searches, not an exhaustive or prioritized list of expertise. Empty states describe the search or the directory, without characterizing a faculty member’s knowledge. Individual profiles show source-review dates and positive faculty confirmation only when applicable; About explains the distinction between source review and faculty confirmation. Languages explicitly stated in public CVs or faculty-owned profiles appear with source links and original proficiency wording; separate permission is not required under the owner-approved policy. Appointment labels retain current/upcoming distinctions and direct readers to official FSU pages where the directory cannot establish current details. Raw unknown primary-unit values appear as affiliation-based or “Other faculty listings” labels, with their scope explained on About. Repeated non-confirmation wording in source-note prose was removed; factual fields, review statuses and provenance metadata remain intact.

## Recognizable globe — 2026-10-27

The homepage uses `public/earth.svg`: a static orthographic globe with Natural Earth continent outlines, blue-gray ocean, sage land, subtle graticules and illustrative garnet connections. Generate it with `node scripts/generate-globe.mjs` using the existing public geometry. Connections are decorative, not research observations. The image is hidden from assistive technology within the existing decorative container, reserves its dimensions and uses the repository base path. No new network dependency or animation is required.

Official logo resources were located through the [COSSPP communications page](https://cosspp.fsu.edu/cosspp-comm-services/) (COSSPPmedia SharePoint) and [FSU academic identity guide](https://brand.fsu.edu/logos#level-three), accessed 2026-10-27. FSU provides college lockups through its Brandfolder portal. The initial resource lookup did not import a mark; the subsequent explicit request to add the official logo is implemented below.

## Official logo and Tallahassee connections — 2026-10-27

At the owner’s explicit request, the site masthead now displays the official white horizontal stacked COSSPP lockup, linked to the college homepage. Original SVG artwork is preserved, with responsive proportional sizing and a garnet background in both themes. The separate directory title and existing independent-development description remain. About and asset documentation reflect the logo’s inclusion.

All eight decorative globe routes now share the Tallahassee origin (approximately 30.4383 N, 84.2807 W). A stronger origin marker and a readable Tallahassee label identify the starting point. Destination coordinates span North America, South America, Europe, Africa and Asia; arcs show illustrative global reach, not documented partnerships. The caption reads “FROM TALLAHASSEE TO THE WORLD.” The research-data map and faculty data are unchanged.

## Logo permission review — 2026-10-27

Supersedes the logo-display portion of the preceding implementation note: following the owner’s concern about rights, the official lockup was removed from rendering and from `public/`. The unchanged SVG is retained only in ignored private review storage. A rebuilt `dist/` contains no official-logo asset. Plain masthead text is restored; the Tallahassee globe is unchanged. No CC grant was found in the reviewed official materials or source SVG. University branding/mark permissions need confirmation for this independent directory before reinstatement; see THIRD_PARTY.md.

## Tallahassee-centered globe — 2026-10-27

The orthographic globe is now centered exactly on the Tallahassee origin. The label sits below its central marker without a background rectangle or long leader line. Routes remain illustrative and clip at the globe horizon; destination markers on the far hemisphere are omitted so they cannot appear at misleading foreground positions. The official college logo remains withheld.

## Far-side connections — 2026-10-27

Tallahassee stays at the exact center. A Tokyo route is added, and Japan/Tokyo and South Asia/Delhi have transparent exterior callouts marked “far side.” Each great-circle route remains solid on the visible hemisphere; a dashed schematic connector starts at its mathematically calculated horizon intersection and leads to the exterior label. The labels are annotations, not projected geographic positions. Far-hemisphere endpoint markers remain hidden. This makes hidden connections legible without relocating Asian destinations onto the foreground map. All connections remain illustrative.

## Translucent globe — 2026-10-27

Tallahassee remains exactly at the center. The far hemisphere is rendered through the sphere in muted violet, with Japan slightly emphasized; translucent sage land distinguishes the near hemisphere. An opposite-facing, horizontally mirrored orthographic projection preserves the actual through-globe positions. Dashed paths show the hidden portions of the illustrative routes. The ocean and foreground land use partial opacity, and the label background stays transparent. A short caption explains the violet layer. The SVG follows the site's selected light/dark color scheme so its labels and connections remain readable in both themes.

## Restore a clear globe — 2026-10-27

Supersedes the translucent rendering above: user review found overlapping continents harder to understand. Removed the far-side land layer, hidden route segments and violet-layer caption; restored opaque land/ocean. Tallahassee remains centered with an unboxed label, and exterior Japan/South Asia callouts remain. Dark-theme exterior label contrast is retained; routes and the center label use garnet against the light globe.

## Flat world map centered on Tallahassee — 2026-10-27

Replaces the globe and exterior callouts with a single flat azimuthal equidistant world map. Tallahassee is exactly at (280,280) in the 560×560 SVG; all destinations, including Japan, East Asia and South Asia, appear at projected geographic positions. The three Asian connections have stronger lines, larger labels and visible endpoints. Other destinations provide global context. No shaded sphere, hidden hemisphere or overlapping back-side continents remain. The projection preserves distance/direction from the center; peripheral land shapes are distorted, especially near the opposite point in the Indian Ocean. D3's default clipping excludes only the antipodal singularity, not a hemisphere. Reference: https://d3js.org/d3-geo/azimuthal (accessed 2026-10-27).

The existing generator and asset filenames are retained (`scripts/generate-globe.mjs`, `public/earth.svg`). The map fits its column and is now visible below the search section on small screens. Labels use thin text outlines without opaque boxes; the palette follows the selected light/dark theme. Connections remain illustrative, not evidence of actual partnerships or faculty expertise. The data-driven Explore geography page is unchanged.

## Remove arbitrary destination emphasis — 2026-10-27

User review identified that selectively drawn routes could be read as actual relationships or raise questions about destination selection. Removed all illustrative connection lines, destination points and labels, and country-specific colors. The flat world map, centered Tallahassee marker and label, uniform country boundaries, responsive sizing and theme support remain. No research relationships or institutional partnerships are implied by the homepage map; actual source-backed geography remains on the Explore page. This supersedes the selected-destination styling described above.

## Shared interactive homepage map — 2026-10-27

At the user’s request, the homepage now reuses the existing Explore geography WorldMap component, including its Natural Earth projection, data-driven country shading, counts, hover/focus feedback and links to filtered faculty results. This replaces the decorative Tallahassee-centered map; arbitrary routes and selected destinations are no longer displayed. Both pages receive current faculty only. The homepage presents the map at full content width beneath a compact two-column introduction/search area, stacking on mobile. Visible explanatory text connects shading to countries studied. A country/region-list link and load-failure link lead to Explore geography; the Explore page retains its local equivalent lists. The map is accessible content rather than hidden decorative art. Previous static SVG/generator prototypes are archived privately under .local/design-archive and excluded from the public build.

## Center Tallahassee and crop Antarctica — 2026-10-27

Both shared interactive maps now use a north-up Mercator projection, centered in longitude on Tallahassee (84.2807° W) and translated so its latitude (30.4383° N) is exactly at the viewport midpoint. The 960×577 view clips at approximately 60.074° S and 79.996° N, removing Antarctica and the high Arctic. The southern limit retains Tierra del Fuego and New Zealand. The latitude extent is symmetric about Tallahassee in projected coordinates, not latitude degrees. Longitude wraps on the opposite meridian (about 95.719° E); Japan appears on the left, and countries crossing the edge retain clickable pieces on both sides. Mercator expands high-latitude areas. Reference: https://d3js.org/d3-geo/cylindrical (accessed 2026-10-27).

A gold location marker and unboxed Tallahassee label identify FSU’s home. The marker ignores pointer events so it does not block the United States country link. Its accessible name identifies the location; this is not a research-connection marker. Small-screen label/marker sizes increase for readability. Map padding decreases from 24px to 12px on larger screens and retains 10px on mobile; projected side insets are 4 units. Antarctica geometry is explicitly excluded. Research shading/counts and country/region text lists remain unchanged; all 22 currently recorded research countries retain visible map geometry.

## Separate illustration and research exploration — 2026-10-27

The homepage uses the WorldMap illustration variant: all land has one uniform garnet fill, no country links, no per-country tooltips or research legend, and no dependency on faculty rows. Its centered Tallahassee marker/label, cropped Mercator view and mobile sizing remain. The section heading is “From Tallahassee to the world.” with a link to Explore geography; instructional copy about clicking shaded countries is removed. Its SVG is exposed as one labeled image.

Explore geography uses the research variant: the original unrotated Natural Earth projection (Japan on the right), data-driven country shading, counts and keyboard/click navigation. There is no Tallahassee marker or label in this variant. The southern edge clips at approximately 60° S, excluding Antarctica while retaining the original Arctic extent. Full-width fitting minimizes lateral whitespace. Country and region lists remain the equivalent text navigation. Both variants reuse the geometry/rendering component, but have separate projection settings and accessible descriptions; homepage colors make no research-coverage claim.

## Compact homepage illustration beside search introduction — 2026-10-27

Restores the early two-column hero composition: the left column groups the existing headline, description, search and example searches; the right column contains the single-color world illustration, capped at 440px and aligned near the top. The map no longer occupies a separate full-width section. Its panel border/background are removed, and a small caption, attribution and Explore research geography link remain. The location label/marker are sized for the smaller image. At 800px and below, the illustration is centered after the search content. Explore geography and both map projections/behaviors are unchanged.

## Homepage credit and location-label refinement — 2026-10-27

Natural Earth’s official terms explicitly make credit optional. Removed the attribution-only row from the homepage illustration and added a linked Map data note to About. Explore geography keeps its existing legend/source link. Removed unused homepage legend styles. Tallahassee now uses dark garnet (#5c2332) in light mode and light gold (#f3d38c) in dark mode, with a stronger page-colored text outline for separation from land and coastlines; no opaque label box is added. Marker placement, map size and geography remain unchanged. Source: https://www.naturalearthdata.com/about/terms-of-use/ (checked 2026-10-27).

## Direct profile updates to public academic sources — 2026-10-27

Profile sidebars and About now ask faculty to revise their own faculty profile pages or publicly available CVs. Removed the maintainer correction-email generator, Suggest an update button and About contact button; footer now says Sources, scope & updates. Ordinary faculty professional contact links remain. Public wording describes a directory designed for regular automated refreshes because no scheduled refresh job is present in the repository; no cadence or immediate-update promise is invented. This change implements the owner’s source-based update policy without setting up or claiming a live automation.

Profile footers display only Last updated and the record date. Detailed field-level evidence remains in the dataset for verification; language and photo source links remain next to their respective content.

Country and Region are linked: Region limits the available Country options. Choosing a country sets its mapped region and locks Region until Country is reset to All. An already selected containing region (including a broader region) is retained; otherwise the first preferred grouping in the shared geography mapping is used. Incoming single-country URLs receive the same normalization. Removing the region chip also clears its country.

Department browsing falls back to a documented affiliation when primary placement is unknown, without changing the sourced primary_department field. Unknown is omitted from selectable department categories. Counts describe profiles, not confirmed primary appointments.
