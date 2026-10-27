# Geographic membership for regional search

Regional search combines source-supported region tags with the regions containing
source-supported country codes. The shared `researchRegions` helper drives text
search, region filters, available filter choices and Explore geography counts.
It deduplicates memberships per person. It never writes derived regions back to
faculty.json or displays them as additional source-verified profile claims.
A regional match does not imply expertise in every country in that region.

## Reference and conventions

The ISO alpha-2 lists in `src/utils/geography.ts` are adapted from
[Unicode CLDR 49 territory containment](https://github.com/unicode-org/cldr-json/blob/main/cldr-json/cldr-core/supplemental/territoryContainment.json),
accessed 2026-10-27, using the geographic hierarchy also described in
[UN M49](https://unstats.un.org/unsd/methodology/m49/).
Only the 249 country/area codes allowed by the public schema are included.
Unicode's license is included at `public/unicode-license.txt`.

- East, Southeast, South and Central Asia follow CLDR groups 030, 035, 034 and
  143. Asia (142) also includes Western Asia. Europe uses 150; Africa uses 002,
  North Africa 015 and Sub-Saharan Africa 202.
- North America uses the geographic grouping 003, including Central America and
  the Caribbean. The existing Latin America search label uses the broad Latin
  America and Caribbean grouping 419; Caribbean also remains searchable alone.
- Oceania uses 009, excluding Antarctica. Antarctica maps only to AQ. Country
  membership never implies Arctic or Global / Cross-national research.
- Middle East is an explicit search convention: AE BH CY EG IL IQ IR JO KW LB
  OM PS QA SA SY TR YE. This overlaps North Africa (Egypt) and South Asia (Iran).
  Other Western Asian countries remain searchable under Asia.
- The grouping places Russia in Europe and Georgia in Asia, following CLDR/M49.
  These are navigation conventions, not claims about exclusive regional identity
  or political status. Source-supported region tags can provide additional matches.
- Explicit Asian subregion tags also match Asia; African subregion tags match
  Africa; Caribbean matches Latin America and North America. A broad region
  alone never implies a particular country. Middle East alone does not imply
  either Asia or Africa because it spans both.

Examples: Japan → East Asia / Asia; Kenya → Sub-Saharan Africa / Africa;
Mexico → Latin America / North America. Selecting both a country and a region
still requires both filter groups to match. Current-appointment defaults remain.
