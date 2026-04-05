# Security Policy — AIT / HIKARU AI

光即知識 — Light is Knowledge  
知識即力 — Knowledge is Power

---

## Supported Versions

| Component              | Repository                          | Support Status |
|------------------------|-------------------------------------|----------------|
| HIKARU AI v5.0         | sashasmith-syber/HIKARU-AI          | ✅ Active       |
| PROTOS-1               | SmithSolution/PROTOS-1              | ✅ Active       |
| nexus_spider_agent     | sashasmith-syber/nexus_spider_agent | ✅ Active       |
| hikaru-core            | SmithSolution/hikaru-core           | ✅ Active       |
| HIKARU AI v3.6         | SmithSolution/HIKARU-AI-v3.6_PROTOS-1 | ⚠️ Legacy — critical fixes only |
| HIKARU AI v4.0         | SmithSolution/hikaru-terminal       | ⚠️ Legacy — critical fixes only |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Contact: [sashasmith.link/contact](https://sashasmith.link/contact)  
Response SLA: 48 hours for initial acknowledgement, 14 days for resolution

Include:
- Affected repository and version
- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Your suggested fix (optional)

You will receive credit in the changelog unless you prefer anonymity.

---

## PROTOS-1 Sanctuary Protocol

All AIT repositories operate under three standing directives enforced by PROTOS-1:

**1. Sanctuary** — Allowlist perimeter. No outbound connections to non-approved hosts.  
**2. Synthesis** — Schema + checksum integrity on all persisted data.  
**3. Logic** — Constitutional evaluation gate on all AI-generated output before execution.

Any discovered bypass of these three directives is classified as **Critical severity** regardless of exploitability.

---

## Known Security Posture

- API keys stored as SHA-256 hashes only — raw keys never persisted
- Cloudflare Zero Trust WARP tunnel as sole external ingress
- All AI outputs evaluated against GUARDIAN_STRATEGIST_EVAL_v2.1 before action
- Secret scanning push protection enabled on all repositories

---

## Out of Scope

- Vulnerabilities in Perplexity / Supabase / Cloudflare infrastructure (report to those vendors)
- Social engineering attacks
- Physical access scenarios
- Rate limit bypass on free tier (known, intentional design tradeoff)
