# Contributing to Hikaru AI

Thank you for your interest in contributing to **Hikaru AI** (AIT Hikaru AI v3.6 — Persona-Driven AI Agent / Prompt Engine). This document outlines the standards and process for contributing to this repository.

> **Note:** This is a solo-maintained project by [@sashasmith-syber](https://github.com/sashasmith-syber). All contributions — including AI-generated code — require review and approval from the maintainer before merging into `main`.

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173` by default.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

---

## Branch Naming Convention

All branches must follow one of these prefixes:

| Prefix | Use case |
| ------ | -------- |
| `feature/` | New features or enhancements |
| `fix/` | Bug fixes |
| `chore/` | Maintenance, config, dependency updates |
| `copilot/` | AI-generated (Copilot/automated) branches |

**Examples:**

```
feature/voice-persona-toggle
fix/audio-stream-disconnect
chore/update-genai-dependency
copilot/run-lint-fixes
```

---

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short description>
```

| Type | When to use |
| ---- | ----------- |
| `feat` | A new feature |
| `fix` | A bug fix |
| `chore` | Build process, dependencies, config |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or updating tests |

**Examples:**

```
feat(persona): add custom persona temperature control
fix(audio): resolve microphone stream not closing on unmount
chore: upgrade @google/genai to latest
docs: update README with live URL
```

---

## Pull Request Requirements

All PRs targeting `main` must meet the following criteria before merge:

- [ ] **Lint passes** — `npm run lint` must exit with no errors
- [ ] **Build passes** — `npm run build` must complete successfully
- [ ] **1 review approval** — At least one approval from the maintainer (`@sashasmith-syber`)
- [ ] **No unresolved review threads** — All PR review comments must be resolved
- [ ] **Branch is up-to-date** with `main` before merging
- [ ] **PR template filled out** — All checklist items addressed

---

## TypeScript Standards

This project enforces strict TypeScript hygiene. When contributing code:

- ❌ **No `any` types** — Use proper type definitions or generics instead
- ❌ **No non-null assertions (`!`)** — Use type guards or optional chaining (`?.`) instead
- ✅ **Use proper type guards** — `typeof`, `instanceof`, or custom predicates
- ✅ **Prefer explicit return types** on exported functions and components
- ✅ **Keep types colocated** — Define types in `src/types/` or alongside the module they describe

**Example — avoid this:**

```typescript
// ❌ Bad
const value = someObj!.property;
const data: any = fetchData();
```

**Do this instead:**

```typescript
// ✅ Good
const value = someObj?.property;
const data: ResponseData = fetchData();
```

---

## AI-Generated Code Policy

This project actively uses GitHub Copilot (including the SWE agent). The following rules apply to all AI-generated contributions:

1. **Human review is mandatory** — All Copilot-generated code must be reviewed line-by-line by the maintainer (`@sashasmith-syber`) before merge.
2. **No automatic merging of AI PRs** — Even if all CI checks pass, AI-generated PRs require explicit human approval.
3. **Label AI-generated code** — Use the `🤖 AI-generated (Copilot)` checkbox in the PR template.
4. **Verify AI output against TypeScript standards** — AI-generated code must comply with the same TypeScript rules above (no `any`, no `!`).
5. **Review for prompt/API key safety** — Ensure no secrets or system prompt contents are exposed in AI-generated code.

---

## Security

- **Never commit API keys, tokens, or secrets** — Use `.env` files (which are `.gitignore`d) for local secrets
- **Never expose the Gemini API key client-side in a way that is not already intentional** — Review `vite.config.ts` to understand how env vars are handled
- For security vulnerabilities, please follow the [Security Policy](./SECURITY.md) and report privately

---

## Questions

If you have questions about the project or a contribution, feel free to open a [GitHub Discussion](https://github.com/sashasmith-syber/HIKARU-AI/discussions) or reach out via the [live app](https://hikaru.ai-ssmith.com).
