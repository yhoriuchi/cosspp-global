# COSSPP Global implementation plan

Owner: Yusaku Horiuchi. Started 2026-10-27 in the existing project root. Scope: a working local static research directory, evidence-backed faculty data, verification and publication preparation. No remote repository, push or deployment is authorized.

## Architecture decisions

React + TypeScript + Vite; JSON canonical public records; strict Zod runtime/build validation; query-parameter routes; plain CSS; D3 geographic projection with a local Natural Earth map. No backend, login, telemetry, commercial tiles, external font service or remote image dependency. Faculty initials are original placeholders. pnpm lockfile fixes dependency versions; npm can invoke scripts after installation.

## Phase status

1. Audit and plan: empty workspace confirmed; no files, repository or remote to preserve. Project instructions, schemas, plan and documentation created.
2. Website: home, directory, profiles, geography, departments, about, public-source update guidance, responsive light/dark styling implemented.
3. Collection: principal six rosters enumerated and reconciled, plus interdisciplinary programs/centers; no fictional public records.
4. Enrichment: sourced topics, methods, research geography and selected academic-background fields added; many biographies remain unenriched. Language information remains intentionally empty without confirmation/consent.
5. Refinement: local world map with equivalent country/region links, URL-based filters, unknown/missing states and appointment filters implemented.
6. QA: strict schema, search/CSV tests, source-link checks, build/privacy audit and browser tests; see QA.md for actual results and limits.
7. GitHub Pages: public repository and site launched on 2026-10-27 after cloud validation and browser tests; automated source refresh remains disabled.

## Completion boundary

A working local application and verified-source seed dataset can be delivered without claiming a complete institutional census. Current directory placement is provisional employment evidence. Department reconciliation, faculty confirmation, inaccessible links and fuller center coverage remain explicit prelaunch/maintenance work. No language absence is interpreted as monolingualism.
