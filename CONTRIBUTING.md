# Contributing

HIKARU-AI is maintained by `@sashasmith-syber`. Contributions are welcome; review and merge decisions are made by the maintainer.

## Development

- Install dependencies with `npm install`.
- Start the app with `npm run dev`.
- Build with `npm run build`.

There is no lint or test script currently defined in `package.json`.

## Pull requests

- Explain the change and how it was validated.
- Do not commit credentials, private keys, or confidential provider configuration.
- Keep provider credentials out of browser bundles. The current Vite configuration injects `GEMINI_API_KEY` into client code, so any configured value is visible to users. This policy documents the existing exposure; it does not change runtime behavior.
- `CODEOWNERS` identifies the maintainer; it does not require self-approval. Repository branch protection and required-review settings are configured separately in GitHub and are not enforced by these files.
- The `Secret Scan` and `Dependency Review` workflows run on pull requests targeting `main`, without path filters. Their candidate check names are `Secret Scan / scan` and `Dependency Review / dependency-review`; verify the names in GitHub before selecting required checks. Repository settings, not these files, decide whether checks are required.

## Security reports

Private vulnerability reporting availability has not been verified for this repository. Check the repository's Security → Advisories page to see whether GitHub private reporting is available. Do not include sensitive details or credentials in a public issue; if private reporting is unavailable, use a verified private contact channel.
