# Publishing status

Last updated: 2026-08-30

| Channel | Status | Evidence level | Public route / next proof |
| --- | --- | --- | --- |
| GitHub Release | Source releases are published reproducibly by the `Release` workflow; check `releases/latest` for the current source version | Public release assets, checksums, CI and repository source | `https://github.com/340867-ux/MaglaSync/releases/latest`; source versions may lead browser-store review |
| GitHub Pages product site | **Published** at `https://sync.magla.ru/`, including signed-store install routes, organic search guides and the press/reviewer room | GitHub Pages workflow PASS on `main` | Keep every ordinary-user CTA store-first and every growth page canonical/indexed |
| Chrome Web Store | **Published; public listing currently shows v1.2.0 and English (United States)** | Public Chrome Web Store listing verified 2026-08-30 | `https://chromewebstore.google.com/detail/maglasync-free/hhcmedgckaedhlegpgphflmmmhfaegpi`; next approved update must be proven from the public listing, not merely from upload/submission |
| Firefox AMO | **Published; v1.2.1 approved for public use by Mozilla automated screening on 2026-08-29, subject to later human review** | Mozilla Add-ons email plus public listing route | `https://addons.mozilla.org/addon/maglasync-free/`; preserve exact reviewer-source reproducibility on every update |
| Microsoft Edge Add-ons | Not submitted | No signed Edge listing proof | Publisher login, upload, Microsoft review |
| Safari / App Store | Web Extension Packager source route prepared; not publicly released | Source package and current Apple route documented | App Store Connect upload, TestFlight, real-device tests, App Review |

## Current acquisition rule

Chrome Web Store and Firefox AMO are the primary installers for ordinary users. Public promotion sends users to the signed browser-store listings directly or through `https://sync.magla.ru/install/` / `https://sync.magla.ru/en/install/`, never to a developer-mode ZIP as the default path.

GitHub source releases can move faster than Chrome/Firefox review. A source version is **not** called a store release until the corresponding signed public listing shows it.

The ZIP remains useful for source inspection, deterministic packaging, browser-store review, and development. It is not the ordinary-user growth path while signed listings are available.
