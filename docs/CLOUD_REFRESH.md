# Cloud source refresh

## Owner-approved configuration — 2026-10-27

Yusaku approved weekly refreshes on GitHub-hosted runners and automatic site
deployment after validation. He subsequently explicitly approved and changed
`yhoriuchi/cosspp-global` to Public, with Pages hosted by this same repository.
No separate `cosspp-global-site` repository is needed. This supersedes the earlier
private-source/separate-output plan and per-deployment manual approval requirement.
Private review material, unapproved languages, photos and university marks remain excluded.

The repository has been created. Workflow files and local checks are prepared;
Source upload is complete. API secret registration and the first cloud refresh
run must be completed before automated source maintenance is operational.
The refresh job still deliberately requires a private repository: its candidate
artifact/log handling needs adaptation before enabling it in this public repository.
Do not enable ENABLE_CLOUD_REFRESH until that work is complete. Static-site
publication does not need an OpenAI API key.

## Execution

- `.github/workflows/refresh.yml` runs Mondays at 08:37 UTC (04:37 EDT / 03:37 EST)
  on `ubuntu-latest`, independently of the owner's computer. GitHub schedules may
  be delayed; this is periodic maintenance, not a real-time availability guarantee.
- `ENABLE_CLOUD_REFRESH=true` enables research only in this private repository on
  `main`. `REFRESH_MODEL` selects an API model; initial choice is `gpt-6.1-sol`,
  medium reasoning for source interpretation and cross-field validation.
- A dedicated OpenAI project key belongs in the Actions secret `OPENAI_API_KEY`,
  never in source, browser JavaScript, logs or chat. API usage is billed separately;
  inspect the first run's usage before relying on a monthly estimate. The 45-minute
  job timeout is a runtime bound, not a hard monetary cap. GitHub Actions/Pages
  availability and included usage depend on the account plan.
- A read-only GitHub job runs Codex with workspace-write sandboxing, network access
  for permitted academic sources, dropped sudo, and no persisted Git credentials.
  It hands off only the candidate faculty JSON to a fresh runner. Source text and
  agent-generated output are untrusted data, never executable workflow code.
- The fresh runner uses the original trusted schema/tests/scripts. It rejects
  removals, stable-ID changes, unsupported language changes, artificial confirmation,
  stale dates, indexed-only evidence for changed fields and batches over 30 changes.
  It validates/tests/builds, derives the inventory and commits only two data files.
  A concurrent `main` change rejects the push; the workflow never force-pushes.
- A successful data commit calls `pages.yml` with that exact revision. Deployment
  still requires `ENABLE_PAGES=true`. The build includes browser tests and privacy
  auditing; the deploy job alone has Pages/OIDC permissions. General pushes do not
  deploy the site. No change means no commit or unnecessary redeployment.

## Activation and recovery

1. Push the reviewed source only; confirm ignored history, review caches and local
   tools remain excluded. This source repository is public by explicit owner choice.
2. Set `REFRESH_MODEL=gpt-6.1-sol`; register the dedicated API key through GitHub
   Actions secrets. Enable GitHub Pages with the GitHub Actions build source.
3. Set `ENABLE_CLOUD_REFRESH=true`; manually run the refresh with `save=false`.
   Inspect source coverage, factual diffs, API usage and all job results. Do not
   equate a schema pass with proof that every factual inference is correct.
4. Set `ENABLE_PAGES=true`, run the initial Pages deployment with `publish=true`,
   then verify the public URL and repository-subpath routes. Future scheduled
   runs save and publish validated changes under the owner's standing approval.
5. Use GitHub Actions failure notifications. On failure, inspect saved outputs and
   the branch/site revision before retrying. An interrupted deployment may already
   have saved a data commit: rerun the failed deployment or manually deploy that
   commit, rather than repeating paid research. Existing published data stays live
   when a refresh fails. Set `ENABLE_CLOUD_REFRESH=false` to pause paid research;
   set `ENABLE_PAGES=false` to pause publication.

This process can read only sources whose access policy permits retrieval. A
publicly linked CV may still prohibit automated downloading. Missing sources do
not erase faculty expertise. The initial roster is not a certified census, and
automated source review cannot guarantee perfect interpretation or complete weekly
coverage. The workflow logs identify the run; data commits retain field evidence.
Private project history remains local and must never enter the Pages artifact.

## References checked 2026-10-27

- [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action)
- [GPT-6.1 Sol API model](https://developers.openai.com/api/docs/models/gpt-6.1-sol)

Public-repository schedules can be disabled after 60 days of repository inactivity;
this applies to the now-public repository. A disconnected Mac does not stop a GitHub-hosted
runner. Cloud authentication, billing and service availability still apply.
