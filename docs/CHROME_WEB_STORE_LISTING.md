# Chrome Web Store listing pack

This file contains the recommended public listing copy and privacy declarations for **MaglaSync Free 1.2.3**.

The current public Chrome Web Store item is:

`https://chromewebstore.google.com/detail/maglasync-free/hhcmedgckaedhlegpgphflmmmhfaegpi`

Do not describe a version as public until Chrome Web Store confirms it. The repository release version and the store-public version may temporarily differ while an update is under review.

## Product details

**Name:** MaglaSync Free

**Category:** Workflow & Planning

**Primary language:** English

**Recommended short description (111 characters):**

> Local project memory for ChatGPT, Claude & Gemini. Start a fresh chat or switch AI tools without re-explaining.

The first phrase deliberately names the job people search for — **project memory** — and the supported AI products. The second phrase explains the two high-intent use cases: a fresh chat and switching AI tools. Do not pad this field with repeated keywords.

## Recommended detailed description

> **Stop rebuilding the same project every time you open a fresh AI chat.**
>
> MaglaSync Free keeps one project's working memory available across the ChatGPT, Claude, and Gemini chats you explicitly connect.
>
> Carry forward what matters now: the project goal, decisions, constraints, reported results, blockers, next steps, and a bounded recent-message buffer. Before anything is placed into another AI chat, MaglaSync shows you the handoff so you can review and edit it. You press Send yourself.
>
> **Use MaglaSync when:**
>
> - a ChatGPT, Claude, or Gemini conversation has become too long and you want a fresh chat;
> - you want to continue the same project in another AI tool without re-explaining it;
> - you return to a project later and need the current state rather than the entire old transcript.
>
> **Free edition:**
>
> - one local project;
> - ChatGPT, Claude, and Gemini web chats;
> - explicit per-chat connection — unconnected chats do not join the project journal;
> - review and editing before context is placed into a chat;
> - 24 recent messages by default, with extended local history as an opt-in;
> - local JSON backup and verified restore;
> - history integrity checks;
> - user-triggered sharing and an honest-review link only after meaningful use;
> - no MaglaSync account;
> - no AI API key;
> - no analytics, advertising backend, or remote runtime code;
> - no automatic message sending.
>
> MaglaSync Free stores the project journal in the browser profile. When you choose to place reviewed context into an AI chat and press Send, that AI provider receives the text under its own privacy terms.
>
> MaglaSync is free and open source under the MIT License.

## Required URLs

- Homepage: `https://sync.magla.ru/en/`
- Install selector: `https://sync.magla.ru/en/install/`
- Source: `https://github.com/340867-ux/MaglaSync`
- Support: `https://github.com/340867-ux/MaglaSync/issues`
- Privacy policy: `https://sync.magla.ru/privacy/`

## Graphic assets

- Store icon: `icons/icon128.png`
- Screenshot 1: `assets/store/screenshot-chat-sync.png` — 1280×800
- Screenshot 2: `assets/store/screenshot-dashboard.png` — 1280×800
- Small promo tile: `assets/store/promo-small.png` — 440×280
- Marquee image: `assets/store/promo-marquee.png` — 1400×560

Before uploading an update, check the screenshots against the current UI. Do not leave an old screenshot in the listing if it materially misrepresents the current workflow.

## Single purpose

MaglaSync provides local project memory and continuity between supported AI chat websites by saving messages only from chats the user explicitly connects and preparing user-reviewed project context for a chat box.

## Permission justifications

**`storage`:** stores the user's project passport, explicit chat connections, connected-chat messages, structured state, settings, backup verification data, and integrity hashes locally in the browser profile.

**Host access to `chatgpt.com`, `claude.ai`, and `gemini.google.com`:** required to display MaglaSync status, read visible messages only after the user connects that exact chat, and place — but never submit — reviewed context in an empty composer.

## Remote code

MaglaSync Free executes no remote code. Runtime JavaScript and CSS are included in the extension package. The release gate rejects remote script tags, network APIs, `eval`, and Function constructors in runtime files.

## Data-use disclosure

MaglaSync handles personal communications and website content only for chats the user explicitly connects. This data is stored locally for the user-requested continuity function. It is not sold, used for advertising or credit decisions, or intentionally transmitted to MaglaSync, MAGLA, or another backend. When the user reviews and sends prepared context, the selected AI provider receives it under its own terms.

Backups are user-initiated JSON downloads and are not encrypted. Users can disconnect a chat and remove its records, disable connected-chat saving, keep only the default short buffer, export a backup, restore a verified backup, delete all local data, or remove the extension.

## Reviewer notes for 1.2.3

1. Load the submitted package or install the review build.
2. Open its options page and create one project with a name and goal.
3. Open a supported AI site and reload the tab.
4. Confirm the MaglaSync status panel appears.
5. Confirm the chat is not connected and no messages from it are saved before explicit connection.
6. Click **Connect chat**, then **Review context**. Edit the preview and choose **Place in chat**.
7. Confirm the text is placed but not submitted. Press Send manually and confirm only this connected chat appears in the journal.
8. Confirm **Share MaglaSync** is user-triggered only.
9. Confirm **Leave an honest review** is hidden until at least three saved project updates exist and remains hidden when integrity verification reports an error.

## Update discipline

- The signed store listing is the ordinary-user installation route.
- The GitHub ZIP is a developer/reviewer fallback, not the main acquisition CTA.
- Never claim store approval merely because an upload API call succeeded.
- Never use paid review exchanges, review farms, incentives, fake accounts, or purchased installs.
