# MaglaSync Free 1.2.4

This release expands store discovery without changing the privacy or permission boundary.

## What changed

- Localized the extension name and store-suitable short description for 13 locales: English, Russian, Spanish, Brazilian Portuguese, German, French, Indonesian, Japanese, Korean, Hindi, Simplified Chinese, Traditional Chinese, and Arabic.
- The localized identity keeps the same factual promise in every language: local project memory across ChatGPT, Claude, and Gemini.
- Chromium and Firefox packages now contain the same locale set.
- The deterministic release gate validates every locale and enforces Chrome's name/description length limits.

## What did not change

- No new browser permissions.
- No analytics, advertising runtime, MaglaSync backend, or AI API client.
- Every supported chat remains disconnected until the user explicitly connects it.
- The user still reviews the handoff and presses Send manually.

Store review and rollout are separate from this source release; the signed Chrome and Firefox listings remain authoritative for the version currently available to ordinary users.
