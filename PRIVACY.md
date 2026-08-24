# MaglaSync Free privacy disclosure

Last updated: August 24, 2026

MaglaSync Free is a browser extension that provides continuity between supported AI chats. To perform that function, it can read visible conversation messages and write prepared context into the chat composer on:

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

## Data stored by the extension

- project name, goal, and rules;
- captured user and assistant messages;
- structured project-state updates;
- settings and integrity hashes.

The Free edition stores this data in the browser extension's local storage inside the user's browser profile. It contains no MaglaSync server endpoint, analytics client, advertising library, or AI API integration.

## Data transmission

MaglaSync Free does not intentionally transmit project data to MaglaSync, MAGLA, or another backend. The browser continues communicating with ChatGPT, Claude, or Gemini because the user is using those sites. When MaglaSync fills context and the user presses Send, the selected AI provider receives that text under the provider's own privacy terms.

## User controls

- Turn automatic context loading on or off.
- Turn message capture on or off.
- Download a complete JSON backup.
- Restore a verified backup.
- Delete every local MaglaSync record.
- Remove the extension to remove its extension storage.

## Backups

Backups contain project messages and may be sensitive. Store them carefully. MaglaSync Free backups are not encrypted.

## Browser and site metadata

Captured records contain the platform name, chat path identifier, role, time, and message text. They do not intentionally store cookies, passwords, access tokens, or browser history outside the supported chat pages.

## Changes

Material privacy changes will be documented in the repository changelog and a new extension version.
