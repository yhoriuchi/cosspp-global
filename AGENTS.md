# COSSPP Global — Faculty Expertise & Connections

Build a research-oriented directory covering current Florida State University COSSPP faculty across all six principal units and interdisciplinary programs. Include basic profiles without international information; missing information is unknown, never a negative finding.

## Architecture and conventions
- React + TypeScript + Vite, static JSON and client-side filtering; no required backend or paid service. Maintain small reusable components and accessible semantic controls.
- `data/public/faculty.json` is the public dataset. Strict Zod schemas in `src/types/faculty.ts` define the publication boundary. Country identifiers use ISO alpha-2 codes. Sources support individual populated fields; stable IDs must survive name changes.
- `data/review/`, raw source caches, local QA output and `project_history/` remain private and ignored. Never import them into application source or copy them to `public/`.
- Unit choices follow the reviewed registry in `src/utils/units.ts` and `docs/UNITS.md`. Distinguish academic units, research groups and other FSU affiliations; counts and filtering share documented membership.
- Update README and relevant docs with changes; preserve unrelated work. Follow global R guide before any R code.

## Evidence and privacy
- Never fabricate people, appointments, research expertise, languages or affiliations. Prefer current official FSU sources, then CVs and faculty-maintained academic sites. Cite URLs and access dates. Distinguish automated extraction, agent review and human/faculty confirmation.
- Read source context before assigning research countries or regions. Do not infer languages/citizenship from names, education, birthplace, photographs or publications. International expertise is not nationality.
- No citizenship in initial public schema, filters or exports. Keep any later consent-controlled private extension separate. Publish languages explicitly stated in public CVs or faculty-owned profiles with reviewed provenance (owner-approved policy, 2026-10-27); separate publication permission is not required. Preserve stated proficiency wording and never infer ability. Public self-report does not mean faculty confirmation of this directory. Review available CVs for research fields/geography; explicit American Politics or U.S.-focused research supports United States. Put homepage/CV links near the top of profiles.
- Owner-authorized policy (2026-10-27): display portraits from official FSU pages after verifying the named profile/roster association. Store official HTTPS image/page URLs with reviewed provenance; exclude logo placeholders. Use initials when absent or unavailable. This is not a CC-license claim. University marks remain excluded.
- Default to current regular/teaching appointments; label other categories. Future arrivals are not current. Deduplicate cross-affiliations and retain main appointment.
- Respect robots, terms, access controls and modest request rates. Record blocked sources rather than bypassing controls. Never claim roster completeness without reconciliation.

## Verification and publication
- Run `npm run validate`, `npm test`, `npm run build`; run meaningful Playwright checks after UI changes. Check keyboard, mobile, missing fields, URL filters, profile navigation and repository-subpath refreshes. Record what actually passed and any limits.
- Do not create remote repositories, push or deploy without Yusaku's explicit approval. Local Git initialization is allowed. Never use an institutional organization account without explicit authorization.
- Owner approval on 2026-10-27 authorizes the personal `yhoriuchi/cosspp-global` repository, weekly GitHub-hosted source refreshes and automatic site publication after validation. Refresh requires `ENABLE_CLOUD_REFRESH == 'true'`; publication requires `ENABLE_PAGES == 'true'`. Only the trusted refresh workflow may call deployment automatically, for its validated data commit. The owner subsequently approved and made `yhoriuchi/cosspp-global` Public and requested Pages from that same repository; this supersedes the private-source/separate-site plan. Do not create a second site repository. Manual publication remains available; no general push-triggered deployment. Keep review/history/raw caches private and preserve source and public self-report checks.
- Maintain one private project history at `project_history/Yusaku_Horiuchi/YYYY-MM-DD by Codex.md`, following the canonical Project History Guide and current AI-use guide. Record runtime fields independently; do not infer active settings from defaults.
