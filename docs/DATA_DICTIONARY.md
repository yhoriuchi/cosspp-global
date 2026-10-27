# Data dictionary

Authoritative executable schema: `src/types/faculty.ts`. Public dataset: `data/public/faculty.json`, one faculty member per stable `id`. JSON uses snake_case. Array fields are many-to-many. Empty arrays and absent optional fields mean unrecorded, never a negative finding. `data/schemas/faculty.schema.json` is a generated structural reference; the TypeScript validator additionally enforces cross-field rules.

| Field | Meaning / constraints |
|---|---|
| id | Stable lowercase ASCII slug assigned once; retain through name/title changes. Never regenerate IDs during routine refreshes. |
| full_name, preferred_display_name | Verified full name; optional preferred display name requires source evidence. No identity inference. |
| academic_title | Source-supported title. Prefer current roster/new dated appointment over stale biography text. |
| primary_department | Main appointment; `Unknown` explicitly marks unresolved primary affiliation. |
| additional_affiliations | Other verified units/centers. Department filter matches both primary and additional affiliations. |
| appointment_type | regular, teaching, visiting, adjunct, emeritus, affiliate, unknown. Default results include current regular/teaching only. |
| current_affiliation_status | current (listed currently), upcoming (explicit future start), unknown (unresolved). Does not imply an HR audit. |
| email, office | Optional public professional contact/location only. No personal contact collection. |
| official_profile_url | Official individual profile OR actual official directory/card fallback. Fallbacks must not be counted as substantive biographies. |
| personal_website_url, cv_url | Optional source-verified link. Link presence does not imply target accessibility or CV freshness. |
| short_biography | Concise paraphrase of supported academic work; no copied full biographies. |
| phd | Optional institution, field, year. Years only when explicit and consistent. |
| other_degrees | Optional degree objects: institution, field, year. |
| previous_academic_appointments, international_academic_experience | Source-supported professional experience, separate from countries studied. |
| research_interests, research_keywords | Extensible source-supported topics, not inferred from names or departments. |
| methodological_expertise | Explicit research methods; multi-select search uses exact vocabulary. |
| geographic_research_countries | Objects `{code,name}`: ISO 3166-1 alpha-2 plus readable country name. Codes/names must agree. Includes US research where supported. |
| geographic_research_regions | Controlled enum in schema; Global / Cross-national, East/Southeast/South/Central Asia, Europe, Sub-Saharan/North Africa, Middle East, Latin America, Caribbean, North America, Oceania and broader explicit groupings. Country-to-region normalization must be explained in evidence. |
| comparative_or_crossnational_focus | Optional supported boolean; absence means unknown. |
| international_research_projects, international_institutional_affiliations | Optional source-supported descriptions. |
| countries_of_prior_professional_experience | ISO codes for professional experience only; never used as research-country matches. |
| selected_publications | Citation and public URL; empty initially. Do not turn titles alone into geographic classifications. |
| languages | Controlled ISO language code, name, speaking/reading/writing proficiency, verification URL, faculty_confirmed, publication_approved, approval_date. Both booleans must be true in public data. |
| sources | Array of URL, accessed date, supported field names, short paraphrased evidence, extraction method, optional reviewed_by and retrieval channel. |
| sources.extraction | automatic, agent_reviewed, human_reviewed. An automatically extracted field needs explicit reviewed_by agent/human before publication. |
| sources.retrieval | direct or search_index. Search-index review date is not proof of live availability. |
| last_updated, last_verified | ISO dates; verified means source review, not institutional or faculty approval. |
| verification_status | Public: source_verified or faculty_confirmed. Private candidates may be pending_review/insufficient_evidence. |
| faculty_review_status | not_requested, pending, confirmed; independent from source review. |
| publication_status | Public schema accepts only public. This describes eligibility for a proposed build, not authorization to deploy it. |

Language proficiency values: Native / Heritage, Fluent / Professional, Conversational, Basic, Not specified. Each skill is separate; the code never assigns proficiency from background information. Extend the language-code vocabulary with tests when adding a genuinely confirmed language.

## Deliberately absent public fields

Citizenship, nationality classification, internal notes, unpublished review candidates, consent correspondence, photos and university marks. The schema is strict: unknown properties fail validation, including nested unknown fields. A future private consent system must use a separate store with proper access control, never additional browser-bundled fields.

## CSV convention

`pnpm run data:export [output.csv]` writes the union of all public keys; nested arrays/objects remain JSON in quoted cells. It preserves quotes, commas, line breaks and accented names. Formula-like leading values receive an apostrophe for spreadsheet safety; the importer reverses that escape. `pnpm run data:import path.csv` validates and writes only `data/review/import-candidates.json`. It never silently replaces the public dataset. Review the proposed changes and evidence before promotion.
