# Canonical state and review evidence

## Snapshot

Read-only evidence was collected on **2026-11-09, 09:55–10:03 UTC**. The local
UTC capture immediately before implementation was `2026-11-09T10:03:07Z`.
GitHub reads occurred during this window, so check and PR state is a snapshot,
not a claim that remote state cannot change afterward.

Verified facts:

- Repository: `sashasmith-syber/HIKARU-AI`; GitHub reports it public and its
  default branch is `main`.
- `main` full SHA: `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8`; `v3_6_0` points to
  this commit in the fetched refs.
- GitHub listed `main` as protected. Protection rules and required checks were
  not inspected or changed.
- `main` has no checked-in `.github/workflows/`, lockfile, test directory, or
  server/deployment configuration. The package defines only `dev`, `build`,
  and `preview` scripts.
- The application initializes `GoogleGenAI` in
  `src/services/geminiService.ts`; `vite.config.ts` substitutes
  `GEMINI_API_KEY` into `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.
- The current task branch's pre-change head was
  `f4bf3c6d9f16105824b700f5dec8137cb8c0e550` (PR #31).

Unknowns and limits:

- The GitHub Secret Scanning API returned 403 to this review. No statement is
  made about the existence or absence of repository alerts.
- Local pattern checks are not a full provider-secret/history scan. The
  operator must revoke/rotate any real credential found in current or prior
  history; deleting a file or rewriting history does not revoke it.
- The cause of the failed Cloudflare Workers build is unknown. Its details URL
  is in Cloudflare, not a GitHub Actions job, and the GitHub job-log API
  returned 404.
- Other repositories mentioned in old PR text are not declared deprecated;
  no cross-repository status was established.
- This review does not validate any deployment or external integration.

## PR and check snapshot

### PR #28 — head `6eba1eec00d3319c02c2e967d5bb2ed36196ebac`

Open, base `main` at `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8`,
`mergeable_state=blocked`. The maintainer approved the current head; reviewer
threads about CodeQL scope and the README's Cloudflare-configuration claims
remain unresolved. GitHub checks
reported CodeQL success, GitGuardian success, Supabase Preview skipped, and a
Cloudflare `Workers Builds: hikaru-ai` **failure** at
`2026-11-09T09:55:24Z`. A prior Cloudflare preview check for this PR was
successful. The failed check is an external Cloudflare build; no cause was
verified. A reviewer also noted that the PR had already caused a preview
deployment; this report does not imply it was undone.

### PR #29 — head `d3fcff7c59861631f75f7583afb6436bf9cefb64`

Open, base `main` at `614394ca72ca6d4dac6aaa48de381a7ff7a0b3a8`,
`mergeable_state=blocked`. The most recent review threads on dependency scope
and selected-ref history scanning were resolved at this head. The GitHub
check-runs endpoint returned no runs for the current head. Actions run
`42597040028` (`Secret Scan`) completed with `action_required`; it had zero
jobs and no failed-job logs, so this is not a scanner finding or test failure.
`Dependency Review` and `Secret Scan` succeeded on the older head
`cd3150c2bba86aa20c8f51bdcd41f2d6651a93d3` (run IDs `41734198076` and
`41734197760` respectively). These older successes do not validate the current
head. GitGuardian Security Checks succeeded and Supabase Preview was skipped
on the current head; the Copilot review run was still in progress at the
snapshot.

### PR #1 — head `930c43b7cbb445f61771f1290729750ae02443c8`

Open and API-reported blocked. Its base SHA is the older `0b82ac607d1d45da087b8c120653cd604739ad42`, not current `main`. The branch's net tree delta is 20 files, including a 6,615-line lockfile, ESLint/Husky setup, audit artifacts, UI changes that remove the artifact viewer, and type-safety edits. No inline review threads were returned; one maintainer review/comment is present but contains no actionable explanation. Do not accept the entire branch as a single unit.

### Current task PR #31 — pre-change head `f4bf3c6d9f16105824b700f5dec8137cb8c0e550`

Open draft, API-reported blocked at the snapshot. No check runs were present
for this initial-plan head.

## Evidence handling

The exact fetched branch heads and the complete open-PR disposition table are
in [`branch-consolidation.md`](branch-consolidation.md). PR text and repository
files were treated as claims to check against source or GitHub state. Older
inventories are historical snapshots, not current branch or deployment
evidence.
