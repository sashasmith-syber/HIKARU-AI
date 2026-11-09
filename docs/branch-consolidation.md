# Branch and PR consolidation inventory

## Snapshot and method

This is a read-only inventory captured on **2026-11-09, 09:55–10:03 UTC**.
GitHub API branch heads and open-PR head/base values were read during that
window; the local branch comparison was performed after fetching those refs.
The SHA in each row is the full remote head captured in that snapshot. All
open PRs listed below target `main` at
`614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8`, except PR #1, whose recorded base
is older. A row is evidence of a head and net path delta, not merge readiness.

The comparison used fetched refs and `git diff origin/main origin/<branch>`.
For PR #1, this shallow clone did not have a usable merge base; GitHub records
its older base SHA as `0b82ac607d1d45da087b8c120653cd604739ad42`. No branch was
merged, rebased, deleted, or force-pushed. Open PRs are all API-reported
`mergeable_state=blocked` at the snapshot; that field does not explain the
blocker.

## Remote branch heads

| Remote branch | Full head SHA | Net path delta vs `main` |
| --- | --- | --- |
| `bff-secure-backend` | `a51ccf85f6d37e98353e80a1a48cfd902737fcde` | `.gitignore`, `index.css`, `index.html`, `package-lock.json`, `package.json`, `server/worker.mjs`, `src/App.tsx`, `src/components/AuthModal.tsx`, `src/components/BackendStatusBanner.tsx`, `src/components/InputBar.tsx`, `src/context/AppContext.tsx`, `src/services/geminiService.ts`, `src/services/geminiServiceBFF.ts`, `tests/bff-gate.test.mjs`, `vite.config.ts`, `wrangler.toml`; no PR. |
| `copilot/add-dependency-lockfile` | `660a9c0cc08ccbf7a565c444e091363053a55113` | `.github/workflows/codeql.yml`, `package-lock.json`; closed unmerged PR #15. |
| `copilot/add-gitignore-secrets-hygiene` | `cb273bb15621c65e1707b46bf48e66a71aa61795` | `.env.example`, `.gitignore`, `README.md`, `SECURITY-HARDENING.md`, `src/services/geminiService.ts`, `vite.config.ts`; closed unmerged PR #16. |
| `copilot/add-mit-license-and-update-readme` | `6eba1eec00d3319c02c2e967d5bb2ed36196ebac` | `.github/workflows/codeql.yml`, `LICENSE`, `README.md`, `docs/branch-consolidation.md`, `wrangler.jsonc`; open PR #28. |
| `copilot/canonical-state-documentation` | `f4bf3c6d9f16105824b700f5dec8137cb8c0e550` | Initial-plan-only head at the inventory snapshot; open draft PR #31. |
| `copilot/hikarua-phase-1-remediation` | `d3fcff7c59861631f75f7583afb6436bf9cefb64` | `.env.example`, `.github/CODEOWNERS`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/dependabot.yml`, `.github/workflows/dependency-review.yml`, `.github/workflows/secret-scan.yml`, `.gitignore`, `CONTRIBUTING.md`, `README.md`, `SECURITY.md`; open PR #29. |
| `copilot/run-deepscan-audit` | `930c43b7cbb445f61771f1290729750ae02443c8` | 20 paths: CI/Husky, audit reports, ESLint config, lock/manifest, UI/styles/metadata, and source changes; open PR #1, older base. |
| `copilot/update-anthropic-wif-test-workflow` | `b138b69392905734b128f4b6941cc34bd49cca72` | `.github/workflows/anthropic-wif-test.yml`; open PR #25. |
| `main` | `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8` | Canonical baseline; `v3_6_0` tag target. |
| `sashasmith-syber-patch-1` | `093e1d55e30c17a29cd1c86320a3603285a04fa2` | `Ait enterprice harden`; open PR #3. |
| `sashasmith-syber-patch-2` | `37d6c9f88776137448a4dd29dba4a6658019de42` | `.github/workflows/stainless-sync.yml`; open PR #4. |
| `sashasmith-syber-patch-3` | `134588e47c11ccb1a3629fc3692e6a6a1f206ee5` | `openapi.yml`; open PR #5. |
| `sashasmith-syber-patch-4` | `7a3909be6d73467c3faec1dc6c5bcaf6932ae9dc` | `.github/dependabot.yml`; open PR #6. |
| `sashasmith-syber-patch-5` | `54edfc92339563cf12d00e414884a97e21c14e41` | `.github/workflows/codeql.yml`; old proposal, no open PR on this head. |
| `sashasmith-syber-patch-6` | `9fae6b9885b29944f56dce9d46d3f4086f453498` | `.github/workflows/dependency-review.yml`; open PR #8. |
| `sashasmith-syber-patch-7` | `208382e733eb1679a3ef95095b35ede7959848ab` | `.github/workflows/secret-scan.yml`; open PR #9. |
| `sashasmith-syber-patch-8` | `9c9a45c5bc15807b53afcaf8f2fa054607e8686f` | `README.md`; open PR #21. |
| `sashasmith-syber-patch-9` | `4a6e19d68c09aedd6db2c80c81b71b132039799a` | `SECURITY.md`; open PR #11. |
| `sashasmith-syber-patch-10` | `d4942cf2dc7a4c582578a6d1d409ccf53f46a162` | `src/perplexity.ts`; open PR #12. |
| `sashasmith-syber-patch-11` | `6ca22a13395c61bfae99854e9cf54de2562da82a` | `src/auth.ts`; open PR #13. |
| `sashasmith-syber-patch-12` | `69e565d106fbcb89e9de38a27693a516c2287cbc` | `tools/scan_inventory.py`; current head is unverified against closed PRs #22, #24, and #26. |
| `sashasmith-syber-patch-13` | `0cc642b0d1f53b85863434ceadd8b9446b3dd665` | `hikaru-logo-3d-acidgreen.png`; open PR #27. |
| `sashasmith-syber-patch-14` | `1223ec99b6d2ae2ee5f23fe6d3089df82fd30a0e` | `CODE_OF_CONDUCT.md`; open PR #30. |

## Open PR disposition

Each recommendation is for operator review only. **No PR is being merged,
closed, or changed by this inventory.**

| PR | Reviewed head SHA | Unique change and dependencies | Recommendation / blocker |
| --- | --- | --- | --- |
| #1 | `930c43b7cbb445f61771f1290729750ae02443c8` | Audit/type-safety edits, extensive UI changes, ESLint/Husky, 6,615-line lockfile, reports, and CI workflow. Its UI delta removes the artifact viewer. Older base SHA; no usable merge base in this shallow checkout. | **Retain selectively; supersede the branch as a whole.** The current PR adopts narrowly scoped `Part[]`, `unknown` error, and root-element type guards, but not UI deletions, reports, workflow permissions, hook setup, or new ESLint dependencies. Reconcile any remaining useful changes separately after rebase and behavior review. |
| #3 | `093e1d55e30c17a29cd1c86320a3603285a04fa2` | Script intended to change repository/organization settings and write files across multiple repositories. | **Do not run; retain for separate operator review only.** Explicitly outside the authorized scope; no settings or other repositories were changed. |
| #4 | `37d6c9f88776137448a4dd29dba4a6658019de42` | Stainless sync workflow; depends on PR #5's API spec and a `stainless.yml` absent from `main`; external publishing behavior. | **Retain only as a separate future proposal.** Needs verified contract/configuration and separate explicit approval for external upload. Not run. |
| #5 | `134588e47c11ccb1a3629fc3692e6a6a1f206ee5` | `openapi.yml` describes routes not implemented on `main`; history includes PR #14 merged into this branch, not `main`. | **Keep as a proposal; do not treat as implemented API.** Reconcile with an approved backend contract before generating clients or enabling #4. |
| #6 | `7a3909be6d73467c3faec1dc6c5bcaf6932ae9dc` | Dependabot npm, pip, and Actions configuration with unsupported Python ecosystem and irrelevant groups; review notes also flag timezone and ecosystem fit. | **Superseded by this PR's npm + GitHub Actions-only configuration.** Python manifests are absent from this repository. |
| #8 | `9fae6b9885b29944f56dce9d46d3f4086f453498` | Dependency-review workflow with write permissions/comments, unsupported license policy decisions, and misleading Scorecard/advisory comments. | **Superseded by this PR's read-only SHA-pinned review.** Current workflow covers high/critical findings in runtime, development, and unknown scopes without licensing policy. |
| #9 | `208382e733eb1679a3ef95095b35ede7959848ab` | TruffleHog/Gitleaks workflow uses a moving action ref, event-incompatible ranges, unnecessary write permissions/comments, and live verification. | **Superseded by this PR's read-only validated-range scan.** It does not verify credentials, post comments, or use `pull_request_target`. |
| #11 | `4a6e19d68c09aedd6db2c80c81b71b132039799a` | Security policy includes unverified support claims about other repositories and unsupported posture/SLA statements. | **Superseded by this PR's repository-scoped `SECURITY.md`.** No statements about other HIKARU repositories are made. |
| #12 | `d4942cf2dc7a4c582578a6d1d409ccf53f46a162` | Proposed Perplexity service, tier routing and optional Supabase usage/cost writes. | **Retain separately as unimplemented proposal.** Adds external-provider, dependency, persistence, and possible spend decisions not authorized here. |
| #13 | `6ca22a13395c61bfae99854e9cf54de2562da82a` | Proposed API-key/tier middleware and Supabase rate limits. Depends on #12's tier type; import path/dependency and database contract are unresolved. | **Retain separately; do not integrate.** The proposal's fail-open rate-limit path, method/resource authorization, migration, and concurrency behavior need review. No database or auth integration was added. |
| #21 | `9c9a45c5bc15807b53afcaf8f2fa054607e8686f` | README rewrite with unverified features and static-host `GEMINI_API_KEY` instructions. Review threads identify citation artifacts and client-key exposure. | **Superseded by this source-grounded README.** |
| #25 | `b138b69392905734b128f4b6941cc34bd49cca72` | Anthropic WIF workflow; PR description says it has not been run and depends on external identity/federation setup. | **Retain for separate review, do not run.** External auth, token exchange and model configuration are unverified. |
| #27 | `0cc642b0d1f53b85863434ceadd8b9446b3dd665` | Branch tree contains a PNG asset; PR response says the reviewable diff was unavailable/empty. | **Hold for provenance and intent confirmation.** Do not adopt an unexplained asset. |
| #28 | `6eba1eec00d3319c02c2e967d5bb2ed36196ebac` | Source-grounded README, branch inventory, MIT license, CodeQL workflow, and Cloudflare `wrangler.jsonc`. | **Supersede documentation/inventory; retain no license/deployment decision.** The README and inventory are refreshed here. The PR contains a conflicting proposed MIT year (2026) versus #2 (2025); this PR adds no license. The preview check succeeded earlier, but the latest Cloudflare build failed; the CodeQL scope thread remains unresolved. No deployment cleanup is claimed. |
| #29 | `d3fcff7c59861631f75f7583afb6436bf9cefb64` | Governance, secret ignores/template, Dependabot, dependency review, and TruffleHog workflow. | **Consolidate suitable phase-one files here; supersede the original PR by review, not by an external PR action.** The current head's secret scan is `action_required`, not a failed finding; older successful checks do not validate this SHA. |
| #30 | `1223ec99b6d2ae2ee5f23fe6d3089df82fd30a0e` | Contributor Covenant Code of Conduct. | **Retain as a separate optional policy proposal.** No code dependency; operator review of intended community policy remains. |
| #31 | `f4bf3c6d9f16105824b700f5dec8137cb8c0e550` | This consolidation task; at snapshot it contained only the initial plan. | **This is the single review target.** Its later implementation head must be reviewed before any merge decision. |

All open PRs were reported blocked by GitHub at the snapshot; that status alone
does not identify whether the cause is review, checks, conflicts, or settings.
Where a check or review cause was available, it is recorded in
[`canonical-state.md`](canonical-state.md).

## Unmerged backend alternatives

`bff-secure-backend` is not associated with an open PR. It uses a shared
`PREVIEW_AUTH_TOKEN`, a server-side Gemini key, and a Worker with chat/image
routes and a Node gate test. Its UI asks the user to enter the shared token;
the proposal explicitly does not support live audio. The code only checks
`Content-Length` before calling `request.json()` (not a hard bound when the
header is absent or inaccurate), truncates oversized message/text counts,
advertises wildcard origin on its CORS preflight, accepts forwarded-IP
fallback headers, places the provider key in the upstream URL, and may
propagate upstream error detail. Its in-memory per-IP limit is not a
production abuse-control system. No Worker or
auth configuration is present on `main`, and deployment is not approved.

Closed PR #23 (`5dbe57c70d9a82812c2f62e3695ab08560cfcade`) proposes a different
Cloudflare Pages Functions design, including short-lived live-audio tokens,
KV/local rate limiting, and a dev middleware path. It is an alternative, not a
piece of the Worker branch; its summary records outstanding runtime and
deployment verification. Neither architecture is selected here. The current
client disables provider calls rather than deploying an unauthenticated or
unreviewed paid-provider proxy.

Closed PR #16 (`cb273bb15621c65e1707b46bf48e66a71aa61795`) renames the key to
`VITE_GEMINI_API_KEY`; that remains browser-visible and is not a server-side
secret. Do not copy that runtime approach.

## Historical licensing and notices

Canonical `main` has no root `LICENSE` or `NOTICE` file. Closed PR #2
(`05e2aa81b61761f3ca8ea5e09f5da903d637a33e`) proposed MIT with 2025
copyright; open PR #28 requests 2026. Neither establishes a license on `main`.
No new license or third-party notice is selected or overwritten here.

## Proposed review order

1. Review this PR's disabled-browser boundary, tests, lockfile, and docs as one
   change. Confirm the production-readiness statement and licensing conflict.
2. Keep the narrowly selected type-safety changes from #1; independently
   review/rebase any further audit changes. Do not import its UI changes,
   audit artifacts, hook, or CI workflow wholesale.
3. Review the phase-one safeguards consolidated here. Verify actual emitted
   check names/eligibility before any separate branch-protection decision.
4. Decide licensing explicitly in a separate review. Reconcile #28, #2, and
   any third-party notices before adding a license.
5. Select and threat-model one server-side Gemini architecture only after
   authorization/token provisioning, hard request/body limits, safe errors,
   model scope, audio behavior, rate-limit semantics, tests, and hosting
   bindings are approved. Do not combine the Worker and Pages Functions
   proposals unchanged.
6. Only after an implemented API contract exists, review #5 and any dependent
   external publishing workflow #4. Review #12/#13 separately if external
   provider, database, billing, and auth decisions are approved.
7. Review policy/asset/integration proposals #25, #27, and #30 separately.
   Never run #3 or #25 as part of this inventory.
8. Reassess open/closed PRs and branches only after their unique useful work is
   preserved or explicitly declined. Cleanup is not complete.

No PR was merged or closed, no branch was deleted, no settings were changed,
no deployment was performed by this inventory, and no external publishing or
provider call was made.
