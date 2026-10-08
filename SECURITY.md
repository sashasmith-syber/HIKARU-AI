# Security Policy

## Scope

This policy covers security vulnerabilities in code and configuration
maintained in the Hikaru AI repository.

Relevant issues include:

- Authentication or authorization bypass.
- Exposure of API keys, credentials, tokens, or sensitive user data.
- Remote code execution, command injection, or unsafe tool execution.
- Prompt injection that crosses a security boundary, such as triggering
  unauthorized tool calls or accessing another user's data.
- Insecure agent permissions, sandbox escapes, or cross-tenant access.
- Vulnerable dependencies with a demonstrated impact on Hikaru AI.
- Security flaws in repository-provided deployment configurations.

Ordinary model inaccuracies, unexpected responses, or prompt manipulation
without a demonstrated security impact should be reported as regular bugs.
Never include sensitive information in a public bug report.

## Supported Versions

No version-specific security support matrix is currently published.

Report vulnerabilities against the latest code on the default branch.
For issues affecting an older release, include the affected version or
commit and indicate whether the issue also occurs on the default branch.

Support for older releases and availability of backported fixes will be
determined during triage. Do not assume that an older release receives
security updates.

## Reporting a Vulnerability

Do not disclose an unpatched vulnerability through a public issue, pull
request, discussion, or other public channel.

If GitHub private vulnerability reporting is enabled for this repository:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Submit a private report with the information described below.

If that option is unavailable, use a private security contact explicitly
published by the repository maintainers.

If no private contact is published, open an issue requesting a secure
reporting channel. Include only the request for a private contact—not
vulnerability details, exploit code, credentials, or affected user data.
Wait until a private channel is established before sharing the report.

### What to Include

Please provide:

- A concise description of the vulnerability and its security impact.
- The affected version, commit, component, and deployment configuration.
- Reproduction steps or a minimal proof of concept.
- Any authentication, permissions, or other prerequisites.
- Expected behavior and observed behavior.
- Redacted logs or screenshots, where useful.
- Suggested mitigations, if known.
- Your preferred contact method and whether you would like public credit.

Use synthetic data where possible. Do not submit live credentials,
unnecessary personal information, or data belonging to other users.

## Response and Resolution

No guaranteed acknowledgment, update, or resolution timeframe is currently
published.

During triage, maintainers may request additional information to reproduce
the issue and assess its impact. Timing will depend on severity,
reproducibility, available mitigations, and maintainer availability.

For an accepted report, maintainers will aim to:

- Confirm the affected components and security impact.
- Coordinate an appropriate fix or mitigation.
- Communicate material status changes through the private reporting channel.
- Coordinate public disclosure after a fix or mitigation is available.

If a report is declined or considered outside scope, maintainers will aim
to explain the decision. Reporters may provide additional evidence for
reconsideration.

## Responsible Testing

Conduct testing only against environments you own or have explicit
authorization to assess.

- Use local or isolated test deployments whenever possible.
- Do not access, modify, or delete another user's data.
- Do not perform denial-of-service attacks or disruptive testing.
- Do not use exposed credentials to access external services.
- Stop testing once you have suffic
