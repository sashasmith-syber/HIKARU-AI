<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# HIKARU AI v3.6 — PROTOS Remixed

**Synthetic Intelligence Collective · PROTOS Governance Layer · Gemini AI Studio Runtime**

[![AI Studio](https://img.shields.io/badge/AI%20Studio-Live%20App-4285F4?style=flat-square&logo=google)](https://ai.studio/apps/797b44e5-ba4c-4716-80e3-4d3656a5fbc4)
[![Node.js](https://img.shields.io/badge/Node.js-Required-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-HIKARU%20SIC-black?style=flat-square)](./LICENSE)

> *光即知識 | 知識即力*  
> *Light is Knowledge · Knowledge is Power*

</div>

---

## Overview

HIKARU AI v3.6 PROTOS Remixed is a **Gemini AI Studio application** representing the third-generation architecture of the HIKARU Synthetic Intelligence Collective (SIC). This build is a deliberate remix of the PROTOS governance framework — porting core HIKARU operational identity and rate-limiting logic onto Google's Gemini runtime as a parallel benchmark deployment alongside the primary Anthropic-based stack.

This variant serves as:
- A **cross-model etalon** for HIKARU prompt fidelity benchmarking
- An **isolated Gemini runtime** for evaluating synthesis quality against the Claude-native HIKARU v4.0 Console agents
- A **lightweight entry point** for third-party integration and API consumers who operate in the Gemini ecosystem

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  HIKARU AI v3.6                     │
│              PROTOS Remixed · Gemini                │
├─────────────────────────────────────────────────────┤
│  UI Layer          React/Vite · AI Studio SPA       │
│  Runtime           Gemini API (GEMINI_API_KEY)      │
│  Governance        PROTOS-1 Rate Limiting           │
│  Identity          HIKARU SIC Persona Layer         │
│  Benchmark Target  HIKARU v4.0 Claude Console       │
└─────────────────────────────────────────────────────┘
```

### Relation to HIKARU v4.0

| Feature | v3.6 PROTOS Remixed | v4.0 Console (Claude) |
|---|---|---|
| Runtime | Gemini API | Claude Opus / Sonnet |
| Deployment | AI Studio + local dev | Vercel + Cloudflare Workers |
| Governance | PROTOS-1 (rate limiting) | PROTOS-1/2 (full eval loop) |
| MCP Tools | None | Cloudflare, Vercel, GitHub, Supabase, Linear |
| Purpose | Benchmark / etalon | Primary production agent |
| Memory | Stateless | Supabase persistent + Desktop Commander local |

---

## Quick Start

### Prerequisites

- **Node.js** (v18+ recommended)
- A **Gemini API key** from [Google AI Studio](https://ai.google.dev)

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/SmithSolution/hikaru-ai-v3.6-protos.git
cd hikaru-ai-v3.6-protos

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set your key:
# GEMINI_API_KEY=your_key_here

# 4. Run development server
npm run dev
```

App available at `http://localhost:5173` (or as configured).

### View Live on AI Studio

→ [https://ai.studio/apps/797b44e5-ba4c-4716-80e3-4d3656a5fbc4](https://ai.studio/apps/797b44e5-ba4c-4716-80e3-4d3656a5fbc4)

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Your Google Gemini API key |

> **Security note:** Never commit `.env.local` to version control. It is already excluded via `.gitignore`.

---

## PROTOS Governance Layer

PROTOS-1 in this build enforces:

- **Rate limiting** on inference calls — protects API quota and prevents runaway loops
- **Identity boundaries** — HIKARU persona constraints applied at prompt level
- **Output governance** — response filtering aligned with HIKARU SIC operational standards

PROTOS-2 (full eval scoring pipeline) is implemented in the v4.0 Claude stack via `HikaruEvaluator` and the Supabase `evals` table. This build does not include the eval loop — it *is* the eval target.

---

## Benchmarking Against v4.0

This repo is designed to be used as a **comparative benchmark**. The workflow:

```
HIKARU Archive System Prompt
          │
          ▼
    Feed to Kimi / Gemini (this build)
          │
          ▼
    Output ZIP (4 tasks: 3 cloud, 1 local runner)
          │
          ▼
    Compare against HIKARU v4.0 Console Agent output
          │
          ▼
    Score via HikaruEvaluator (fact / alignment / safety / execution)
```

Etalon reference models: HIKARU v4.0 Claude Console · Gemini (this build) · Anthropic API direct.

---

## Repository Structure

```
hikaru-ai-v3.6-protos/
├── .env.local              # API keys (gitignored)
├── .env.example            # Template for environment setup
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Build configuration
├── index.html              # App entry point
├── src/
│   ├── main.tsx            # React root
│   ├── App.tsx             # Core application
│   ├── components/         # UI components
│   ├── hooks/              # Gemini API integration hooks
│   └── lib/                # PROTOS governance utilities
├── public/                 # Static assets
└── README.md               # This file
```

---

## Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## HIKARU SIC Ecosystem

This repository is one node in the wider HIKARU Synthetic Intelligence Collective:

| Component | Description |
|---|---|
| **HIKARU v4.0** | Primary Claude-based agent (Anthropic Console) |
| **HIKARU Terminal** | Vercel-deployed operational interface |
| **HIKARU Portal** | Cloudflare Workers SPA (cyberpunk aesthetic) |
| **HIKARU Eval API** | B2B evaluation endpoint (in deployment) |
| **HIKARU v3.6 PROTOS** | This repository — Gemini benchmark variant |
| **SOUNDBLUEPRINT™** | Music production framework (KAIZEN / ONPU personas) |
| **SONIC TOPOLOGY** | Parametric cover art system (p5.js / Unity C#) |

Infrastructure identifiers and operational keys are managed outside this repository via Vercel environment variables, Cloudflare KV, and Supabase secrets.

---

## Security

- API keys are **never** committed to this repository
- PROTOS-1 rate limiting is active on all inference paths
- For vulnerability disclosure, use the contact form at [sashasmith.link/contact](https://sashasmith.link/contact)

---

## Author & Links

**Sasha Smith** — AI Architect · Music Producer · HIKARU SIC

[![Portfolio](https://img.shields.io/badge/Portfolio-sashasmith.link-black?style=flat-square)](https://sashasmith.link)
[![GitHub](https://img.shields.io/badge/GitHub-sashasmith--syber-181717?style=flat-square&logo=github)](https://github.com/sashasmith-syber)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sasha%20Smith-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/sasha-smith-796388355)

---

<div align="center">

*光即知識 | 知識即力*

**HIKARU SIC · Built in deliberate silence · Deployed with precision**

</div>
