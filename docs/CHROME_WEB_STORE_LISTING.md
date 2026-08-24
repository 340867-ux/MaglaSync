# Chrome Web Store submission pack

This file contains the exact public listing copy and privacy declarations for MaglaSync Free 1.2.0.

## Product details

**Name:** MaglaSync Free

**Category:** Productivity

**Primary language:** English

**Summary:**

> Continue one project across the ChatGPT, Claude, and Gemini chats you choose. Free, local, and no API key.

**Detailed description:**

> MaglaSync keeps one long-running project continuous across ChatGPT, Claude, and Gemini.
>
> Start a new supported AI chat without explaining the entire project again. Every chat starts disconnected. Only after you click Connect chat can that conversation add recent messages and project updates to the local journal. You review and can edit the complete handoff before placing it in the chat box, and you press Send yourself.
>
> Free edition features:
>
> - one local project;
> - explicit per-chat connection and project isolation;
> - review and editing before context is placed in a chat;
> - structured decisions, reported completed results, blockers, and next steps;
> - 24 recent messages by default, with longer history as an opt-in;
> - local JSON backup and verified restore;
> - history integrity checks;
> - no MaglaSync account, AI API key, analytics, advertising, or backend.
>
> MaglaSync Free stores project data in the browser profile. When you press Send, the selected AI provider receives the prepared context under that provider's own privacy terms.

## Required URLs

- Homepage: `https://sync.magla.ru/en/`
- Support: `https://github.com/340867-ux/MaglaSync/issues`
- Privacy policy: `https://github.com/340867-ux/MaglaSync/blob/main/PRIVACY.md`

## Graphic assets

- Store icon: `icons/icon128.png`
- Screenshot 1: `assets/store/screenshot-chat-sync.png` — 1280×800
- Screenshot 2: `assets/store/screenshot-dashboard.png` — 1280×800
- Small promo tile: `assets/store/promo-small.png` — 440×280
- Marquee image: `assets/store/promo-marquee.png` — 1400×560

## Single purpose

MaglaSync provides local project continuity between supported AI chat websites by saving messages only from chats the user explicitly connects and preparing reviewed context for a chat box.

## Permission justifications

**`storage`:** stores the user's project passport, explicit chat connections, connected-chat messages, structured state, settings, backup verification data, and integrity hashes locally in the browser profile.

**Host access to `chatgpt.com`, `claude.ai`, and `gemini.google.com`:** required to display MaglaSync status, read visible messages only after the user connects that exact chat, and place—but never submit—reviewed context in an empty composer.

## Remote code

MaglaSync Free executes no remote code. Runtime JavaScript and CSS are included in the extension package. The release gate rejects remote script tags, network APIs, `eval`, and Function constructors in runtime files.

## Data-use disclosure

MaglaSync handles personal communications and website content only for chats the user explicitly connects. This data is stored locally for the user-requested continuity function. It is not sold, used for advertising or credit decisions, or intentionally transmitted to MaglaSync, MAGLA, or another backend. When the user reviews and sends prepared context, that selected AI provider receives it under its own terms.

Backups are user-initiated JSON downloads and are not encrypted. Users can disconnect a chat and remove its records, disable connected-chat saving, keep only the default short buffer, export a backup, restore a verified backup, delete all local data, or remove the extension.

## Reviewer notes

1. Load the unpacked extension.
2. Open its options page and create one project with a name and goal.
3. Open a supported AI site and reload the tab.
4. Confirm the MaglaSync status panel appears.
5. Confirm the panel says the chat is not connected and no messages appear in the journal.
6. Click Connect chat, then Review context. Edit the preview and choose Place in chat.
7. Confirm the text is placed but not submitted. Press Send manually and confirm only this connected chat appears in the journal.
