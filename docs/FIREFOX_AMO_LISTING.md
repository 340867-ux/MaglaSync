# Firefox Add-ons submission pack

Upload `maglasync-free-firefox-v1.2.1.zip` to Mozilla Add-ons (AMO). The file is an unsigned candidate until Mozilla accepts and signs it. When AMO asks for reviewer source, upload `maglasync-free-firefox-source-v1.2.1.zip`.

## Listing

**Name:** MaglaSync Free

**Category:** Productivity

**Summary:**

> Keep one local project continuous across ChatGPT, Claude, and Gemini chats.

**Description:**

> Every chat starts disconnected. After you connect a project chat, MaglaSync Free saves a short recent buffer locally and prepares the current goal, rules, decisions, reported results, blockers, and next steps. You review and edit the context before placing it in the chat, and press Send yourself.
>
> The Free edition has one project, local backup and restore, history integrity checks, and no MaglaSync account, API key, analytics, advertising, backend, or remote runtime code.

**Homepage:** `https://sync.magla.ru/en/`

**Support:** `https://github.com/340867-ux/MaglaSync/issues`

**Privacy:** `https://github.com/340867-ux/MaglaSync/blob/main/PRIVACY.md`

## Reviewer notes

The Firefox build uses Manifest V2 with a non-persistent event page because Mozilla recommends event pages for Firefox Android. `background.bundle.js` and `dashboard/dashboard.bundle.js` are deterministic, readable bundles of the repository's `shared/core.js` plus the relevant entry point; no remote code is added. The separate reviewer source ZIP rebuilds the submitted extension exactly with Node.js 22 and Info-ZIP 3.0.

The extension reads messages only in a chat the user explicitly connects and stores the selected project journal only in Firefox extension storage. It does not collect, transmit, sell, or share data outside the local browser. The manifest therefore declares Mozilla's built-in `data_collection_permissions.required = ["none"]`. The minimum versions are Firefox 140 desktop and Firefox 142 Android, matching Mozilla's built-in data-consent availability floors.

CI runs `web-ext@10.6.0 lint --warnings-as-errors`. Before enabling Android compatibility publicly, test on a real current Firefox Android device and verify every critical path in [PLATFORM_MATRIX.md](PLATFORM_MATRIX.md).
