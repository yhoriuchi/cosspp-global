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
