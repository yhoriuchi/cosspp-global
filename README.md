# COSSPP Global

**Faculty Expertise & Connections**  
Connecting faculty across countries, cultures, and disciplines.

A functional, independently developed research directory for Florida State University's College of Social Sciences and Public Policy. Built for faculty collaboration, international partnerships, graduate mentoring, conferences, grants and policy expertise discovery. Live site: [COSSPP Global](https://yhoriuchi.github.io/cosspp-global/), published on 2026-10-27 from the owner-approved public repository. This independently developed project is not officially endorsed by FSU.

## Run locally

The project is already installed in this workspace. This launcher uses an ordinary Node/pnpm installation or the existing Codex desktop runtime:

```sh
./scripts/local.sh dev
```

Open the localhost URL printed in the terminal. Stop with Ctrl+C. To preview the prepared production build:

```sh
./scripts/local.sh preview --base /cosspp-global/
```

Open `http://127.0.0.1:4173/cosspp-global/` unless Vite prints a different port. For a fresh checkout, install Node.js 22.12+ (Node 24 recommended) and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

No account, backend, environment secret or paid database is needed for the website itself. Optional cloud source refreshes require GitHub and an OpenAI API key; see [cloud setup](docs/CLOUD_REFRESH.md). Only local loopback is bound by default. In restricted Codex sandboxes, starting a server/browser may require the app's normal network approval mechanism.

## What is implemented

- Home page with search, actual dataset counts, explicitly labeled example searches and a compact, uniformly colored Tallahassee-centered world illustration beside the headline, with search beneath the headline. Explore geography provides the interactive research map in the original world layout; both omit Antarctica.
- Fast name/topic/country/region/language/method search, accent-insensitive matching, combined multi-select filters, clear/reset, name/department sorting and meaningful empty states.
- OR within each filter group; AND across groups. Multiword free text matches all words across a profile. Department filters include documented additional affiliations.
- Faculty cards and direct-link profiles with prominent official-page, personal-site and CV links, evidence/source details, appointment categories and guidance to keep public faculty profiles/CVs current.
- Faculty-facing wording emphasizes discovery and source context; scope and confirmation methods are explained on About without repeated absence notices on individual profiles.
- Country/region explorer using local public-domain Natural Earth geometry and D3, plus equivalent accessible links without a map. Regional searches include country expertise (Japan → East Asia and Asia); search, exploration counts and visible region labels share the same [geographic membership rules](docs/REGION_SEARCH.md).
- Department browsing, scope/privacy explanation, responsive light/dark modes, keyboard controls and visible update dates.
- Typed JSON, strict publication validation, CSV import/export, private coverage/link reports, unit/browser tests and a disabled-by-default GitHub Pages deployment workflow.

Query routes such as `?page=directory&country=JP&department=Political+Science` and `?page=profile&id=yusaku-horiuchi` refresh under a GitHub Pages repository subpath without a server rewrite.

## Dataset after CV review — 2026-10-27

| Measure | Collected records |
|---|---:|
| Distinct people | 176 |
| Current regular/teaching appointments in default results | 155 |
| Documented research interests | 116 |
| Source-supported research countries and/or regions | 57 |
| Country-specific research information | 46 |
| Official profile or official directory/card link | 176 |
| Individual-profile URL pattern (heuristic) | 124 |
| Personal academic website links | 60 |
| CV links | 81 |
| Accessible CVs reviewed for relevant research/language information | 79 |
| Profiles with publicly self-reported languages | 18 |

The follow-up reviewed source links for all 176 records and supplemented 91 profiles. Explicit public self-reports support 44 language entries across 18 people; skill levels are not inferred. American Politics and explicitly U.S.-focused research support United States. CVs that could not be accessed remain unresolved; linked CVs may be older than current official profiles.

The six principal main rosters were systematically retrieved/reviewed: Political Science, Economics, Sociology, Geography, Urban and Regional Planning, and Askew Public Administration and Policy. Additional records and affiliations come from International Affairs, ISS/Integrated Studies, Public Health, African American Studies, Demography and selected centers. Some indexed pages could not be verified live. This is not a certified census, and geography coverage includes the United States and cross-national work. Missing fields mean unrecorded, not absent expertise.

Current records with unresolved primary departmental homes can still appear when the official source establishes a current teaching appointment; `Unknown` is not counted as an academic unit. Unresolved appointment status, upcoming arrivals, visitors, adjuncts and affiliates are excluded by default and available through the appointment toggle. See [source inventory](docs/SOURCE_INVENTORY.md) and [verification policy](docs/DATA_VERIFICATION.md).

