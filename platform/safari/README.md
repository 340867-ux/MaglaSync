# Safari release source

This archive is the reviewed MaglaSync WebExtension source prepared for Apple's Safari Web Extension conversion and App Store submission.

It is not a signed `.app` or `.ipa`. Apple requires the publisher's Apple Developer/App Store Connect identity, bundle identifiers, signing, and review before ordinary users can install it on macOS, iPhone, or iPad.

## Release route

1. Sign in to the publisher's Apple Developer and App Store Connect accounts.
2. Convert this WebExtension with Xcode's Safari Web Extension Converter or Apple's Safari Web Extension Packager.
3. Use the product name `MaglaSync Free` and the publisher-controlled bundle identifier.
4. Enable macOS, iOS, and iPadOS targets.
5. Test capture, context loading, backup, restore, and deletion on real Safari devices.
6. Submit the signed build and the privacy disclosure from `PRIVACY.md` to App Store Connect.

Official references:

- https://developer.apple.com/safari/extensions/
- https://developer.apple.com/documentation/safariservices/creating-a-safari-web-extension
- https://developer.apple.com/documentation/safariservices/packaging-and-distributing-safari-web-extensions-with-app-store-connect

MaglaSync never needs a separate native journal app to perform browser capture. The small native container exists because Safari distributes web extensions through Apple's app system.
