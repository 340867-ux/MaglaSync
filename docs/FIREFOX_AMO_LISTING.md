# Firefox Add-ons submission pack

Upload `maglasync-free-firefox-v1.1.0.zip` to Mozilla Add-ons (AMO). The file is an unsigned candidate until Mozilla accepts and signs it.

## Listing

**Name:** MaglaSync Free

**Category:** Productivity

**Summary:**

> Keep one local project continuous across ChatGPT, Claude, and Gemini chats.

**Description:**

> MaglaSync Free saves visible project messages locally and prepares the current goal, rules, decisions, verified results, blockers, and next steps in an empty new ChatGPT, Claude, or Gemini chat. You review the context and press Send yourself.
>
> The Free edition has one project, local backup and restore, history integrity checks, and no MaglaSync account, API key, analytics, advertising, backend, or remote runtime code.

**Homepage:** `https://sync.magla.ru/en/`

**Support:** `https://github.com/340867-ux/MaglaSync/issues`

**Privacy:** `https://github.com/340867-ux/MaglaSync/blob/main/PRIVACY.md`

## Reviewer notes

The Firefox build uses Manifest V2 with a non-persistent event page because Mozilla recommends event pages for Firefox Android. `background.bundle.js` and `dashboard/dashboard.bundle.js` are deterministic bundles of the repository's `shared/core.js` plus the relevant entry point; no remote code is added.

Before enabling Android compatibility, run `web-ext lint`, test on a real current Firefox Android device, and verify every critical path in [PLATFORM_MATRIX.md](PLATFORM_MATRIX.md).
