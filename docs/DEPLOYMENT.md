# GitHub Pages and cloud refresh

The owner approved and created the private personal repository `yhoriuchi/cosspp-global` on 2026-10-27. Code upload, API credentials and the first cloud deployment remain to be verified. No institutional account is used. The application is ready for local preview and review. Dataset completeness and institutional permission are separate from technical readiness.

## Local use

Install Node.js 22.12+ (Node 24 used in QA) and pnpm 11.25.0. Run:

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

For root-path production preview:

```sh
pnpm run build
pnpm run preview
```

For a repository named `cosspp-global`, build AND preview with the same base:

```sh
BASE_PATH=/cosspp-global/ pnpm run build
pnpm run preview --base /cosspp-global/
```

With pnpm, direct forwarding also works as `pnpm exec vite preview --host 127.0.0.1 --base /cosspp-global/`. Use the URL printed by Vite. Query-parameter routes require no GitHub 404 fallback: `/<repository>/?page=profile&id=<stable-id>` and directory filter links refresh at the repository root. The initial browser test exposed a preview-base mismatch; matching preview/build bases fixed it.

## What publication would expose

- Static site: all `data/public/faculty.json` fields after validation, source citations, research metadata, public professional email/profile/CV links, site copy, CSS/JS and local public-domain map.
- Public repository: source, public data, documentation, schema and workflow. Private review files/history/raw caches are ignored, but must also be absent from tracked history. Publishing is more than uploading `dist/` if the repository is public.
- No citizenship, photos, logos, internal notes, unapproved languages, consent records or private project history.

## Unresolved release decisions

Review appointment/source conflicts and indexed-only evidence, directory-link fallbacks, incomplete research enrichment, center/affiliate coverage, source links not revalidated live, project license and faculty correction opportunity. Confirm the source-update guidance and independent-project wording. Verify periodic refresh execution before describing it as active; no maintainer correction mailbox is offered. Institutional endorsement and protected branding are not assumed.

## Approved remote operations and activation

On 2026-10-27 Yusaku explicitly approved creating the private personal repository,
pushing the reviewed project, weekly cloud source refreshes and automatic public
site updates after validation. The source repository stays private. This replaces
the earlier per-deployment manual approval requirement for this project.

See [CLOUD_REFRESH.md](CLOUD_REFRESH.md) for activation, secrets, operating limits,
costs, failure handling and pause controls. No general push-triggered deployment
is configured. Both manual deployment and the trusted refresh workflow require
`ENABLE_PAGES=true`. The reusable Pages workflow checks out the exact validated
revision, installs locked dependencies, validates data, runs unit/browser tests,
builds the repository subpath, audits artifacts and publishes only `dist/`.

A private repository does not make its Pages website private. Verify the account's
Pages eligibility and final public URL before declaring launch complete. API keys,
review notes, raw caches, local tools and project history stay out of Git and Pages.
