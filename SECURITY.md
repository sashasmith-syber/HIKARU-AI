# Security

## Reporting a vulnerability

Private vulnerability reporting availability has not been verified for this repository. Check the repository's **Security → Advisories** page to determine whether GitHub private reporting is available. Do not report vulnerabilities or include credentials in a public issue. If private reporting is unavailable, use a verified private contact channel.

Do not include live credentials in reports, logs, screenshots, or reproduction steps. This repository's current Vite configuration injects `GEMINI_API_KEY` into browser code; any value used by the client build is visible to users. This document does not change that runtime behavior.

## Automated scanning

The `Secret Scan` workflow checks pull-request changes between the validated base and head commits. It disables credential verification, so it does not make live credential checks or credential-bearing network probes. Its GitHub Actions output is limited to finding metadata such as detector type, file, and line; it does not print the credential value.

Use the workflow's **Run workflow** action for a manual scan of the selected ref's reachable Git history. Pull-request runs do not scan the full history. A nonzero scan result means a finding may have been detected or the scanner may have failed; it is not proof that a credential is valid or that a confirmed leak occurred. Review only redacted output and investigate through a private channel. The workflow does not comment on pull requests, rewrite history, or suppress findings.

## Dependency review

The `Dependency Review` workflow is a read-only pull-request check. Its usefulness depends on GitHub dependency graph support, repository visibility and plan eligibility, and the manifests and lockfiles available to compare. The current repository has `package.json` but no npm lockfile, so npm dependency-review coverage may be limited until a supported lockfile is present. Workflow configuration cannot enable repository security settings or guarantee feature eligibility.
