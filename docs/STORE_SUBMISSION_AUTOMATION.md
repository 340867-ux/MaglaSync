# Browser-store submission automation

MaglaSync builds reproducible release packages in GitHub Actions. `.github/workflows/store-submit.yml` adds the next step: a **manual, explicitly confirmed** submission of the current manifest version to Chrome Web Store, Mozilla Add-ons, or both.

The workflow does not run on push. A maintainer must start `Submit browser stores`, choose a target, and type `SUBMIT`. Store submission still enters each store's normal review process; a successful API request is not the same as review approval.

## Chrome Web Store — one-time setup

The workflow uses the Chrome Web Store API **v2** for the existing extension ID:

`hhcmedgckaedhlegpgphflmmmhfaegpi`

Google's official setup requires the Chrome Web Store API to be enabled in a Google Cloud project, OAuth credentials, a refresh token for the `https://www.googleapis.com/auth/chromewebstore` scope, and the publisher ID from Chrome Web Store Developer Dashboard → Publisher → Settings.

Add these values as GitHub Actions repository secrets:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`

The workflow exchanges the refresh token for a short-lived access token, uploads `dist/maglasync-free-chromium-v<version>.zip`, waits if the upload reports `UPLOAD_IN_PROGRESS`, then calls the v2 `publish` endpoint. The store then reviews the version before it becomes public.

Do not commit any OAuth token, client secret, refresh token, or publisher credential to the repository.

Official reference: `https://developer.chrome.com/docs/webstore/using-api`

## Mozilla Add-ons — one-time setup

Mozilla supports submitting updates to an existing listed extension with `web-ext sign --channel=listed`. MaglaSync's Firefox manifest already contains the stable add-on ID `maglasync@magla.ru`, which is required for update submission.

Create API credentials in the Mozilla Add-ons developer credentials page, then add them as GitHub Actions repository secrets:

- `AMO_JWT_ISSUER`
- `AMO_JWT_SECRET`

The workflow builds the deterministic Firefox package, extracts the exact built package into a clean temporary directory, verifies the add-on ID, and submits it with pinned `web-ext@10.6.0`. It also uploads the deterministic human-readable source archive used for reviewer reconstruction.

Do not commit the AMO issuer secret or JWT secret to the repository.

Official references:

- `https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/`
- `https://extensionworkshop.com/documentation/develop/web-ext-command-reference/`

## Running a submission

1. Ensure `main` is green and the intended version is already present in `manifest.json` and `platform/firefox/manifest.json`.
2. Ensure the matching GitHub Release exists and its reproducible packages are green.
3. Open GitHub Actions → **Submit browser stores** → **Run workflow**.
4. Choose `chrome`, `firefox`, or `both`.
5. Type `SUBMIT` exactly.
6. Read the workflow output. Treat “submission requested” as **under review**, not as public approval.
7. Update `docs/PUBLISHING_STATUS.md` only after store evidence confirms the new public version.

## Safety boundary

The automation deliberately does **not**:

- publish on every push;
- bypass store review;
- alter listing visibility;
- fabricate install, review, or rating activity;
- put store credentials in source control;
- mark a submitted version as publicly approved before the store confirms it.
