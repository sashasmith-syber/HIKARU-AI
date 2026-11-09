# HIKARU-AI

HIKARU-AI is a React and TypeScript single-page interface for a persona-driven
assistant. The checked-in source contains prompt/persona definitions, chat and
audio controls, an artifact viewer, and Gemini client code. Gemini requests are
currently **disabled**: the prior Vite build injected a provider key into
browser JavaScript, and this change removes that injection and makes every
provider entry point fail closed until an authorized server-side backend is
designed and approved. This repository is not production-ready for model use.

## What exists

| Implemented in source | Not currently available / proposed |
| --- | --- |
| React/Vite UI, prompt and persona selection, local status indicators, message and artifact presentation | Gemini chat, streaming, image generation, JSON generation, and live audio (calls are gated off) |
| Browser-side audio capture and conversion helpers | Server-side authorization, provider-key storage, request limits, billing controls, user identity, and persistent conversation storage |
| Static asset build and local Vite development server | Verified production hosting, deployment, and rollback procedure |

The local status/ethics indicators are UI state and simulations; they are not
security controls or independent model evaluations. See
[`docs/canonical-state.md`](docs/canonical-state.md) for verified repository
state and known limitations.

## Requirements

- Node.js `20.19+` or `22.12+` (the Vite React plugin's supported engine range).
- npm, included with Node.js. The committed `package-lock.json` is the
  reproducible dependency set for this checkout.

No Gemini key or other environment variable is needed to build or run the
current UI. Do not put a provider key in a `VITE_*` variable, HTML, client
environment file, or browser storage.

## Local development and validation

```sh
npm ci
npm run dev
```

Vite prints the local URL. The interface can be explored, but attempts to use
Gemini-backed features return an explicit unavailable error; no provider
request is made.

Available scripts from `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server (port 3000). |
| `npm run build` | Create static files in `dist/`. |
| `npm run preview` | Serve the built files locally. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm test` | Run the Node built-in provider-boundary tests. |

There is no lint script or configured linter. The tests cover fail-closed
provider entry points and the absence of Vite credential injection; they do not
test Gemini integration or deployment.

## Architecture and trust boundaries

The current app is a browser SPA built by Vite. Its UI imports
`src/services/geminiService.ts`, which retains provider SDK types and helpers,
but each network-capable Gemini entry point throws before calling the SDK.
`vite.config.ts` does not load or define provider environment variables.
`.env.example` is only a blank placeholder for a possible future server-only
backend and is not read by this app.

No server/API route, authorization issuer, deployment binding, or production
secret configuration exists on canonical `main`. The unmerged
`bff-secure-backend` branch and historical Cloudflare proxy proposal are not
approved or deployed. In particular, a shared preview bearer token is not a
verified production user-authentication design, and the proposed BFF does not
support live audio. A secure server boundary therefore remains future work;
the browser-side provider is disabled in the meantime.

## Repository map

- `index.html`, `index.tsx`, `index.css` — document, React entry point, global styles.
- `src/App.tsx`, `src/components/` — app shell, chat UI, controls, artifact UI.
- `src/context/AppContext.tsx` — app state and orchestration.
- `src/constants/` — persona and prompt text.
- `src/services/` — provider service boundary and browser-side helpers.
- `src/types/` — shared TypeScript types.
- `vite.config.ts`, `tsconfig.json`, `package.json`, `package-lock.json` — build,
  type, and dependency configuration.
- `tests/` — focused Node tests for the provider boundary.
- `docs/` — canonical-state evidence and branch/PR dispositions.

## Environment and secret placement

| Name | Current use | Safe placement |
| --- | --- | --- |
| `GEMINI_API_KEY` | Not read by the current browser app. Reserved only for a future server-side integration. | If separately approved, configure only as a server secret; never expose it through Vite `define`, `VITE_*`, client code, or build artifacts. |

Keep local `.env*` files and private-key files out of version control. The
committed `.env.example` contains no value and is not a working integration
configuration.

## Deployment, operations, and rollback

Canonical `main` has no verified deployment configuration or tested hosting
prerequisites. A static build alone does not provide an authorized Gemini
backend. Do not deploy this app as a working model service or add provider
credentials to static-host settings. The Cloudflare build status mentioned in
the current review belongs to an unmerged PR; its cause and deployment
implications are not established by this repository.

There is no verified rollback runbook. Before any future deployment, the
operator must identify the hosting platform, artifact and previous release,
secret bindings, health checks, and platform-specific rollback procedure. No
deployment, rollback, external-service call, or repository-setting change was
performed for this work.

Security reports: private vulnerability reporting availability has not been
verified. Do not put credentials or sensitive reproduction details in a public
issue. Check GitHub's Security → Advisories page or use a verified private
contact channel. See [`SECURITY.md`](SECURITY.md).

## Licensing

No repository-level license is present on canonical `main`. Open and historical
proposals contain conflicting MIT copyright years; this change does not make a
licensing decision or remove/replace any notice.
