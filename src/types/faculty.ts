import { z } from 'zod';
export const countryCodes = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  ),
);
export const regions = [
  'Global / Cross-national',
  'East Asia',
  'Southeast Asia',
  'South Asia',
  'Central Asia',
  'Europe',
  'Sub-Saharan Africa',
  'North Africa',
  'Middle East',
  'Latin America',
  'Caribbean',
  'North America',
  'Oceania',
  'Africa',
  'Asia',
  'Arctic',
  'Antarctica',
] as const;
const text = z.string().trim().min(1);
const date = z.iso.date();
const url = z.url().refine((s) => /^https?:\/\//.test(s), 'Only public HTTP(S) URLs allowed');
export const sourceSchema = z.strictObject({
  url,
  accessed: date,
  fields: z.array(text).min(1),
  evidence: text,
  extraction: z.enum(['automatic', 'agent_reviewed', 'human_reviewed']),
  reviewed_by: z.enum(['agent', 'human']).optional(),
  retrieval: z.enum(['direct', 'search_index']).default('direct'),
});
const proficiency = z.enum([
  'Native / Heritage',
  'Fluent / Professional',
  'Conversational',
  'Basic',
  'Not specified',
]);
const languageCodes = [
  'en',
  'fr',
  'es',
  'pt',
  'de',
  'it',
  'ja',
  'ko',
  'zh',
  'ar',
  'ru',
  'hi',
  'bn',
  'ur',
  'id',
  'ms',
  'vi',
  'th',
  'tr',
  'fa',
  'he',
  'sw',
  'nl',
  'pl',
  'uk',
  'el',
  'sv',
  'no',
  'da',
  'fi',
  'cs',
  'ro',
  'hu',
  'ta',
  'te',
  'ne',
  'tl',
] as const;
const languageSchema = z.strictObject({
  code: z.enum(languageCodes),
  language: text,
  speaking_proficiency: proficiency,
  reading_proficiency: proficiency,
  writing_proficiency: proficiency,
  verification_source: url,
  faculty_confirmed: z.literal(true),
  publication_approved: z.literal(true),
  approval_date: date,
});
const degreeSchema = z.strictObject({
  institution: text,
  field: text.optional(),
  year: z.number().int().min(1850).max(2100).optional(),
});
export const facultySchema = z
  .strictObject({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    full_name: text,
    preferred_display_name: text.optional(),
    academic_title: text,
    primary_department: text,
    additional_affiliations: z.array(text),
    appointment_type: z.enum([
      'regular',
      'teaching',
      'visiting',
      'adjunct',
      'emeritus',
      'affiliate',
      'unknown',
    ]),
    current_affiliation_status: z.enum(['current', 'upcoming', 'unknown']),
    email: z.email().optional(),
    office: text.optional(),
    official_profile_url: url,
    personal_website_url: url.optional(),
    cv_url: url.optional(),
    short_biography: text.optional(),
    phd: degreeSchema.optional(),
    other_degrees: z.array(degreeSchema).default([]),
    previous_academic_appointments: z.array(text).default([]),
    international_academic_experience: z.array(text).default([]),
    research_interests: z.array(text),
    methodological_expertise: z.array(text),
    geographic_research_countries: z.array(
      z.strictObject({
        code: z.string().refine((c) => countryCodes.has(c), 'Invalid ISO alpha-2 country code'),
        name: text,
      }),
    ),
    geographic_research_regions: z.array(z.enum(regions)),
    comparative_or_crossnational_focus: z.boolean().optional(),
    international_research_projects: z.array(text).default([]),
    research_keywords: z.array(text).default([]),
    selected_publications: z.array(z.strictObject({ citation: text, url })).default([]),
    languages: z.array(languageSchema),
    countries_of_prior_professional_experience: z
      .array(z.string().refine((c) => countryCodes.has(c)))
      .default([]),
    international_institutional_affiliations: z.array(text).default([]),
    sources: z.array(sourceSchema).min(1),
    last_updated: date,
    last_verified: date,
    verification_status: z.enum(['source_verified', 'faculty_confirmed']),
    faculty_review_status: z.enum(['not_requested', 'pending', 'confirmed']),
    publication_status: z.literal('public'),
  })
  .superRefine((r, ctx) => {
    const sourced = [
      'full_name',
      'preferred_display_name',
      'academic_title',
      'primary_department',
      'appointment_type',
      'current_affiliation_status',
      'official_profile_url',
      'additional_affiliations',
      'email',
      'office',
      'cv_url',
      'personal_website_url',
      'short_biography',
      'phd',
      'other_degrees',
      'previous_academic_appointments',
      'international_academic_experience',
      'research_interests',
      'methodological_expertise',
      'geographic_research_countries',
      'geographic_research_regions',
      'comparative_or_crossnational_focus',
      'research_keywords',
      'international_research_projects',
      'selected_publications',
      'languages',
      'countries_of_prior_professional_experience',
      'international_institutional_affiliations',
    ] as const;
    for (const field of sourced) {
      const value = r[field];
      if (
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0) &&
        !r.sources.some(
          (s) => s.fields.includes(field) && (s.extraction !== 'automatic' || !!s.reviewed_by),
        )
      )
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: 'Populated public field requires reviewed source evidence',
        });
    }
    if (r.verification_status === 'faculty_confirmed' && r.faculty_review_status !== 'confirmed')
      ctx.addIssue({ code: 'custom', message: 'Faculty confirmation status mismatch' });
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const aliases: Record<string, string[]> = {
      // WebKit's locale data can label CN differently from Chromium/Node.
      CN: ['China'],
      KR: ['South Korea', 'Republic of Korea'],
      US: ['United States', 'United States of America'],
      GB: ['United Kingdom', 'UK'],
      TR: ['Türkiye', 'Turkey'],
      TW: ['Taiwan'],
      PS: ['Palestine', 'Palestinian Territories'],
      CZ: ['Czechia', 'Czech Republic'],
    };
    for (const c of r.geographic_research_countries)
      if (![names.of(c.code), ...(aliases[c.code] || [])].includes(c.name))
        ctx.addIssue({
          code: 'custom',
          message: `Country code/name mismatch: ${c.code} / ${c.name}`,
        });
    for (const [label, values] of [
      ['countries', r.geographic_research_countries.map((c) => c.code)],
      ['regions', r.geographic_research_regions],
      ['languages', r.languages.map((l) => l.code)],
    ] as const)
      if (new Set(values).size !== values.length)
        ctx.addIssue({ code: 'custom', message: `Duplicate ${label} within record` });
    const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });
    for (const l of r.languages) {
      const aliases: Record<string, string[]> = { zh: ['Mandarin Chinese'], tl: ['Filipino'] };
      if (![languageNames.of(l.code), ...(aliases[l.code] || [])].includes(l.language))
        ctx.addIssue({
          code: 'custom',
          message: `Language code/name mismatch: ${l.code} / ${l.language}`,
        });
    }
    if (r.last_verified > r.last_updated)
      ctx.addIssue({ code: 'custom', message: 'Verified date cannot follow updated date' });
  });
export const datasetSchema = z.array(facultySchema).superRefine((rows, ctx) => {
  const ids = new Set();
  const names = new Set();
  for (const [i, r] of rows.entries()) {
    const name = r.full_name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (ids.has(r.id) || names.has(name))
      ctx.addIssue({
        code: 'custom',
        path: [i],
        message: 'Duplicate faculty ID or normalized name',
      });
    ids.add(r.id);
    names.add(name);
  }
});
export type Faculty = z.infer<typeof facultySchema>;
export type Source = z.infer<typeof sourceSchema>;
// Private candidates live outside this public schema and are never imported by the app.
export type ReviewState = 'pending_review' | 'insufficient_evidence';
