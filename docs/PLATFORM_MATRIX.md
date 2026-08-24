# Platform release matrix

MaglaSync is one product with browser-specific distribution packages. Browser stores are the normal installers and update channels for ordinary users.

| User device | Delivery | Current artifact | What still requires the publisher |
| --- | --- | --- | --- |
| Windows, macOS, Linux: Chrome, Brave, Opera | Chrome Web Store | Chromium ZIP | Google developer registration, upload, privacy form, review |
| Windows, macOS: Microsoft Edge | Microsoft Edge Add-ons | Same reviewed Chromium ZIP | Partner Center account, upload, privacy form, review |
| Windows, macOS, Linux: Firefox | Mozilla Add-ons (AMO) | Firefox ZIP | AMO signing, listing, desktop acceptance test |
| Android: Firefox | Mozilla Add-ons (AMO) | Same Firefox candidate | Real-device UX test and AMO mobile approval |
| macOS, iPhone, iPad: Safari | App Store | Safari WebExtension source ZIP | Apple identity, bundle IDs, signing, real-device test, review |
| Android: Chrome | No mobile extension channel | None | Chrome Help states extensions are computer-only |

## Why there is no `.exe` or `.dmg`

For Chrome and Edge, a standalone desktop installer would either still ask the browser to install the extension or rely on enterprise policy. It would not give ordinary users a trustworthy one-click install or automatic updates. The store button is the correct installer.

Safari is different: Apple wraps the web extension in a signed app container. That container must be built and signed under the publisher's Apple identity.

## Android scope

Chrome on Android cannot install Chrome Web Store extensions. The viable browser route is Firefox for Android. Mozilla recommends event pages rather than background service workers for Android; the Firefox package therefore uses a non-persistent event page and a bundled background script.

A future Android companion can manage encrypted projects and backups, but it cannot silently read conversations inside unrelated AI apps. Automatic capture still needs a supported browser extension or an explicit provider integration.

## Release gates

An artifact is called **supported** only after its critical path is tested on a real target:

1. create a project;
2. require explicit connection before reading visible messages;
3. preview context and place it into an empty chat only after a second user action, without submitting;
4. export, verify, restore, and delete data;
5. survive browser restart and extension update.

The repository can prepare unsigned packages automatically. Store signing and review cannot be automated without the owner's developer accounts.

Official platform references:

- Chrome mobile limitation: https://support.google.com/chrome_webstore/answer/1698338
- Edge publishing: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- Firefox Android development: https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/
- Safari web extensions: https://developer.apple.com/safari/extensions/
