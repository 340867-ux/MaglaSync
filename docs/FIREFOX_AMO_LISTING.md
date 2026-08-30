# Firefox Add-ons (AMO) listing pack

This file contains the recommended listing copy for **MaglaSync Free** on Mozilla Add-ons.

Public listing:

`https://addons.mozilla.org/addon/maglasync-free/`

Mozilla approved version **1.2.1** for public use on 2026-08-29. Later repository releases must not be described as public on AMO until Mozilla confirms the new listed version.

## Recommended name

**MaglaSync Free**

## Category

**Productivity**

## Recommended summary

> Local project memory for ChatGPT, Claude & Gemini. Continue in a fresh chat or switch AI tools without rebuilding the project context.

## Recommended description

> **Keep the project when you open a fresh AI chat.**
>
> MaglaSync Free keeps one project's working memory available across the ChatGPT, Claude, and Gemini chats you explicitly connect.
>
> Instead of replaying the entire old conversation, carry the current project state forward: goal, decisions, constraints, reported results, blockers, next steps, and a bounded recent-message buffer.
>
> **You stay in control:**
>
> - every chat starts disconnected;
> - only chats you explicitly connect can join the local project journal;
> - you review and can edit the handoff before it is placed into another AI chat;
> - MaglaSync never presses Send for you.
>
> **Useful when:**
>
> - a long ChatGPT, Claude, or Gemini thread is becoming hard to continue;
> - you want to start a fresh chat without re-explaining the project;
> - you want to move the working state between the supported AI tools;
> - you return to a project later and need its current state.
>
> **Free edition includes:**
>
> - one local project;
> - explicit per-chat connection;
> - 24 recent messages by default, with extended local history as an opt-in;
> - structured project updates;
> - local JSON backup and verified restore;
> - journal integrity checks;
> - user-triggered sharing;
> - an honest-review link only after meaningful use;
> - no MaglaSync account or AI API key;
> - no analytics or advertising backend;
> - no automatic message sending.
>
> The project journal stays in the installed extension's local browser storage. MaglaSync is free and open source under the MIT License.

## Links

- Product: `https://sync.magla.ru/en/`
- Install selector: `https://sync.magla.ru/en/install/`
- Source: `https://github.com/340867-ux/MaglaSync`
- Privacy: `https://sync.magla.ru/privacy/`
- Support: `https://github.com/340867-ux/MaglaSync/issues`

## Search-language discipline

Use natural language around the actual job:

- AI project memory;
- fresh AI chat;
- ChatGPT context;
- Claude project context;
- Gemini project context;
- move project context between AI tools.

Do not repeat keyword lists inside public copy merely to influence ranking. The listing should remain readable and accurately describe the product.

## Reviewer source and package notes

For a new listed version, submit the deterministic Firefox package produced by `node tools/package.mjs` together with the matching reviewer source archive when AMO requests source. The current repository release is 1.2.3, but it remains separate from the AMO-public version until Mozilla accepts it.

The Firefox build uses Manifest V2 with a non-persistent event page. `background.bundle.js` and `dashboard/dashboard.bundle.js` are deterministic, readable bundles of the repository's `shared/core.js` plus the relevant entry point; no remote code is added. The reviewer source package rebuilds the extension with the pinned project tooling.

The extension reads messages only in a chat the user explicitly connects and stores the selected project journal only in Firefox extension storage. It does not collect, transmit, sell, or share data outside the local browser. The manifest therefore declares Mozilla's built-in `data_collection_permissions.required = ["none"]`. The minimum versions are Firefox 140 desktop and Firefox 142 Android, matching the package's current consent floor.

CI runs the pinned Firefox lint gate with warnings treated as errors. Before expanding Android claims, test the critical paths on a current real Firefox Android device and keep [PLATFORM_MATRIX.md](PLATFORM_MATRIX.md) authoritative.

## Version and review discipline

- An AMO upload is **under review** until Mozilla confirms a listed public version.
- Never report a repository release number as the AMO public version without store evidence.
- Never use incentivized ratings, paid review exchanges, review farms, fake accounts, or purchased installs.
- Human review remains authoritative even after automated screening.
