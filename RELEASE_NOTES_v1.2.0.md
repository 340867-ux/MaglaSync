# MaglaSync Free 1.2.0

## Privacy-first chat connections

Version 1.2 changes the core rule: opening ChatGPT, Claude, or Gemini is not enough for MaglaSync to read a conversation. Every chat starts disconnected, and the user must connect that exact project chat first.

## What changed

- explicit **Connect chat** and **Disconnect** controls;
- background rejection of records from unconnected, wrong-platform, or stale-project chats;
- separate editable context preview before anything is placed in a chat box;
- no automatic context loading and no automatic sending;
- 24 recent connected-chat messages retained by default;
- optional extended-history setting with a 400-message limit;
- local records for a chat are removed when it is disconnected;
- changing the project goal pauses old connections until the user reconnects them;
- integrity failures lock capture and context placement instead of silently rebuilding history;
- safe migration from older versions keeps the project passport but removes records captured by the previous automatic mode.

## Verification

- 17 defensive core tests;
- reproducible Chromium, Firefox candidate, and Safari source packages;
- offline boundary check: no analytics, backend calls, remote scripts, or dynamic code execution;
- only the browser `storage` permission plus narrowly scoped supported-site access.

AI-reported completed results remain reports, not independent proof. Review important claims and keep real evidence separately.
