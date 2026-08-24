# MaglaSync Free 1.0.0

**One project. Every supported AI chat remembers.**

MaglaSync Free is a local browser extension for people who use ChatGPT, Claude, or Gemini but do not want to explain the same long-running project again in every new conversation.

## Included

- Automatic capture of supported chat messages.
- Automatic loading of the current project context into an empty new chat.
- User review before Send.
- Structured decisions, verified results, blockers, next steps, and constraints.
- One local project.
- Backup, verified restore, and delete controls.
- No account, API key, backend, telemetry, or payment.

## Install

Download `maglasync-free-v1.0.0.zip`, extract it, open `chrome://extensions`, enable Developer mode, select **Load unpacked**, and choose the extracted folder.

See [INSTALL.md](https://github.com/340867-ux/maglasync/blob/main/INSTALL.md) for full instructions.

## Verification

Core tests and package checks run in GitHub Actions. The package contains Manifest V3 local code only and declares one extension permission: `storage`.

## Current scope

Chrome and Edge 114+. ChatGPT, Claude, and Gemini. AI websites may change their page structure; compatibility reports are welcome, but never include a private conversation in a public issue.

