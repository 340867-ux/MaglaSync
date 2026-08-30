# Publishing status

Last updated: 2026-08-30

| Channel | Status | Evidence level | Public route / next proof |
| --- | --- | --- | --- |
| GitHub Release | Published: MaglaSync Free v1.2.0; v1.2.1 source manifests prepared | Public release and repository source verified | Keep release packages and checksums current; next signed-store maintenance build should include the popup activation fix |
| GitHub Pages product site | Published at `https://sync.magla.ru/` | Public product, privacy, and submission-kit URLs verified | Deploy the direct signed-store install pages and organic search pages from the growth branch |
| Chrome Web Store | **Published** | Public listing verified | `https://chromewebstore.google.com/detail/maglasync-free/hhcmedgckaedhlegpgphflmmmhfaegpi` |
| Firefox AMO | **Published / tentatively approved by automated screening on 2026-08-29** | Mozilla Add-ons email states the add-on is available publicly and remains subject to possible human review | `https://addons.mozilla.org/addon/maglasync-free/`; preserve reviewer-source reproducibility for future updates |
| Microsoft Edge Add-ons | Not submitted | Partner Center browser access remains blocked | Publisher login, upload, and Microsoft review |
| Safari / App Store | v1.2.1 Web Packager source prepared; not submitted | Source package and current Apple route documented | App Store Connect upload, TestFlight, real-device tests, App Review |

## Current acquisition rule

Chrome Web Store and Firefox AMO are now the primary installers for ordinary users. Public promotion should send users to the signed browser-store listings (directly or through `https://sync.magla.ru/install/` / `https://sync.magla.ru/en/install/`) rather than to a developer-mode ZIP.

The ZIP remains useful for source inspection, deterministic packaging, review, and development, but it is no longer the default growth path once a signed store listing is available.
