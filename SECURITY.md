# Security Policy

## Supported Versions

Only the current release of Hikaru AI is actively maintained and receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| v3.6.x  | ✅ Yes             |
| < v3.6  | ❌ No              |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

This project handles sensitive data including AI API keys and microphone permissions. If you discover a security vulnerability, please report it privately so it can be addressed before any public disclosure.

### How to Report

Use GitHub's built-in private vulnerability reporting:

👉 [**Report a vulnerability privately**](https://github.com/sashasmith-syber/HIKARU-AI/security/advisories/new)

This creates a private security advisory visible only to the maintainer (`@sashasmith-syber`). Please include:

1. **Description** — A clear description of the vulnerability
2. **Steps to reproduce** — Minimal reproduction steps or proof-of-concept
3. **Impact** — What data or functionality is affected
4. **Suggested fix** (optional) — If you have a proposed remediation

## Scope

The following are in scope for security reports:

| Category | Examples |
| -------- | -------- |
| **API key exposure** | `VITE_GEMINI_API_KEY` or other secrets committed to source or leaked via client-side code |
| **Prompt injection** | Attacks that manipulate the AI persona or extract system prompts via crafted user input |
| **Audio data handling** | Unauthorized access to, retention of, or exfiltration of microphone data |
| **Dependency vulnerabilities** | High/critical CVEs in `package.json` dependencies affecting runtime behavior |
| **XSS / injection** | Cross-site scripting or code injection in the React UI |

The following are **out of scope**:

- Vulnerabilities in the underlying Google Gemini API (report those to Google directly)
- Theoretical vulnerabilities without a practical exploit path
- Rate limiting or DoS against the live demo site

## Response SLA

| Action | Target |
| ------ | ------ |
| Initial acknowledgement | Within **72 hours** of report |
| Triage & severity assessment | Within **7 days** |
| Fix or mitigation deployed | Within **30 days** for critical/high severity |
| Public disclosure | Coordinated with the reporter, typically after fix is deployed |

## Acknowledgements

Security researchers who responsibly disclose vulnerabilities will be credited in release notes (with their permission). Thank you for helping keep Hikaru AI and its users safe.
