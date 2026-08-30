# Changelog

## 1.2.2 — 2026-08-30

- Fixed popup startup ordering so the browser extension API is initialized before the first state render.
- Added an explicit, user-triggered `Share MaglaSync` action; it never auto-posts, reads contacts, or adds growth permissions.
- Improved the extension description around local project memory across ChatGPT, Claude, and Gemini.
- Added direct signed-store install pages for Chrome and Firefox in English and Russian.
- Added substantive organic-search guides for AI chat memory and ChatGPT-to-Claude project continuity.
- Added the zero-budget Organic 50K operating system and a tracked distribution queue.
- Updated publication and launch documentation to use the live Chrome Web Store and Firefox Add-ons routes instead of developer-mode ZIP installation for ordinary users.

## 1.2.1 — 2026-08-26

- Added Firefox's mandatory built-in no-data-collection declaration.
- Raised Firefox compatibility floors to 140 desktop and 142 Android for the built-in consent system.
- Added a deterministic Mozilla reviewer-source package and exact rebuild instructions.
- Added a pinned `web-ext` 10.6.0 warnings-as-errors release gate.
- Updated Safari publishing to Apple's browser-based Web Extension Packager and TestFlight route.

## 1.2.0 — 2026-08-24

- Changed to explicit per-chat connection: unopened and unconnected conversations are not captured.
- Added background enforcement that rejects messages from unconnected, wrong-platform, or stale-goal chats.
- Removed automatic context loading; users now review, edit, and explicitly place context in the chat box.
- Added a privacy-first 24-message recent buffer; keeping up to 400 messages is now an opt-in setting.
- Added connected-chat management and local record removal on disconnect.
- Added goal-version isolation so changed projects cannot silently reuse stale chat connections.
- Added fail-closed journal locking when integrity verification fails.
- Added safe migration from earlier versions: keep the project passport, disconnect old chats, and remove records captured by the old automatic mode.
- Expanded the defensive test suite from 8 to 17 tests.
- Added a Safari-preserved `.zip.keep` copy of the Chromium publisher package and documented how to rename it back to `.zip` before Chrome Web Store upload.
- Added a complete Russian Chrome Web Store submission checklist, a public browser-friendly privacy page, and a ready-to-use submission kit with all listing images and copy.

## 1.1.0 — 2026-08-24

- Added reproducible Chromium, Firefox, and Safari-source packages.
- Added a cross-browser extension API adapter.
- Added Russian and English product pages for `sync.magla.ru`.
- Added platform, monetization, and launch documentation.
- Added Telegram, YouTube, and TikTok promotional artwork and scripts.

## 1.0.0 — 2026-08-24

- First public MaglaSync Free release.
- Automatic local message capture for ChatGPT, Claude, and Gemini.
- Automatic context loading into an empty new chat composer.
- Human confirmation retained: MaglaSync never presses Send.
- One free local project with exact goal and rules.
- Structured state blocks for decisions, verified facts, blockers, next steps, and constraints.
- Local project journal and recent-message viewer.
- SHA-256 chained history verification.
- JSON backup, verified restore, and local deletion.
- Manifest V3 package with only the `storage` permission and three scoped chat-site matches.
