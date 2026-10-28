# Verification record — 2026-10-27

Environment: macOS, Node 24.19.0, pnpm 11.25.0; dependency versions pinned in pnpm-lock.yaml. Browser tests used local Google Chrome 156.0.8078.48 through Playwright, with desktop 1440×1000 and mobile iPhone 13 viewport/touch emulation. Mobile is Chromium emulation, not a real iOS Safari/device test.

## Completed checks

- Strict public dataset validation: 176 records; no exact normalized-name/ID duplicates; public-field allowlist, URL syntax, source-field coverage, extraction/review distinctions, country identifiers/names, language identifiers/names/proficiency/consent and verification-status consistency passed.
- 23 unit tests passed: accent-insensitive name/text search; country/region/department/language filters; OR/AND combinations; topics/methods; missing fields; current/upcoming/visitor defaults; URL round-trip; duplicate IDs/names/geography; invalid country/language values; private/unsupported fields; unreviewed automated extraction; consent gates; CSV nested values/quotes/newlines/optional fields and formula neutralization.
- Real-data CSV export and reimport validated all 176 records into a private candidate file. This did not overwrite public data. Structural JSON Schema generated successfully.
- TypeScript checks and Vite production build passed. `/cosspp-global/` assets, query routes and refreshes verified. Static-artifact audit passed for 7 emitted files; no private field names, local personal paths, review/history files or source maps in the build.
- 10 browser tests passed across desktop/mobile: home-to-directory search; combined filters/reset/empty state; profile/back navigation and preserved query; refresh; geography navigation; unconfigured-language explanation; unknown profile; no horizontal overflow on five main pages; keyboard skip link; light/dark behavior; all 176 profiles on each viewport; private-path exclusion; map-load failure fallback; representative profile accessibility. Final mobile-filter refinement: seven checks passed in the full rerun; three mobile assertions were updated to expand the newly collapsed panel before inspecting checkbox state, and all three then passed (7.8 seconds). No application change was needed for that assertion update.
- axe WCAG A/AA automated checks found no violations on the checked home/directory/explore/departments/about pages and representative faculty profile after contrast correction; dark-home contrast also passed. This is not a complete WCAG conformance certification or a hands-on screen-reader evaluation.
- Visual inspection of desktop home/geography/profile and mobile home/directory screenshots; screenshots remain in ignored `.local/qa/` and `test-results/`. No console page errors during screenshot capture.
- Private coverage report: 176 total, 155 current regular/teaching defaults, 95 with research, 37 with geography, 27 with country-specific evidence, 57 CV links, zero approved languages, 176 awaiting faculty confirmation, zero potential duplicate pairs by first/last name, email or individual-profile URL heuristics.
- Git ignore verification confirms review data, history, QA artifacts and dependency caches are excluded. Local main branch initialized, no commits/staging/remotes/pushes/deployment.

## External source-link results

238 unique URLs classified. 21 reachable (including one corrected URL); 154 not requested because robots policy was unavailable; 54 document targets skipped; 6 targets conservatively excluded by robots; 3 redirects require review. One obsolete Andy Chang `/writing` page returned 404; current `/research` was found through navigation, retrieved with HTTP 200 and its substantive abstracts reread before replacing the evidence URL. No unresolved known 404 remains in the report, but most URLs have not been established live by this check.

The checker deliberately does not bypass missing robots policies, access restrictions or document exclusions. A prior interrupted report write was diagnosed and changed to a single final write, then completed. Direct FSU collection had succeeded for some research passes even though the later policy check failed; these are separate observations. HEAD availability is not a test of accuracy, freshness or employment status.

## Issues corrected during implementation

