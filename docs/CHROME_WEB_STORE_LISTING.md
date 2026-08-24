# Chrome Web Store submission pack

This file contains the exact public listing copy and privacy declarations for MaglaSync Free 1.1.0.

## Product details

**Name:** MaglaSync Free

**Category:** Productivity

**Primary language:** English

**Summary:**

> Carry project context automatically between ChatGPT, Claude, and Gemini. Free, local, and no API key.

**Detailed description:**

> MaglaSync keeps one long-running project continuous across ChatGPT, Claude, and Gemini.
>
> Start a new supported AI chat without explaining the entire project again. MaglaSync saves visible project messages locally, maintains a structured project journal, and fills an empty new chat with the latest goal, rules, decisions, verified results, blockers, and next steps. You review the prepared context and press Send yourself.
>
> Free edition features:
>
> - one local project;
> - automatic capture on supported AI chat sites;
> - automatic context loading into an empty chat;
> - structured decisions, verified results, blockers, and next steps;
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

MaglaSync provides local project continuity between supported AI chat websites by saving visible conversation state and preparing the current context in a new empty chat.

## Permission justifications

**`storage`:** stores the user's project passport, captured messages, structured state, settings, backup verification data, and integrity hashes locally in the browser profile.

**Host access to `chatgpt.com`, `claude.ai`, and `gemini.google.com`:** required to read visible user and assistant messages on supported chat pages, display MaglaSync status, and fill—but never submit—the empty chat composer.

## Remote code

MaglaSync Free executes no remote code. Runtime JavaScript and CSS are included in the extension package. The release gate rejects remote script tags, network APIs, `eval`, and Function constructors in runtime files.

## Data-use disclosure

MaglaSync handles personal communications and website content because supported chat messages may contain both. This data is stored locally for the user-requested continuity function. It is not sold, used for advertising or credit decisions, or intentionally transmitted to MaglaSync, MAGLA, or another backend. When the user reviews and sends prepared context, that selected AI provider receives it under its own terms.

Backups are user-initiated JSON downloads and are not encrypted. Users can disable capture, disable automatic loading, export a backup, restore a verified backup, delete all local data, or remove the extension.

## Reviewer notes

1. Load the unpacked extension.
2. Open its options page and create one project with a name and goal.
3. Open a supported AI site and reload the tab.
4. Confirm the MaglaSync status panel appears.
5. Open an empty new chat and confirm context is filled but not submitted.
6. Send messages manually and confirm they appear in the local project journal.
