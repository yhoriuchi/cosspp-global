import type { Faculty, regions } from '../types/faculty';
type Region = (typeof regions)[number];

// Geographic search groups, adapted from Unicode CLDR 49 territory containment.
// See docs/REGION_SEARCH.md for sources, naming choices and boundaries.
const countryGroups: Partial<Record<Region, string>> = {
  'East Asia': 'CN HK JP KP KR MN MO TW',
  'Southeast Asia': 'BN ID KH LA MM MY PH SG TH TL VN',
  'South Asia': 'AF BD BT IN IR LK MV NP PK',
  'Central Asia': 'KG KZ TJ TM UZ',
  Europe:
    'AD AL AT AX BA BE BG BY CH CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA',
  'Sub-Saharan Africa':
    'AO BF BI BJ BW CD CF CG CI CM CV DJ ER ET GA GH GM GN GQ GW IO KE KM LR LS MG ML MR MU MW MZ NA NE NG RE RW SC SH SL SN SO SS ST SZ TD TF TG TZ UG YT ZA ZM ZW',
  'North Africa': 'DZ EG EH LY MA SD TN',
  'Latin America':
    'AG AI AR AW BB BL BO BQ BR BS BV BZ CL CO CR CU CW DM DO EC FK GD GF GP GS GT GY HN HT JM KN KY LC MF MQ MS MX NI PA PE PR PY SR SV SX TC TT UY VC VE VG VI',
  'North America':
    'AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI',
  Caribbean: 'AG AI AW BB BL BQ BS CU CW DM DO GD GP HT JM KN KY LC MF MQ MS PR SX TC TT VC VG VI',
  Asia: 'AE AF AM AZ BD BH BN BT CN CY GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE',
  Africa:
    'AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW IO KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TF TG TN TZ UG YT ZA ZM ZW',
  Oceania: 'AS AU CC CK CX FJ FM GU HM KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS',
  'Middle East': 'AE BH CY EG IL IQ IR JO KW LB OM PS QA SA SY TR YE',
  Antarctica: 'AQ',
};
const byCountry = new Map<string, Region[]>();
for (const [region, codes] of Object.entries(countryGroups)) {
  for (const code of codes.split(' ')) {
    byCountry.set(code, [...(byCountry.get(code) || []), region as Region]);
  }
}
const parentRegions: Partial<Record<Region, Region[]>> = {
  'East Asia': ['Asia'],
  'Southeast Asia': ['Asia'],
  'South Asia': ['Asia'],
  'Central Asia': ['Asia'],
  'North Africa': ['Africa'],
  'Sub-Saharan Africa': ['Africa'],
  Caribbean: ['Latin America', 'North America'],
};

export function regionsForCountry(code: string): readonly Region[] {
  return byCountry.get(code) || [];
}

// Derived search membership only; never changes a faculty profile's sourced claims.
export function researchRegions(
  person: Pick<Faculty, 'geographic_research_regions' | 'geographic_research_countries'>,
): Region[] {
  return [
    ...new Set([
      ...person.geographic_research_regions.flatMap((region) => [
        region,
        ...(parentRegions[region] || []),
      ]),
      ...person.geographic_research_countries.flatMap((country) => regionsForCountry(country.code)),
    ]),
  ];
}
