# Verification and faculty review

1. Establish current appointment from the official unit roster. Record the actual URL and observation date. Capture explicit visitors, adjuncts, future start dates and unresolved primary appointments.
2. Read each claim in context. Link every populated public field to a source entry; grouped evidence can support several fields from the same roster/profile. Individual country classifications require substantive research context. A title alone is an enrichment lead, not sufficient evidence.
3. Prefer the current official FSU profile, current permitted CV, faculty academic website, institutional center biography, then reliable scholarly sources. Resolve older title conflicts using newer explicit evidence and retain unresolved cases privately.
4. Keep extraction and review separate: automatic extraction plus reviewed_by agent retains the collection history. Agent review does not mean human review or faculty confirmation. Source_verified only says the published claim is supported by the recorded public source.
5. Deduplicate across programs by name/profile/appointments. Preserve one stable ID and the primary appointment, with additional affiliations separately. Review near matches manually; normalized exact-name/ID duplicates fail validation.
6. Do not publish pending geographic claims. Leave public fields empty while retaining private candidates and questions. Default results exclude upcoming/unknown appointments and nonregular categories.
7. Never infer languages or identity information. Under the owner-approved policy of 2026-10-27, publish languages explicitly stated in a public CV or the faculty member's own academic profile, with a reviewed source URL, access date and the original proficiency wording when provided. Separate publication consent is not required for these public self-reports. Do not infer proficiency, or treat public self-report as confirmation of this directory. A publication language, name, nationality, education or research location is not evidence of language ability.
8. Review available public CVs as well as profiles for research interests and geographic expertise. Explicit American Politics or research focused on the United States supports United States as a research country; an American employer, degree or journal does not. Make verified homepage/CV links prominent near the top of profiles.
9. Under the owner's 2026-10-27 instruction, display faculty portraits found on official FSU pages. Verify the association with the named profile or roster card, record the official image URL and a directly reviewed page source, and exclude logos and placeholders. Do not identify people by facial recognition or infer personal characteristics. Load images from their official HTTPS locations; keep initials when a portrait is absent or cannot load. This does not assert a Creative Commons license or faculty confirmation. University marks remain excluded.
10. Run validation, CSV round-trip tests, source-link review and appropriate build/browser checks. Inspect production artifacts for leakage.

## Profile update workflow

Faculty should update their own faculty profile page or publicly available CV. The directory is intended to collect changes through regular automated source refreshes; it does not route individual profile-edit requests to Yusaku Horiuchi. Published faculty professional contact links remain for academic contact, not directory corrections.

The monthly cloud source-refresh workflow is prepared; see [configuration and activation](CLOUD_REFRESH.md). Public copy therefore describes the intended design, not a verified active schedule. Configure and verify the refresh execution separately before claiming it is operational. During refreshes, verify source changes, amend only affected fields and evidence, update last_updated/last_verified, run checks and record changes privately. The same public self-report and provenance requirements apply to language updates. The owner has authorized automatic publication after validation; each changed language entry must have fresh, directly reviewed evidence.

## Remaining evidence limits

A profile may be source-verified while its present appointment is unknown; the unknown status remains explicit and excludes it from defaults. Source dates mean access/review dates, not publication dates. Directory listing and CV link counts do not establish complete coverage or current CV availability. Some records rely on search-index copies when live official pages fail. Recheck live sources before public launch and retain uncertainty where evidence conflicts.

A future secure faculty-review process could add FSU SSO, faculty-owned drafts, administrative approval, consent tracking, revision history and scheduled refreshes. Do not place any private approval queue in a static site's JavaScript.

## Owner-curated directory scope

On 2026-10-27, the owner instructed that James L. Gibson be listed under Political Science only. Keep his additional_affiliations empty during routine refreshes, even if source biographies mention an outside appointment. This is a directory-scope choice, not a claim that an outside appointment does not exist.

## Language display scope

Owner instruction, 2026-10-27: show languages other than English in the Language filter, faculty cards and profiles. Omit the Languages section when only English is recorded. Preserve sourced English entries in the public dataset; this display choice does not establish anyone’s English proficiency. Language-name free-text discovery uses displayed languages; legacy English-only language filters reset to All.

## Verified profile requests — owner request, 2026-10-28

The optional service is prepared but disabled pending accounts, sender-domain verification,
private queue approval/creation and secrets. It checks control of the exact FSU email
already sourced on the selected profile. A general free-text request is stored privately
and remains pending review; it is never interpreted as authority to change unrelated fields.
An explicit replacement research summary, with separate publication consent, may replace
only short_biography after signature, identity, age, schema and build checks. Publish a
minimal receipt as field evidence; do not publish the email, email hash, passcode or private
request narrative. This verifies that one submission, not every field in the profile.
The trusted profile-requests workflow may publish its validated commit under the owner's
request for automatic changes. All other source/provenance requirements remain in force.
See [service setup](PROFILE_REQUESTS.md). No paid service has been activated.
