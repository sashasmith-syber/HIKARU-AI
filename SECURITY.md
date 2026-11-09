# Security

## Reporting

Private vulnerability reporting availability has not been verified. Check the
repository's **Security → Advisories** page before using GitHub private
reporting. Do not submit secrets or sensitive reproduction details in a public
issue. If private reporting is unavailable, use a verified private contact
channel; no response-time commitment or alternate channel is asserted here.

Do not include live credentials in reports, screenshots, logs, or reproduction
steps. A provider key compiled into a browser bundle must be treated as
disclosed; deleting a value from the current tree does not revoke it. The
operator must revoke/rotate an exposed credential with its issuer.

## Current boundary

The previous Vite configuration substituted `GEMINI_API_KEY` into browser
JavaScript and the client called Gemini directly. The current configuration no
longer loads or injects that key, and Gemini entry points fail closed before
provider calls. There is no approved server-side provider route, authorization
system, or production secret binding. Keep provider credentials out of the
browser and build environment.

## Automated checks

The `Secret Scan` workflow checks validated pull-request commit ranges and
supports a manual scan of the selected ref's reachable history. It runs
TruffleHog with credential verification disabled (`--no-verification`) and
fails on findings (`--fail`); it does not make live credential checks or
paid-provider calls. TruffleHog's default output redacts result values. A
nonzero result can indicate a finding or a scanner failure; it is not proof
that a credential is valid or that a confirmed leak occurred. Review only
redacted detector/location metadata. The workflow does not comment on PRs,
rewrite history, or suppress findings.

The workflows pin `actions/checkout` to upstream commit
`3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1),
`trufflesecurity/trufflehog` to the upstream v3.99.8 tag commit
`ea68ca03c865c5f324e86e849ced20ed3cf9dbbb`, and
`actions/dependency-review-action` to upstream commit
`a1d282b36b6f3519aa1f3fc636f609c47dddb294` (v5.0.0). These refs were checked
against upstream commit/action metadata during this review.

`Dependency Review` is a read-only pull-request check. It evaluates high and
critical advisories across runtime, development, and unknown dependency
scopes. Coverage depends on GitHub dependency graph support and the manifests
and lockfiles available for comparison. These files do not enable repository
security settings or make checks required.

## Known limitations

- Gemini-backed chat, image, structured output, streaming, and live audio are
  disabled pending an authorized server-side design.
- No production deployment or rollback procedure is verified.
- The repository-level Secret Scanning API was not accessible to this review;
  no conclusion about existing or historical GitHub alerts is made.
- Local pattern checks cover only their documented patterns and are not proof
  that the full Git history is credential-free.