## Commands

Use `pnpm run <name>`, `npm run <name>` if npm is installed, or `./scripts/local.sh <name>` on this computer.

| Command | Purpose |
|---|---|
| dev | Local Vite development server |
| validate | Strict schema, evidence, duplicates, ISO codes and language self-report provenance checks |
| test | Search/filter/publication-gate/CSV unit tests |
| build | Validation + TypeScript + production build + artifact privacy/base-path audit |
| preview | Serve `dist/` locally; match its build base |
| coverage:data | Private `data/review/coverage.json` with actual denominator/caveats |
| links:check | Conservative rate-limited source-link check, private report |
| data:export | Export all public fields to private CSV; optional output path |
| data:import path.csv | Validate CSV into private candidates; never auto-promote |
| test:e2e | Desktop/mobile Chromium and iPhone WebKit workflow, profile, routing and accessibility tests |
| format | Format project source with Prettier |

For the repository-subpath test build:

```sh
BASE_PATH=/cosspp-global/ ./scripts/local.sh build
# Install a test browser once on a normal environment:
pnpm exec playwright install chromium webkit
pnpm run test:e2e
```

On this Mac, tests can use the installed Chrome without downloading a browser:

```sh
PLAYWRIGHT_CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ./scripts/local.sh test:e2e
```

The browser-test preview configuration explicitly uses `/cosspp-global/`. CI build derives the path from the eventual repository name. A root-site build uses `BASE_PATH=/`. See [QA](docs/QA.md) for measured outcomes and limitations.

## Maintain the data

Edit `data/public/faculty.json` only with source-supported facts. Keep stable IDs. Every populated substantive field requires reviewed source evidence; preserve extraction/review/retrieval distinctions and access dates. Use private candidates for uncertainty. The strict schema rejects unknown/private properties, inferred or unsourced languages and unsupported fields. Run validate/tests/build after promotion.

For CSV edits, export, edit nested JSON cells carefully, import to private candidates, review and then promote. Export neutralizes formula-like cells; import restores their literal text. Read the [data dictionary](docs/DATA_DICTIONARY.md), [collection workflow](docs/DATA_COLLECTION.md) and [verification policy](docs/DATA_VERIFICATION.md) before changing research classifications.

## Project map

- `AGENTS.md`: persistent project/evidence/privacy/deployment rules.
- `src/components/`, `src/pages/`, `src/utils/`, `src/types/`, `src/styles/`: application, schema and search/CSV logic.
- `data/public/faculty.json`: public records; `data/schemas/`: structural schema; `data/sources/inventory.json`: source inventory.
- `scripts/`: validation, coverage, link checks, CSV, schema generation, build audit and local launcher.
- `tests/`: fictional unit fixtures only; `tests/browser/`: real rendered workflows. No fictional public records.
- `public/world.geojson`: local public-domain map. Official university logos are withheld pending confirmation of permission for this site; no faculty photos.
- `docs/`: plan, dictionary, source inventory, collection, verification, privacy, design, deployment, QA, roadmap and third-party notices.
- `.github/workflows/pages.yml`: checked publication; `.github/workflows/refresh.yml`: weekly cloud research, validated data commits and owner-authorized automatic publication.
- Ignored/private: `data/review/`, raw caches, `.local/`, test output and one project history under `project_history/Yusaku_Horiuchi/`.

## Before publication

The build exposes only the public schema and static assets. A public repository would also expose code/docs/public data. No citizenship, internal review notes, private history, photos or inferred or unsourced languages belong in either. Faculty confirmation has not yet been obtained. The owner’s update policy routes changes through faculty-maintained public profiles/CVs. Configure and verify periodic automated source refreshes before describing them as operational; the cloud workflow is prepared but its first remote run is not yet verified. Review institutional representation, permissions/licensing, data/source gaps and staged/history contents.

**Do not create a remote repository, push or deploy without explicit owner approval.** On 2026-10-27 the owner approved the `yhoriuchi/cosspp-global` repository (subsequently made Public by the owner), weekly cloud refreshes and publication after validation. The workflow has no general push trigger; deployment requires `ENABLE_PAGES=true` and either manual dispatch or a validated refresh commit. See [cloud setup](docs/CLOUD_REFRESH.md). Exact authorization steps are in [DEPLOYMENT.md](docs/DEPLOYMENT.md). Remaining research and future secure editing/expansion are in [ROADMAP.md](docs/ROADMAP.md).
