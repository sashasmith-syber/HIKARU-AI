# Contributing

HIKARU-AI is maintained by `@sashasmith-syber`. `CODEOWNERS` records that
ownership; it does not require self-approval or configure GitHub protections.

## Development

- Use Node.js `20.19+` or `22.12+` and `npm ci`.
- Start locally with `npm run dev`.
- Validate with `npm test`, `npm run typecheck`, and `npm run build`.
- There is no configured lint script.
- Gemini-backed actions intentionally fail closed. Do not add a client-side
  provider key or claim the server integration works.

## Pull requests

Describe behavior changes and list the exact checks run. Do not commit provider
credentials, private keys, or confidential configuration. Keep workflow
permissions minimal, pin third-party actions to verified full commit SHAs, and
do not use `pull_request_target` to execute untrusted code. Do not add
deployment, paid-provider, external publishing, or repository-setting changes
without separate operator approval.

Security workflows propose check names `Secret Scan / scan` and
`Dependency Review / dependency-review`; verify their actual GitHub check
names and eligibility before configuring any required-check setting.
