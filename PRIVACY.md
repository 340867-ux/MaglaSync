# MaglaSync Free privacy disclosure

Last updated: August 24, 2026

MaglaSync Free is a local browser extension for continuing one project between supported AI chats. Its panel is available on:

- `https://chatgpt.com/*`
- `https://claude.ai/*`
- `https://gemini.google.com/*`

## A chat is private until you connect it

MaglaSync does not collect message text from a conversation merely because you opened it. You must click **Connect chat** for that specific conversation first.

After connection, MaglaSync may read visible user and assistant messages in that chat so it can keep project continuity. A background check rejects records whose exact chat identity was not connected to the current project. Changing the project goal also pauses older connections until you reconnect them.

Disconnecting a chat removes its MaglaSync connection and the records that MaglaSync stored locally for that chat.

## Data stored by the extension

- project name, goal, goal version, and rules;
- identifiers for chats you explicitly connected;
- up to 24 recent connected-chat messages by default;
- up to 400 connected-chat messages only if you enable **Keep extended history**;
- structured project-state updates reported by the AI;
- settings and integrity hashes.

AI-reported project updates are not independent proof that an event happened. Review important claims and keep real evidence separately.

The Free edition stores this data in the extension's local storage inside your browser profile. It contains no MaglaSync server endpoint, analytics client, advertising library, or AI API integration.

## Context and sending

MaglaSync never loads context into a chat automatically. You choose **Review context**, can edit the complete handoff, and then choose **Place in chat**. MaglaSync still does not press **Send**.

Only when you press **Send** does the selected AI provider receive that text under its own privacy terms.

## User controls

- Connect only the individual project chats you choose.
- Disconnect a chat and remove its locally saved MaglaSync records.
- Turn saving for connected chats on or off.
- Keep only the default short recent buffer or explicitly enable extended history up to 400 messages.
- Review and edit context before placing it in the chat box.
- Download a complete JSON backup.
- Restore a verified backup.
- Delete every local MaglaSync record.
- Remove the extension to remove its extension storage.

## Updates from version 1.1 or earlier

The privacy-first migration keeps the project passport but disconnects every previous chat and removes conversation records captured by the earlier automatic mode. Each chat must be connected again by the user.

## Backups

Backups may contain project messages and can be sensitive. Store them carefully. MaglaSync Free backups are not encrypted.

## Browser and site metadata

Connected-chat records contain the platform name, chat path identifier, role, time, and message text. They do not intentionally store cookies, passwords, access tokens, or browser history outside the supported chat pages.

## Changes

Material privacy changes will be documented in the repository changelog and a new extension version.
