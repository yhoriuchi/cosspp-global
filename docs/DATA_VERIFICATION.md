# Verification and faculty review

1. Establish current appointment from the official unit roster. Record the actual URL and observation date. Capture explicit visitors, adjuncts, future start dates and unresolved primary appointments.
2. Read each claim in context. Link every populated public field to a source entry; grouped evidence can support several fields from the same roster/profile. Individual country classifications require substantive research context. A title alone is an enrichment lead, not sufficient evidence.
3. Prefer the current official FSU profile, current permitted CV, faculty academic website, institutional center biography, then reliable scholarly sources. Resolve older title conflicts using newer explicit evidence and retain unresolved cases privately.
4. Keep extraction and review separate: automatic extraction plus reviewed_by agent retains the collection history. Agent review does not mean human review or faculty confirmation. Source_verified only says the published claim is supported by the recorded public source.
5. Deduplicate across programs by name/profile/appointments. Preserve one stable ID and the primary appointment, with additional affiliations separately. Review near matches manually; normalized exact-name/ID duplicates fail validation.
6. Do not publish pending geographic claims. Leave public fields empty while retaining private candidates and questions. Default results exclude upcoming/unknown appointments and nonregular categories.
7. Never infer languages or identity information. Languages require explicit faculty self-report, separate publication approval, date and source. Initial data have no approved language entries.
8. Run validation, CSV round-trip tests, source-link review and appropriate build/browser checks. Inspect production artifacts for leakage.

## Profile update workflow

Faculty should update their own faculty profile page or publicly available CV. The directory is intended to collect changes through regular automated source refreshes; it does not route individual profile-edit requests to Yusaku Horiuchi. Published faculty professional contact links remain for academic contact, not directory corrections.

The weekly cloud source-refresh workflow is prepared; see [configuration and activation](CLOUD_REFRESH.md). Public copy therefore describes the intended design, not a verified active schedule. Configure and verify the refresh execution separately before claiming it is operational. During refreshes, verify source changes, amend only affected fields and evidence, update last_updated/last_verified, run checks and record changes privately. Existing provenance and consent gates still apply; the owner has authorized automatic publication after validation, but obtain separate explicit permission before publishing new language details.

## Remaining evidence limits

A profile may be source-verified while its present appointment is unknown; the unknown status remains explicit and excludes it from defaults. Source dates mean access/review dates, not publication dates. Directory listing and CV link counts do not establish complete coverage or current CV availability. Some records rely on search-index copies when live official pages fail. Recheck live sources before public launch and retain uncertainty where evidence conflicts.

A future secure faculty-review process could add FSU SSO, faculty-owned drafts, administrative approval, consent tracking, revision history and scheduled refreshes. Do not place any private approval queue in a static site's JavaScript.
