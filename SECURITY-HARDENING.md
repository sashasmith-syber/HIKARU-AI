# Security Hardening Notes

This repository has had prior automation-generated commits in the past (including Lovable-related bots). Current hardening focuses on reducing silent config/secrets risk with explicit, reviewable changes.

## Secrets and `.env` hygiene

- `.env`, `.env.*`, and `.env.local` are ignored in git.
- Secrets must never be committed to the repository.
- No `.env` files are currently tracked in this branch.

If historical or external copies of secrets exist, the repository owner should rotate those secrets and re-store them in a secure secret manager.

## Runtime configuration

- Runtime API credentials are expected from environment variables (for this app: `VITE_GEMINI_API_KEY`).
- Do not hard-code API keys, project IDs, URLs, or bearer tokens in source files.
- If Supabase/Stripe/Anthropic/Cloudflare/OpenAI integrations are added or updated, configure them through environment variables and GitHub encrypted secrets only.

## CI / workflow safety requirements

- CI workflows must not push directly to `main`.
- CI workflows must not auto-merge without explicit human approval.
- Workflows must reference secrets through `secrets.*` and avoid printing token values in logs.
