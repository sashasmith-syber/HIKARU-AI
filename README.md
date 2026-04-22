# HIKARU-AI (AI Studio App)

HIKARU-AI is an AI app built with Google AI Studio and Gemini that runs as a modern React + Vite frontend, designed for local development and easy deployment to static hosts (Vercel, Netlify, GitHub Pages, Cloudflare Pages, etc.).[web:27]

It provides:
- A clean UI for interacting with Gemini models.
- An artifact viewer for exploring responses and generated assets.
- A simple, framework-standard setup based on Node.js, TypeScript, and Vite.

> 光即知識 | 知識即力 – “Light is knowledge | Knowledge is power”

---

## Features

- Modern **React + TypeScript** frontend (Vite based build system).
- Integration with **Google Gemini API** via AI Studio (API key based).[web:27]
- **Artifact viewer** for inspecting generated text, JSON, and other outputs from the model.
- Local-first development with hot reload (`npm run dev`).
- Production-ready build (`npm run build`) for static hosting.
- Environment-based configuration using `.env.local` (API keys never committed).
- Simple, extensible project structure in `src/` for custom components and flows.

---

## Getting Started

### Prerequisites

- Node.js (LTS version recommended, e.g. 18+).
- A Google Cloud account with access to **Gemini API** via **Google AI Studio**.[web:27]
- A valid **Gemini API key**.

### 1. Clone the repository

```bash
git clone https://github.com/sashasmith-syber/HIKARU-AI.git
cd HIKARU-AI
```

### 2. Install dependencies

```bash
npm install
```

This will install all dependencies defined in `package.json` (React, Vite, TypeScript, and any UI / helper libraries).

### 3. Configure environment variables

Create a `.env.local` file in the project root (same level as `package.json`):

```bash
touch .env.local
```

Add your Gemini API key (and any other secrets) to `.env.local`:

```dotenv
GEMINI_API_KEY=your_gemini_api_key_here
# (optionally) other keys like:
# GEMINI_MODEL_NAME=gemini-2.0-flash
# APP_ENV=development
```

**Important (Security):**

- Never commit `.env.local` or any secret keys to the repository.
- `.gitignore` is configured to ignore `.env.local`, but always double‑check before pushing.

### 4. Run the app locally

```bash
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`) in your browser to use HIKARU-AI.

---

## Project Structure

The repository uses a standard Vite + React + TypeScript layout.

High‑level files and folders:

- `src/` – Main application source:
  - Core React components.
  - Artifact viewer UI.
  - API client for Gemini.
  - Hooks, types, utilities.
- `index.html` – Vite’s HTML entry point for the app shell.
- `index.tsx` – Root React entry; bootstraps the React app into the DOM.
- `index.css` – Global styles, base theme, layout.
- `metadata.json` – App metadata exported from AI Studio (name, description, layout, and runtime configuration for the AI Studio environment).
- `vite.config.ts` – Vite configuration (build, dev server, aliases).
- `tsconfig.json` – TypeScript configuration for type checking and IDE tooling.
- `package.json` – Dependencies, scripts, and project metadata.

You can extend the app by adding new components / hooks in `src/` and wiring them into `index.tsx`.

---

## Scripts

Commonly used npm scripts:

- `npm run dev` – Start local development server with hot reloading.
- `npm run build` – Build production assets into the `dist/` folder.
- `npm run preview` – Preview the production build locally.
- `npm run lint` (if configured) – Run lint checks.
- `npm test` (if configured) – Run tests.

Check `package.json` for the full, current list of scripts and update this section as you add more.

---

## Configuration & Environment

### Environment variables

At minimum, the app expects:

- `GEMINI_API_KEY` – Used to authenticate requests to the Gemini API from the browser or a backend proxy.[web:27]

Depending on how you extend the app, you may also define:

- `GEMINI_MODEL_NAME` – Default model name to use (e.g. `gemini-2.0-flash`).
- `APP_ENV` – Environment identifier (`development`, `staging`, `production`).
- Any custom flags that toggle features.

**Browser vs backend:**

- For local prototyping, you may call Gemini directly from the frontend using the API key.
- For production, it is strongly recommended to proxy Gemini requests through a backend service (Cloud Functions, Cloud Run, Node server, etc.) so that API keys are not exposed to end‑users.

---

## Security Best Practices

To keep HIKARU-AI and your data safe, follow these recommendations:

- **Never store secrets in source control**:
  - Keep all API keys in `.env.local` or a managed secrets backend (GitHub Actions secrets, Google Secret Manager, etc.).
  - Ensure `.env.local` is in `.gitignore`.

- **Use a backend proxy in production**:
  - Instead of calling Gemini directly from the browser, use a small backend layer:
    - Validates and sanitizes user input.
    - Injects the API key on the server side.
    - Enforces rate limiting and request size limits.
  - This reduces the risk of key leakage and abuse.[web:27]

- **Limit model capabilities where appropriate**:
  - Configure max tokens, safety settings, and content filters according to your use case.
  - Avoid sending highly sensitive data to the API unless you have reviewed compliance and data-handling policies.[web:27]

- **Follow least privilege and RBAC**:
  - If you integrate with user accounts, implement role-based access control (RBAC) and log key actions.
  - Avoid exposing admin-only controls in the public UI.

- **Keep dependencies updated**:
  - Regularly run `npm audit` and update packages.
  - Review any security advisories for dependencies used in this repo.

- **CORS & origins**:
  - When deploying a backend proxy, configure CORS to only allow trusted origins (your production frontend domain).

---

## Deployment

HIKARU-AI builds to a static bundle that can be deployed to most static hosting providers.

### 1. Build the app

```bash
npm run build
```

This creates an optimized production bundle in the `dist/` directory.

### 2. Deploy options

You can host the `dist/` folder on:

- **Vercel** – Connect the GitHub repo, set `GEMINI_API_KEY` in Project Settings → Environment Variables, and configure build command `npm run build` and output directory `dist`.
- **Netlify** – Similar setup; build command `npm run build`, publish directory `dist`.
- **Cloudflare Pages** – Point to this repo, set build command and output folder, configure environment variables.
- **GitHub Pages** – Use a GitHub Action or manually push `dist/` to the `gh-pages` branch.

When using a backend proxy for Gemini calls, deploy that service alongside (e.g. Google Cloud Run, Cloud Functions, or a Node server on your platform of choice) and adjust the frontend API base URL accordingly.[web:27]

---

## Artifact Viewer

HIKARU-AI includes an artifact viewer component that lets you:

- Inspect full model responses (e.g. text, JSON, tool traces).
- Visualize artifacts generated during a conversation, such as structured results, extracted entities, or rendered code.
- Help debug prompts and refine the UX of your AI flows.

Typical usage pattern:

- User submits a prompt.
- Backend or client sends prompt to Gemini.
- Response (including any structured artifacts) is passed into the artifact viewer for inspection.
- ---

## Developed by

Made by **Sasha Smith**sashasmith-syber

[![GitHub](https://img.shields.io/badge/GitHub-sashasmith--syber-020617?style=for-the-badge&logo=github&logoColor=ffffff&labelColor=020617)](https://github.com/sashasmith-syber)
[![Website](https://img.shields.io/badge/Portfolio-sashasmith.link-0F172A?style=for-the-badge&logo=vercel&logoColor=ffffff&labelColor=020617)](https://sashasmith.link)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sasha%20Smith-0A66C2?style=for-the-badge&logo=linkedin&logoColor=ffffff&labelColor=020617)](https://www.linkedin.com/in/sasha-smith-796388355)


