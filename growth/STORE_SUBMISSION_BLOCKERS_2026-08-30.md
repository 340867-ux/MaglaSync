# Browser store submission blockers — 2026-08-30

Current source/release candidate: MaglaSync Free v1.2.4.

## Chrome Web Store

A guarded v1.2.4 submission was actually dispatched from GitHub Actions. Build/package/lint passed, but the external upload was stopped before any Chrome API call because these repository secrets are absent:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`

No Chrome upload or publish request occurred.

## Mozilla Add-ons

A separate Firefox-only v1.2.4 submission was actually dispatched. Build/package/lint passed, but external upload was stopped before `web-ext sign` because these repository secrets are absent:

- `AMO_JWT_ISSUER`
- `AMO_JWT_SECRET`

No AMO upload occurred.

## Safety / next action

Do not claim v1.2.4 is submitted to either signed store until direct store evidence exists. Once the publisher credentials are added to GitHub Secrets, use the existing guarded `Submit browser stores` workflow with explicit `SUBMIT` confirmation. Do not commit credentials to the repository.
