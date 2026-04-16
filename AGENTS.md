# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Hikaru AI is a single-page React + TypeScript chat application powered by the Google Gemini API. There is no backend server, database, or Docker dependency — all AI calls go directly from the browser to Google's API.

### Key commands

- **Install deps:** `npm install`
- **Dev server:** `npm run dev` (Vite on port 3000, bound to 0.0.0.0)
- **Build:** `npm run build`
- **Type-check:** `npx tsc --noEmit`

There is no dedicated lint script or test framework configured in the project.

### Environment variables

The app requires `GEMINI_API_KEY` in a `.env.local` file at the repo root (gitignored via `*.local`). Vite injects it at build time as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`). Without a valid key, the app loads but API calls return errors.

To create the file: `echo "GEMINI_API_KEY=your_key_here" > .env.local`

### Gotchas

- The `index.html` contains an `importmap` pointing to `aistudiocdn.com` — Vite overrides these during development so local `node_modules` are used instead. The importmap only matters for the AI Studio hosted version.
- The project has no lockfile (`package-lock.json`). `npm install` resolves fresh each time.
- The large JS bundle warning during build (~526 kB) is expected; it comes from bundling the `@google/genai` SDK.
