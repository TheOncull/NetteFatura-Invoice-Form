# Security Policy

## Supported versions

Security fixes are applied to the latest version on the default branch until tagged releases are introduced.

## Reporting a vulnerability

Do not publish customer data, credentials, invoice payloads, or working exploits in a public issue. Use GitHub's private vulnerability reporting feature for this repository. Include the affected version, impact, reproduction steps using synthetic data, and a suggested remediation when available.

## Integration requirements

- Keep NetteFatura SOAP access and IP–VKN configuration on the server.
- Validate every browser-supplied field again on the server.
- Use same-origin HTTPS endpoints or a narrowly configured CORS policy.
- Apply authentication, authorization, rate limits, request-size limits, and CSRF controls appropriate to the host checkout.
- Do not put invoice fields in URLs, analytics, console logs, or error-monitoring breadcrumbs.
- Maintain an appropriate retention and deletion policy for invoice data.

This component stores values only in memory and does not send them until host application code chooses to do so.
