# MaglaSync Free 1.2.2

MaglaSync Free 1.2.2 is a small activation-and-discovery maintenance release for the now-public Chrome and Firefox editions.

## User-visible changes

- Fixes popup startup ordering so the extension API is ready before the first project-state render.
- Adds a voluntary **Share MaglaSync** button after a project exists. Sharing is initiated only by the user and adds no new browser permission.
- Clarifies the product description as local project memory across ChatGPT, Claude, and Gemini.

## Distribution changes

- Adds direct signed-store install pages for Chrome and Firefox in English and Russian.
- Adds substantive English guides for AI chat memory and ChatGPT-to-Claude project continuity.
- Switches public launch documentation away from developer-mode ZIP installation toward the signed browser stores.
- Adds a tracked zero-budget organic growth system and distribution queue.

## Privacy and permission boundary

Unchanged:

- Chromium still requests only `storage` plus the existing scoped content-script matches.
- Firefox retains its exact no-data-collection declaration.
- No analytics, advertising, remote runtime code, automatic sharing, address-book access, or growth tracking permission was added.
- Every chat still starts disconnected and sending remains user-controlled.
