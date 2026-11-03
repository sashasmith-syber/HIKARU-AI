# Branch and PR consolidation inventory

## Snapshot and method

This is a read-only inventory captured on 2026-11-03 before the documentation and license changes in this PR. All 20 remote branch heads were fetched and compared with `origin/main` at `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8`. The listed SHA is each branch's full tip SHA at that snapshot. File deltas are the net path changes from the merge base to the branch tip, not a claim that those changes are ready to merge.

The comparison used `git merge-base origin/main <branch>` and `git diff --name-status origin/main...<branch>`. GitHub PR state, base/head refs, and changed-file summaries were checked separately; review threads for PRs #2 and #21 were also read. “Open” and “closed” describe GitHub state at the snapshot. “Superseded” refers only to an earlier review proposal with a later competing revision; it does not mean its unique code was merged or preserved. “Unverified” means there is no open PR for the current tip or its external behavior has not been demonstrated.

## Remote branch heads

| Remote branch | Tip SHA | Ancestry / unique commits | PR status and net unique paths vs `main` |
|---|---|---|---|
| `bff-secure-backend` | `a51ccf85f6d37e98353e80a1a48cfd902737fcde` | Merge base `614394ca`; 3 commits ahead | **Unverified; no PR.** Private-preview Worker, UI changes and one gate test: `.gitignore`, `index.css`, `index.html`, `package-lock.json`, `package.json`, `server/worker.mjs`, `src/App.tsx`, `src/components/AuthModal.tsx`, `src/components/BackendStatusBanner.tsx`, `src/components/InputBar.tsx`, `src/context/AppContext.tsx`, `src/services/geminiService.ts` (removed), `src/services/geminiServiceBFF.ts`, `tests/bff-gate.test.mjs`, `vite.config.ts`, `wrangler.toml`. |
| `copilot/add-dependency-lockfile` | `660a9c0cc08ccbf7a565c444e091363053a55113` | Merge base `614394ca`; 7 commits ahead | **Closed, unmerged (#15).** `package-lock.json`, `.github/workflows/codeql.yml`; subsequent commits revise the CodeQL workflow. |
| `copilot/add-gitignore-secrets-hygiene` | `cb273bb15621c65e1707b46bf48e66a71aa61795` | Merge base `614394ca`; 6 commits ahead | **Closed, unmerged (#16).** `.env.example`, `.gitignore`, `README.md`, `SECURITY-HARDENING.md`, `src/services/geminiService.ts`, `vite.config.ts`. Its `VITE_GEMINI_API_KEY` approach still places a key in browser code; changing the variable name does not make it server-side. |
| `copilot/add-governance-files` | `05e2aa81b61761f3ca8ea5e09f5da903d637a33e` | Merge base `0b82ac60`; 2 branch-only commits; `main` has 1 commit after that base | **Active, open #2; stale base.** `.github/CODEOWNERS`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `CONTRIBUTING.md`, `LICENSE`, `SECURITY.md`. |
| `copilot/add-mit-license-and-update-readme` | `e806edc427d393f303fc758845d4c1dfa5373f58` | Merge base `614394ca`; 1 commit ahead, no tree delta at snapshot | **Active, open #28.** This is the current review branch; this inventory predates this PR's file edits. |
| `copilot/run-deepscan-audit` | `930c43b7cbb445f61771f1290729750ae02443c8` | Merge base `0b82ac60`; 9 branch-only commits; `main` has 1 commit after that base | **Active, open #1; stale base.** `.github/workflows/ci.yml`, `.husky/pre-commit`, `DEEPSCAN-AUDIT-REPORT.md`, `deepscan-audit-report.json`, `eslint.config.mjs`, `index.tsx`, `npm-audit-report.json`, `package-lock.json`, `package.json`, `src/components/SystemOptimizationModal.tsx`, `src/context/AppContext.tsx`, `src/services/geminiService.ts`. |
| `copilot/update-anthropic-wif-test-workflow` | `b138b69392905734b128f4b6941cc34bd49cca72` | Merge base `614394ca`; 4 commits ahead | **Active, open #25; external workflow unverified.** `.github/workflows/anthropic-wif-test.yml`; the PR description says it has not yet been run. |
| `main` | `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8` | Baseline | Current baseline and `v3_6_0` tag target. |
| `sashasmith-syber-patch-1` | `093e1d55e30c17a29cd1c86320a3603285a04fa2` | Merge base `614394ca`; 1 commit ahead | **Active, open #3; high-impact script requires explicit review.** `Ait enterprice harden`. The script is designed to change GitHub repository and organization settings and write files to multiple repositories; it was not run. |
| `sashasmith-syber-patch-10` | `d4942cf2dc7a4c582578a6d1d409ccf53f46a162` | Merge base `614394ca`; 1 commit ahead | **Active, open #12; proposed service, not integrated.** `src/perplexity.ts`. |
| `sashasmith-syber-patch-11` | `6ca22a13395c61bfae99854e9cf54de2562da82a` | Merge base `614394ca`; 1 commit ahead | **Active, open #13; proposed middleware, not integrated.** `src/auth.ts`. Depends on the Perplexity tier type in #12, but its import path does not match #12's `src/perplexity.ts`; it also imports Supabase, which is not a dependency on `main`. |
| `sashasmith-syber-patch-12` | `69e565d106fbcb89e9de38a27693a516c2287cbc` | Merge base `614394ca`; 5 commits ahead | **Unverified current tip; associated PRs #22, #24, and #26 are closed.** Net current-tree change: `tools/scan_inventory.py`. The head is later than #26's recorded head; do not treat the closed PR contents as merged. |
| `sashasmith-syber-patch-13` | `0cc642b0d1f53b85863434ceadd8b9446b3dd665` | Merge base `614394ca`; 1 commit ahead | **Active, open #27.** `hikaru-logo-3d-acidgreen.png`; the fetched branch tree confirms the added asset, though the PR summary does not explain its provenance or intended use. |
| `sashasmith-syber-patch-2` | `37d6c9f88776137448a4dd29dba4a6658019de42` | Merge base `614394ca`; 2 commits ahead | **Active, open #4.** `.github/workflows/stainless-sync.yml`; it depends on an OpenAPI spec and a referenced `stainless.yml` that are not on `main`, and would call an external service. |
| `sashasmith-syber-patch-3` | `134588e47c11ccb1a3629fc3692e6a6a1f206ee5` | Merge base `614394ca`; 4 commits ahead | **Active, open #5.** `openapi.yml`. Its history contains PR #14, which GitHub confirms was merged into this branch, not into `main`. |
| `sashasmith-syber-patch-4` | `7a3909be6d73467c3faec1dc6c5bcaf6932ae9dc` | Merge base `614394ca`; 1 commit ahead | **Active, open #6.** `.github/dependabot.yml`; the proposed configuration includes a Python ecosystem although `main` has no Python project. |
| `sashasmith-syber-patch-5` | `54edfc92339563cf12d00e414884a97e21c14e41` | Merge base `614394ca`; 1 commit ahead | **Superseded proposal; #7 is closed and unmerged.** `.github/workflows/codeql.yml`. A later CodeQL variant is in closed PR #15; neither workflow has landed on `main`. |
| `sashasmith-syber-patch-6` | `9fae6b9885b29944f56dce9d46d3f4086f453498` | Merge base `614394ca`; 1 commit ahead | **Active, open #8.** `.github/workflows/dependency-review.yml`. |
| `sashasmith-syber-patch-7` | `208382e733eb1679a3ef95095b35ede7959848ab` | Merge base `614394ca`; 1 commit ahead | **Active, open #9.** `.github/workflows/secret-scan.yml`. |
| `sashasmith-syber-patch-8` | `9c9a45c5bc15807b53afcaf8f2fa054607e8686f` | Merge base `614394ca`; 1 commit ahead | **Active, open #21.** `README.md`. Earlier PRs on this named ref (#10, #17, #18, #20) are closed/unmerged proposals; their historical commit objects were not present in the fetched refs, so their exact ancestry to this tip is unverified. |
| `sashasmith-syber-patch-9` | `4a6e19d68c09aedd6db2c80c81b71b132039799a` | Merge base `614394ca`; 1 commit ahead | **Active, open #11.** `SECURITY.md`. |

## Overlapping paths and review conflicts

The exact path overlaps between fetched branch tips are:

| Branches | Shared paths |
|---|---|
| `bff-secure-backend` / `copilot/add-dependency-lockfile` | `package-lock.json` |
| `bff-secure-backend` / `copilot/add-gitignore-secrets-hygiene` | `.gitignore`, `src/services/geminiService.ts`, `vite.config.ts` |
| `bff-secure-backend` / `copilot/run-deepscan-audit` | `package-lock.json`, `package.json`, `src/context/AppContext.tsx`, `src/services/geminiService.ts` |
| `copilot/add-dependency-lockfile` / `copilot/run-deepscan-audit` | `package-lock.json` |
| `copilot/add-dependency-lockfile` / `sashasmith-syber-patch-5` | `.github/workflows/codeql.yml` |
| `copilot/add-gitignore-secrets-hygiene` / `copilot/run-deepscan-audit` | `src/services/geminiService.ts` |
| `copilot/add-gitignore-secrets-hygiene` / `sashasmith-syber-patch-8` | `README.md` |
| `copilot/add-governance-files` / `sashasmith-syber-patch-9` | `SECURITY.md` |

There are also documentation conflicts by intent. PR #2 proposes `LICENSE` with a 2025 copyright year; `main` has no license or repository-level `NOTICE`/third-party notice file, and this PR adds the requested 2026 MIT license without deleting any notices. PR #2 and #11 both add `SECURITY.md`. The active README PR #21 and the closed README proposals #18/#20 overlap with the README and security-hygiene guidance in #16. This PR's README and license paths therefore need to be reviewed together with #21 and #2 rather than copied over blindly.

PR #2 has unresolved review threads noting that its contribution guidance and pull-request template require `npm run lint`, which is not defined on `main`, and that its security guidance claims `.env` files are ignored even though the current ignore rule only covers `*.local`. PR #21 has unresolved review threads about literal citation artifacts and deployment advice that would expose the Vite-injected Gemini key in the client bundle. This PR avoids both inaccuracies.

## Dependencies and special handling

- **Gemini backend alternatives:** `bff-secure-backend` proposes a Cloudflare Worker with a private-preview token, server-side `GEMINI_API_KEY`, request limits, and a model allowlist. It is not associated with a PR. Closed PR #23 (`fix/released-ui-polish`, no current remote branch) proposed a different Cloudflare Pages Functions/API-proxy design. These are alternatives, not two halves of one implementation. Review one complete trust boundary and its tests before selecting either; neither is deployed or part of `main`. The BFF branch adds a `deploy` script; it was not run.
- **Secret hygiene:** #16 expands ignore rules and changes the client key variable to `VITE_GEMINI_API_KEY`. Vite client variables remain browser-visible. Apply the useful local-file ignore rules only alongside an explicitly chosen key boundary; do not treat a renamed variable as secret storage.
- **Lockfile and audit changes:** `main` has no `package-lock.json`. The BFF, #15, and #1 each carry a lockfile; #1 also changes `package.json` and the same Gemini/AppContext files as the BFF. An advisory lookup against the declared Vite baseline `6.2.0` reported a `launch-editor` issue affecting versions through `6.4.3` and an arbitrary-file-read issue affecting versions through `6.4.1`. The clean install for this review resolved Vite `6.4.5` and npm reported zero vulnerabilities, but without a committed lockfile the exact installed tree is not pinned. Pick the final dependency manifest first, generate one lockfile from it, and recheck the resolved dependency tree. Retain the useful, independently reviewed type-safety and error-handling changes from #1, but rebase and validate them instead of importing audit report artifacts or assuming the branch's lint commands work on `main`.
- **Proposed Perplexity authentication:** #13 depends on #12's `ApiTier`, but the import path is inconsistent with the file added by #12. Both import `@supabase/supabase-js`, absent from `main`, and the proposed rate-limit SQL is only a comment, not a checked-in migration. Resolve layout, dependencies, persistence, and server routing before considering the pair integrated.
- **OpenAPI and automation:** #4's Stainless workflow requires #5's proposed `openapi.yml` and a `stainless.yml` not present on `main`; its push-to-main trigger uploads to an external service. Review and gate that separately. #25 uses GitHub OIDC to call Anthropic; its PR says the integration has not been run. Verify its trust configuration and workflow permissions before any authorized run.
- **Repository-wide hardening script:** #3's script is capable of changing repository/organization settings and writing files across multiple repositories. Do not execute it as part of branch consolidation.
- **Other PR refs:** PR #14's source branch, PR #19's `cursor/setup-dev-environment-dc3f`, and PR #23's `fix/released-ui-polish` do not appear in the fetched remote branch list. PR #14 is merged into `sashasmith-syber-patch-3`; #19 and #23 are closed and unmerged. PR #23 is noted above because its backend proposal overlaps with the BFF branch.

## Recommended review and merge order

This is a proposal only; it does not merge or close anything.

1. Keep `main` as the base. Rebase the stale-base branches #1 and #2 before evaluating their diffs.
2. Decide whether this app remains a direct-Gemini prototype or adopts one server-side proxy. Compare the BFF branch with closed PR #23; preserve independently useful UI and security changes, but do not merge both proxy architectures unchanged. Keep provider credentials out of the browser before documenting a production key workflow.
3. If a backend is selected, reconcile its changes with #1 and #16 across `package.json`, `package-lock.json`, `vite.config.ts`, `src/services/geminiService.ts`, and `src/context/AppContext.tsx`. Establish the final dependency set and generate a single matching lockfile; then run the branch's actual tests and build before proposing integration.
4. Review the security automation as a coherent group after the lockfile and target workflow are settled: choose one CodeQL variant (#7 or #15), then consider #6, #8, and #9. Review action pinning, permissions, triggers, and secret handling individually. Keep #25 opt-in until its external OIDC trust is independently verified.
5. Treat #12 then #13 as a separate optional API feature only after repairing the import/dependency mismatch and supplying a real, reviewed server and migration. For #4, first provide and validate the missing Stainless configuration and API spec, then obtain explicit approval for its external upload behavior.
6. Consolidate documentation/governance proposals by file: use the source-verified README in this PR rather than the unsupported claims in older README versions; choose one MIT license year and preserve any third-party notices; reconcile #2's useful templates and contribution guidance with the actual scripts; and select one security-policy document from #2/#11 rather than adding competing `SECURITY.md` files.
7. Once each unique change is either preserved in an approved target branch or explicitly declined by the maintainer, reassess redundant PRs and branches. Only then consider reducing branch count; branch deletion and PR closure are separate maintainer actions.

No branch was deleted, merged, force-pushed, or otherwise changed during this inventory. No PR was closed, no repository setting was changed, and no external integration or deployment was run. Branch cleanup is not complete.
