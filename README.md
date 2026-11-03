# HIKARU-AI

HIKARU-AI is a React and TypeScript browser application for Gemini-powered chat, prompt exploration, and analysis. The current `main` branch is a Vite frontend; it does not include a server-side API, user authentication, database, or deployment configuration.

## What is implemented

The application includes:

- Streaming Gemini chat with selectable personas and analysis modes.
- A prompt library, file attachments, and an artifact viewer for tagged model output.
- Gemini image generation and a live voice mode that requests microphone access.
- Message feedback, response explanations, and scenario generation.

These features run in the browser and depend on access to the configured Gemini API. The status/ethics indicators are simulated UI state, not independent review, monitoring, or enforcement. Other remote branches and pull requests propose backend, authentication, search, API-specification, and deployment changes; those are not part of the current application.

## Architecture

- `index.tsx` mounts the React application; `src/App.tsx` composes its main views.
- `src/context/AppContext.tsx` manages chat, persona, audio, and artifact state.
- `src/components/` contains the UI; `src/constants/` contains personas and prompts.
- `src/services/geminiService.ts` calls the Google Generative AI SDK for chat, image, and live audio.
- `vite.config.ts` configures the Vite development server and build.

The application state is held in React context; no database or persistent conversation store is configured on `main`.

## Prerequisites

- Node.js 22.12 or newer and npm. `package.json` does not pin Node.js or npm versions.
- A Gemini API key for model-backed features.

## Install and run

```sh
npm install
```

Set `GEMINI_API_KEY` in a local root-level `.env.local` file. Do not put an actual key in source files, command examples, or commits. The repository's `*.local` ignore pattern covers `.env.local`; it does not ignore every `.env` filename.

```sh
npm run dev
```

Vite serves the app on port `3000` and binds to `0.0.0.0` as configured in `vite.config.ts`. Use the printed URL and avoid exposing the development server on an untrusted network.

## Build, preview, and tests

```sh
npm run build
npm run preview
```

`npm run build` creates the Vite production bundle in `dist/`; run `npm run build` before `npm run preview`. The only scripts currently defined in `package.json` are `dev`, `build`, and `preview`. The dependency ranges are not pinned by a lockfile on `main`. There is no configured test, lint, or standalone TypeScript-check script, and no automated test suite is present on `main`.

## Security and data boundaries

- **The Gemini key is not secret in this architecture.** Vite reads `GEMINI_API_KEY` and substitutes it for `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time. The Gemini SDK is initialized in browser code, so the resulting key is available to users of the built application. Do not use a privileged or production credential in this frontend. A server-side proxy would be needed to keep a provider key out of the browser; no such proxy is implemented on `main`.
- Chat text, attachments, and live microphone audio are sent from the browser to Gemini. Avoid sending sensitive information unless you have reviewed the provider's data handling and have authorization to share it.
- The application has no server-side authentication or request rate limiting on `main`. Persona and “security review” modes are prompts, not access controls or security enforcement.
- Artifact previews use an iframe sandbox, but model-generated content should still be treated as untrusted.
- The browser development server binds to all network interfaces; keep it on a trusted network.

## Deployment

The verified production operation is `npm run build`, which writes static assets to `dist/`; `npm run preview` is a local preview. The repository does not specify a production host, deployment workflow, server runtime, or provider-specific configuration, so this README does not prescribe a production deployment.

## Contributing

For a change, create a focused branch from `main`, keep the change scoped, and open a pull request targeting `main`. Describe user-visible effects, security implications, and the exact checks you ran, then request maintainer review. At present, the available project validation command is `npm run build`; test and lint commands are not configured.

## License

This project is distributed under the [MIT License](LICENSE).
