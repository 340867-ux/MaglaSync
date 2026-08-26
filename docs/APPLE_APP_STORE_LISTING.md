# Safari / App Store submission pack

Start with `maglasync-free-safari-source-v1.2.1.zip`. Upload it to Apple's Safari Web Extension Packager in App Store Connect under the publisher's Apple Developer identity. Apple now supports this conversion route from a web browser, without requiring a Mac or Xcode. Xcode's converter remains available as the advanced alternative.

## Listing

**App name:** MaglaSync Free

**Subtitle:** Project memory for AI chats

**Promotional text:**

> Continue the same project across ChatGPT, Claude, and Gemini without explaining everything again.

**Description:**

> MaglaSync Free keeps one project continuous across supported AI chat websites. Every chat starts disconnected. After you explicitly connect a project chat, it keeps a short recent buffer in Safari extension storage and prepares an up-to-date context for review. The context includes the project goal, rules, decisions, reported results, blockers, and next steps.
>
> MaglaSync never presses Send. You review the prepared text and submit it yourself.
>
> Free has no MaglaSync account, API key, analytics, advertising, or MaglaSync backend. You can disconnect chats and remove their records, export a backup, restore it, disable connected-chat saving, or delete all local data.

**Support URL:** `https://github.com/340867-ux/MaglaSync/issues`

**Marketing URL:** `https://sync.magla.ru/en/`

**Privacy URL:** `https://github.com/340867-ux/MaglaSync/blob/main/PRIVACY.md`

## Release requirements

- Active Apple Developer/App Store Connect identity and a publisher-controlled bundle identifier.
- macOS, iPhone, and iPad targets where supported by the selected packaging route.
- TestFlight and real-device tests for all critical paths.
- App privacy answers consistent with `PRIVACY.md`.
- Apple review approval.

Do not publish the source ZIP as if it were an installable Apple app.
