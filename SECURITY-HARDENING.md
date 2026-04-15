# Security Hardening Notes

This repository previously had automation-generated commits (including Lovable-related bots). Current hardening focuses on reducing silent config/secrets risk with explicit, reviewable changes.

## Secrets and `.env` hygiene

- `.env`, `.env.*`, and `.env.local` are ignored in git.
- Secrets must never be committed to the repository.
- No `.env` files are currently tracked in this branch.

If historical or external copies of secrets exist, the repository owner should rotate those secrets and re-store them in a secure secret manager.

## Runtime configuration

- Runtime client configuration is expected from environment variables (for this app: `VITE_GEMINI_API_KEY`).
- In a Vite/React app, `VITE_*` variables are exposed to the browser and inlined into the built bundle, so `VITE_GEMINI_API_KEY` must be treated as public at runtime, not as a confidential secret.
- Do not hard-code API keys, project IDs, URLs, or bearer tokens in source files; for client-side values, use environment variables and apply provider-side restrictions and rotation as appropriate.
- If a credential must remain secret, do not expose it via `VITE_*`; route requests through a backend/proxy that keeps the secret server-side.
- If Supabase/Stripe/Anthropic/Cloudflare/OpenAI integrations are added or updated, configure client-exposed values through environment variables and store true server-side secrets in GitHub encrypted secrets or another secure secret manager.

## CI / workflow safety requirements

- CI workflows must not push directly to `main`.
- CI workflows must not auto-merge without explicit human approval.
- Workflows must reference secrets through `secrets.*` and avoid printing token values in logs.
