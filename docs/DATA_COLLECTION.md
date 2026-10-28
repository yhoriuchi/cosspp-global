# Data collection and maintenance

## Initial collection, 2026-10-27

Three bounded research passes enumerated the six principal departments and inspected program/center sources. Main roster HTML was parsed where ordinary public retrieval succeeded and then cross-checked field by field. Otherwise the official pages' indexed text was read and marked search_index. Research claims were read in context and paraphrased. No account, authenticated endpoint or anti-bot bypass was used.

The FSU robots file was checked before programmatic retrieval. The initial collector conservatively treated document exclusions as applying to every agent and therefore did not read CVs. On 2026-10-27, a subsequent review found that the PDF/DOC/DOCX exclusions belong to the Twitterbot group; the generic group restricts `/wp-admin/` and `/iop/`. The CV enrichment pass applies the matching user-agent group and reads permitted documents. Public HTML requests were slow and sequential. Direct web retrieval sometimes returned 502/timeouts/DNS failures; indexed official copies were labeled, not presented as live-page verification. Access dates reflect the review date.

Private intermediate JSON, original handoff notes and one-time integration script are in `data/review/`. They are ignored and excluded from both public build and prospective public Git history. The final public JSON, evidence URLs and source inventory make the public claims inspectable without disclosing internal work notes. Temporary full HTML is not included or republished.

## Safe repeatable update workflow

1. Read AGENTS.md, this guide, source inventory and current schema. Review the current robots/terms for each domain; policies may change.
2. Use the official unit roster to identify additions, departures, status changes and ambiguous cross-listings. Do not infer status from an old biography or faculty name. Retain stable IDs for existing people.
3. Enter candidates in a private JSON/CSV file. `pnpm run data:export` produces a starting CSV. Nested fields remain JSON in cells; do not flatten away evidence.
4. For each proposed enrichment, read the substantive source context, add URL/access date/field list/evidence, identify retrieval method and distinguish automatic/agent/human review. Never reuse old evidence for a new claim.
5. `pnpm run data:import path.csv` validates to private candidates. Review changes manually, deduplicate and promote only supported public fields into `data/public/faculty.json`. Unknown fields are rejected by the strict schema.
6. Run validate, unit tests, build and relevant browser tests. Run coverage:data for the private completeness report. Inspect the source diff and public build; update documentation/history.
7. The owner approved automatic publication of validated cloud-refresh changes on 2026-10-27. See [cloud refresh](CLOUD_REFRESH.md) for the pipeline, activation and failure handling. Other remote operations still require explicit authorization.

## Link checking

`pnpm run links:check` checks all unique source/profile/CV URLs, or append a numeric limit for a bounded run. It checks robots first, conservatively honors the union of Disallow rules across groups, sleeps 1.25 seconds between requests, skips document targets, uses HEAD, does not follow redirects automatically and never retries around access controls. Unavailable robots policy means no content request. An indexed source, extraction of a hyperlink, HEAD error or redirect is not proof of a broken page. Review returned classifications in `data/review/link-report.json` and do not claim universal accessibility.

The link checker assesses availability, not accuracy or freshness. Faculty confirmation and current-appointment reconciliation require editorial review.