- Source-review coverage gaps in directory fallback URL fields and a program affiliation were made explicit.
- Automatic roster evidence retained extraction history and received reviewed_by metadata only after field-by-field comparison.
- Invalid test discovery (Vitest picking up Playwright tests) separated into the proper runners.
- Node JSON-import test incompatibility fixed by reading the fixture as JSON.
- Production preview initially used a root base against a subpath build, preventing asset loading. Preview/build bases now match and are tested/documented.
- Gold section-number contrast adjusted from a failing 4.37:1; initial-load focus corrected so the skip link is first in keyboard order.
- Mobile filter controls collapsed by default after visual inspection showed a lengthy initial filter panel.
- Build chunking separated vendor/validation/geography code; largest application chunk is roughly 342 KB (about 42 KB gzip), total JS about 145 KB gzip plus the locally served map.

## Known limits

Live remote Actions/Pages execution was not authorized and has not been tested. Safari/Firefox, actual assistive-technology users and real phones/tablets were not tested. Many faculty biographies remain unenriched, some titles/primary homes/current statuses are unresolved, several official URLs are directory fallbacks, and faculty confirmations are not yet collected. Source-policy/network limits prevent a universal link-health claim. Two harmless third-party Zod comment-annotation warnings appear during Vite builds; the build completes and no source code was altered in dependencies.

## Public Pages launch — 2026-10-27

Commit `a0b9aae` passed 176-record validation, 32 unit tests, TypeScript and the
seven-file build/privacy/base-path audit in GitHub Actions. All 12 desktop/mobile
Playwright tests passed in 49.9 seconds, followed by successful Pages deployment
(run 40575360208). The multi-page accessibility test now has a 60-second timeout
for shared runners; assertions are unchanged. Live Chrome checks verified the
homepage, Horiuchi search, profile navigation and direct reload under
https://yhoriuchi.github.io/cosspp-global/.

## iPhone blank-screen correction — 2026-10-27

The public site returned HTTP 200 but showed no heading in Playwright WebKit with
an iPhone 13 device profile. Captured startup errors identified three rejected
`CN / China` values: browser-provided `Intl.DisplayNames` labels differed from
Node/Chromium. Added `China` to the existing accepted-name aliases for `CN`,
retaining rejection of genuinely mismatched country names and all source/consent
checks. No faculty data changed.

A unit regression simulates the differing locale label and checks both valid and
invalid country names. The browser suite now includes iPhone WebKit, and Pages CI
installs WebKit as well as Chromium before publication. On macOS WebKit, the
keyboard test uses Option-Tab to reach links; focus assertions remain unchanged.
Validation of all 176 records, 33 unit tests, TypeScript/build and the artifact
audit passed. Actual iPhone hardware has not been tested by the agent.
All 18 browser tests passed locally across desktop Chromium, mobile Chromium and
iPhone WebKit (1.1 minutes), including all 176 profiles in each browser project.
The first run hit local trace-file EPERM errors; a fresh `/tmp` output directory
resolved them. The separate macOS WebKit keyboard-navigation difference was
corrected as described above.

## Country expertise in regional search — 2026-10-27

Regional search now combines explicit region tags with country membership from a
shared geographic mapping. The same helper feeds text search, filter options and
Explore geography counts. Profile claims and faculty.json are unchanged. All 249
supported ISO country/area codes have a mapping; regional membership is
one-directional and never invents individual country expertise or global/Arctic
research. See REGION_SEARCH.md for conventions and primary references.

Validation passed for 176 records, all 46 unit tests passed, and TypeScript/build
and the 8-file artifact audit passed. The current data produce 8 East Asia
matches and 13 Asia matches; both include Yusaku Horiuchi.
All 21 browser tests passed locally (1.1 minutes), including desktop Chromium,
mobile Chromium and iPhone WebKit. The new check opens East Asia from Explore,
compares its displayed count to directory results, finds Yusaku Horiuchi,
checks the filter and reload, and confirms the broader Asia search. Existing
profile, keyboard, accessibility and map tests also passed.

## Visible regional labels — 2026-10-27

Faculty cards and profile region links now use the same deduplicated regional
membership as search. Removed the card's two-region truncation so matching labels
remain visible. Yusaku Horiuchi shows East Asia and Asia alongside his existing
Global / Cross-national label. Derived-label tooltips and profile/About wording
identify geographic grouping; no public faculty data or evidence was changed.

