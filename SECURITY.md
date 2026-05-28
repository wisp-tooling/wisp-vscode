# Security Policy

## Supported versions

No public release has been published yet. Security support starts with the first public release.

## Reporting a vulnerability

Until the public repository and organization are finalized, report issues directly to the maintainer through the private project channel.

After publishing, this file should be updated with the official `wisp-tooling` security contact or GitHub Security Advisories process.

## Project security principles

- No external executable is required for core modal editing behavior.
- Runtime dependencies should remain zero unless explicitly approved.
- Development dependencies should stay minimal and auditable.
- VS Code APIs must not be imported from `src/core`.
- Webviews, if added later, must use a strict CSP and no external assets/scripts.
