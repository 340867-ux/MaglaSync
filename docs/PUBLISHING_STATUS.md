# Publishing status

Last updated: 2026-08-30

| Channel | Status | Evidence level | Public route / next proof |
| --- | --- | --- | --- |
| GitHub Release | **Published: MaglaSync Free v1.2.4** with reproducible Chromium/Firefox packages, Firefox reviewer source, Chrome store kit and `SHA256SUMS.txt` | Release workflow PASS; public release assets carry SHA-256 digests | `https://github.com/340867-ux/MaglaSync/releases/tag/v1.2.4` |
| GitHub Pages product site | **Published** at `https://sync.magla.ru/`, including signed-store install routes, organic search guides and the press/reviewer room | GitHub Pages workflow PASS on `main` | Keep every ordinary-user CTA store-first and every growth page canonical/indexed |
| Chrome Web Store | **Published; public listing currently shows v1.2.0 and English (United States). v1.2.4 is NOT submitted yet.** | Public listing verified 2026-08-30; one-time submission probe rebuilt/validated v1.2.4 but stopped before upload because Chrome publisher GitHub Secrets were empty | `https://chromewebstore.google.com/detail/maglasync-free/hhcmedgckaedhlegpgphflmmmhfaegpi`; provision `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_PUBLISHER_ID`, then run the guarded manual submission workflow |
| Firefox AMO | **Published: v1.2.1. v1.2.4 is NOT submitted yet.** | Mozilla approval email proves v1.2.1 public; one-time v1.2.4 submission probe rebuilt and passed AMO lint but stopped before upload because `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` were empty | `https://addons.mozilla.org/addon/maglasync-free/`; provision AMO API credentials as GitHub Secrets, then run the guarded manual submission workflow |
| Microsoft Edge | Edge users can now be routed to the signed Chrome Web Store edition through a dedicated indexed guide; no separate Edge Add-ons listing | Microsoft documents compatible Chrome Web Store extension installation in Edge; product guide is store-first | Continue using the signed Chrome listing for ordinary Edge users while a separate Edge Add-ons submission remains optional |
| Brave | Brave users can be routed to the signed Chrome Web Store edition through a dedicated indexed guide | Brave documents Chrome Web Store extension compatibility; product guide is store-first | Continue using the signed Chrome listing for Brave users |
| Safari / App Store | Web Extension Packager source route prepared; not publicly released | Source package and current Apple route documented | App Store Connect upload, TestFlight, real-device tests, App Review |

## Current browser-store update blocker

A one-time, version-locked submission probe was executed against the verified MaglaSync Free **v1.2.4 release commit `4809b58fbc58d9dc948ccdfb9ff080ea0ccc4e30`**.

Both jobs independently rebuilt the exact release and passed the product/package gates:

- 57/57 Node tests PASS;
- package checks PASS;
- Chromium and Firefox packages built successfully;
- 13 locale metadata sets validated;
- Firefox `web-ext@10.6.0` lint: 0 errors, 0 warnings, 0 notices.

The external upload steps did **not** begin.

Chrome stopped at the credential gate because the repository currently supplies no values for:

- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_REFRESH_TOKEN`
- `CWS_PUBLISHER_ID`

Firefox stopped at the credential gate because the repository currently supplies no values for:

- `AMO_JWT_ISSUER`
- `AMO_JWT_SECRET`

Evidence run: GitHub Actions run `33315188696`. The temporary push-triggered runner used only for this credential probe was removed immediately after the result. The permanent `.github/workflows/store-submit.yml` remains manual-only and requires explicit `SUBMIT` confirmation.

## Current acquisition rule

Chrome Web Store and Firefox AMO are the primary installers for ordinary users. Public promotion sends users to the signed browser-store listings directly or through `https://sync.magla.ru/install/` / `https://sync.magla.ru/en/install/`, never to a developer-mode ZIP as the default path.

GitHub source releases can move faster than Chrome/Firefox review. A source version is **not** called a store release until the corresponding signed public listing shows it.

The ZIP remains useful for source inspection, deterministic packaging, browser-store review, and development. It is not the ordinary-user growth path while signed listings are available.
