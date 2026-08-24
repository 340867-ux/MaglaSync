# Install MaglaSync Free

The public store listings are the intended one-click installers and automatic update channels. Until those listings are approved, the Chromium GitHub package can be loaded manually.

## Chrome, Microsoft Edge, Brave, or Opera on desktop

1. [Download `maglasync-free-chromium-v1.2.0.zip`](https://sync.magla.ru/downloads/maglasync-free-chromium-v1.2.0.zip).
2. Extract the downloaded ZIP.
3. Open the browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the extracted folder that contains `manifest.json`.
6. Pin MaglaSync and open its project journal.

## Firefox desktop and Firefox for Android

The [Firefox 1.2.0 package](https://sync.magla.ru/downloads/maglasync-free-firefox-v1.2.0.zip) is an unsigned release candidate. Ordinary Firefox users should wait for the Mozilla Add-ons listing because Firefox requires signing for persistent installation. Android support also needs a real-device acceptance test before it is advertised as supported.

Developers can follow Mozilla's temporary-install and Android debugging instructions in the official Extension Workshop documentation. The package uses a non-persistent event page because Firefox Android does not support background service workers.

## Safari on Mac, iPhone, and iPad

The [Safari 1.2.0 source package](https://sync.magla.ru/downloads/maglasync-free-safari-source-v1.2.0.zip) is conversion source, not a signed App Store app. Safari installation for ordinary users requires an Apple Developer/App Store Connect release, bundle identifiers, signing, real-device testing, and review.

## First use

1. Enter the project name, exact goal, and rules in the project journal.
2. Open ChatGPT, Claude, or Gemini and reload the tab.
3. MaglaSync appears in the lower-right corner.
4. Click **Connect chat**. Until that click, MaglaSync does not read the conversation.
5. Choose **Review context**, edit the handoff if needed, and choose **Place in chat**.
6. Read it once more and press Send yourself. Only the connected chat can now update the local journal.

## Update

For the GitHub edition, export a backup, remove the old unpacked entry, extract the new release, and load its folder. Store editions will update automatically after approval.

## Remove

Export a backup if needed, then remove MaglaSync from the browser's extension manager. Removing the extension also removes its local extension storage.

## Troubleshooting

- If the purple panel does not appear, reload the AI chat after installing.
- If context is not placed, make sure the message box is empty and the chat is connected.
- If messages are not saved, enable **Save connected chats** and reconnect the chat if the project goal changed.
- AI sites frequently change their page structure. Report a compatibility issue without pasting private conversation text.

See [PLATFORM_MATRIX.md](docs/PLATFORM_MATRIX.md) for the release status of every browser and device.
