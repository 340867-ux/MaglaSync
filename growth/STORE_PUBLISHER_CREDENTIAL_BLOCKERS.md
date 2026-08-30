# Browser-store publisher credential blockers

Status date: 2026-08-30

MaglaSync source release `1.2.4` builds reproducibly for Chromium and Firefox. The guarded submission workflow reached credential validation for both stores and stopped before upload because publisher credentials are not present in GitHub Actions secrets.

## Chrome Web Store

Public listing: https://chromewebstore.google.com/detail/maglasync-free/hhcmedgckaedhlegpgphflmmmhfaegpi

Required GitHub Actions secrets currently absent:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`

Observed result: `Validate Chrome Web Store credentials` failed before token acquisition or upload. No Chrome package was submitted by the workflow.

## Mozilla Add-ons

Public listing: https://addons.mozilla.org/addon/maglasync-free/

Required GitHub Actions secrets currently absent:

- `AMO_JWT_ISSUER`
- `AMO_JWT_SECRET`

Observed result: Firefox-only submission passed the full build/test/lint stage and failed at `Validate Mozilla Add-ons credentials` before signing/upload. No Firefox package was submitted by the workflow.

## Rule

Do not blindly rerun browser-store submission workflows while these credentials remain absent. Continue organic acquisition against the currently signed public listings. Once the publisher credentials are added, use the existing guarded `store-submit.yml` workflow to submit the current reviewed version.
