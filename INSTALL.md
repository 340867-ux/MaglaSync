# Install MaglaSync Free

The public store listings are the intended one-click installers and automatic update channels. Until those listings are approved, the Chromium GitHub package can be loaded manually.

## Chrome, Microsoft Edge, Brave, or Opera on desktop

1. Open the [latest MaglaSync release](https://github.com/340867-ux/MaglaSync/releases/latest).
2. Download `maglasync-free-chromium-v1.1.0.zip` and extract it.
3. Open the browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
   - Opera: `opera://extensions`
4. Turn on **Developer mode**.
5. Choose **Load unpacked** and select the extracted folder that contains `manifest.json`.
6. Pin MaglaSync and open its project journal.

## Firefox desktop and Firefox for Android

The release contains `maglasync-free-firefox-v1.1.0.zip`, but it is an unsigned release candidate. Ordinary Firefox users should wait for the Mozilla Add-ons listing because Firefox requires signing for persistent installation. Android support also needs a real-device acceptance test before it is advertised as supported.

Developers can follow Mozilla's temporary-install and Android debugging instructions in the official Extension Workshop documentation. The package uses a non-persistent event page because Firefox Android does not support background service workers.

## Safari on Mac, iPhone, and iPad

The release contains `maglasync-free-safari-source-v1.1.0.zip`. It is conversion source, not a signed App Store app. Safari installation for ordinary users requires an Apple Developer/App Store Connect release, bundle identifiers, signing, real-device testing, and review.

## First use

1. Enter the project name, exact goal, and rules in the project journal.
2. Open ChatGPT, Claude, or Gemini and reload the tab.
3. MaglaSync appears in the lower-right corner.
4. In an empty chat, it fills the composer with current context. Review it and press Send.
5. Continue normally. New visible messages are saved locally when capture is enabled.

## Update

For the GitHub edition, export a backup, remove the old unpacked entry, extract the new release, and load its folder. Store editions will update automatically after approval.

## Remove

Export a backup if needed, then remove MaglaSync from the browser's extension manager. Removing the extension also removes its local extension storage.

## Troubleshooting

- If the purple panel does not appear, reload the AI chat after installing.
- If context is not filled, make sure the chat is empty and **Auto-load context** is enabled.
- If messages are not captured, enable **Capture messages** and reload the page.
- AI sites frequently change their page structure. Report a compatibility issue without pasting private conversation text.

See [PLATFORM_MATRIX.md](docs/PLATFORM_MATRIX.md) for the release status of every browser and device.
