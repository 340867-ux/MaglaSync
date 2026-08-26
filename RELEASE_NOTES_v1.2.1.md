# MaglaSync Free 1.2.1

This is a publication-readiness release for Firefox and Safari. Runtime project-memory behaviour is unchanged from 1.2.0.

## Firefox

- Declares Mozilla's mandatory built-in `none` data-collection permission because MaglaSync Free does not transmit data outside the local browser.
- Uses Firefox 140 desktop and Firefox 142 Android as the matching consent-system compatibility floors.
- Ships a deterministic AMO reviewer-source archive with exact rebuild instructions.
- Gates the Firefox package with `web-ext` 10.6.0 and treats warnings as errors.

## Safari

- Keeps the inspectable Safari WebExtension source package.
- Documents Apple's current App Store Connect Web Extension Packager route, which no longer requires a Mac or Xcode for conversion.
- Keeps TestFlight, real-device acceptance tests, Apple identity, and App Review as explicit release gates.

## Included artifacts

- `maglasync-free-firefox-v1.2.1.zip`
- `maglasync-free-firefox-source-v1.2.1.zip`
- `maglasync-free-safari-source-v1.2.1.zip`
- Chromium and Chrome submission packages rebuilt from the same 1.2.1 source tree
- `SHA256SUMS.txt`