All 176 records validate, 46 unit tests pass, and TypeScript/build plus the 8-file
artifact audit pass. All 21 browser tests passed in 50.1 seconds across desktop
and mobile Chromium and iPhone WebKit. The regression checks visible labels,
exactly one copy of each, profile region links and their directory results.

## Public CV/profile enrichment and language policy — 2026-10-27

The owner approved publishing explicitly self-reported languages from public CVs
or faculty-owned profiles with reviewed provenance, without separate consent.
This supersedes the initial consent-gate descriptions above. Source review is
still distinct from faculty confirmation of the directory.

Checked source links for all 176 records; reviewed identity and relevant
research/language sections of 79 accessible CVs. Updated 91 profiles. The dataset
now has 116 profiles with research interests, 57 with geography, 46 with countries,
60 personal-site links, 81 CV links and 44 language entries across 18 people.
Two linked CVs could not be retrieved (robots restriction and HTTP 403); a stale
HTTP 404 CV link was removed. Other CVs were not located in checked sources.
CV publication dates vary; access dates do not establish document freshness.
Private per-person review outcomes and extracted source text are ignored.

Final 176-record validation, 46 unit tests, TypeScript/build and eight-file
artifact privacy/subpath audit passed. All 24 browser tests passed (1.9 minutes)
across desktop/mobile Chromium and iPhone WebKit, including every profile route,
Japanese search, prominent homepage/CV links, self-report provenance, United
States research search, overflow, keyboard navigation and automated accessibility.
No actual iPhone hardware test was performed. Existing nonfatal Zod annotation
warnings remain. The weekly cloud source-refresh schedule remains disabled;
its validator/prompt now support fresh directly reviewed public language evidence.

The final real-data CSV export/import exactly preserved all 176 schema-normalized
records, including language provenance. Raw JSON comparison differs only because
validation supplies declared defaults; import candidates stayed private.

## Four compact directory filters — 2026-10-27

Replaced the topic/method checkbox sidebar with Department, Country, Region and
Language dropdowns immediately below free-text search. They form one desktop row
and a two-column phone grid. Search hint/placeholder explicitly include topics
and methods. Existing topic/method links and multi-value URLs still work; selecting
a dropdown value replaces that group's selection, while chips remain removable.

Validation of 176 records, 46 unit tests and TypeScript/build/privacy/subpath audit
passed. All 27 browser tests passed (1.7 minutes). After a Safari control-height
refinement, rebuilt and reran all six responsive/accessibility/dropdown checks
across desktop/mobile Chromium and iPhone WebKit: passed (30.5 seconds), including
44px minimum target height, keyboard focus, all four combined selections, topic
and method text queries, reset, reload and legacy multi-value URLs. Private visual
checks and screenshots confirm the desktop/phone layouts. Actual iPhone hardware
was not tested. No faculty data or matching logic changed.

### Official faculty portraits — 2026-10-27

- Added 169 source-linked official portraits across 176 records; seven retain initials because reviewed pages provided no usable portrait or used a university mark. Existing academic fields and sources were preserved.
- Validated all 176 records; 49 unit checks, production build and eight-file privacy/subpath audit passed. All 36 browser checks passed across desktop Chromium, phone Chromium and iPhone WebKit, including portrait navigation, initials fallback, all profile routes, keyboard use, four dropdowns and automated accessibility.
- Independently checked selected official image resources and visually reviewed contact sheets to exclude marks. Real official images loaded in Chromium and iPhone WebKit for Horiuchi, Moorthy (AVIF), Heffron Casserleigh and Taylor. Desktop and phone screenshots were inspected; no page errors or horizontal overflow. Real iPhone hardware was not available.
- External image responses are stubbed only in deterministic browser tests; live image checks use actual official URLs. Image binaries, source caches and screenshots remain private and ignored.
