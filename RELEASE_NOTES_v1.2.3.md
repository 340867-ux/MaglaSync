# MaglaSync Free 1.2.3

This release adds a small earned-feedback loop without changing MaglaSync's privacy boundary.

## What changed

- After at least three saved updates in the active project, the popup can show **Leave an honest review**.
- The action remains hidden if the local journal integrity check reports an error.
- Nothing opens automatically. The user must click the action.
- Chrome users are taken to the signed Chrome Web Store listing; Firefox users are taken to the signed Mozilla Add-ons listing.
- The existing explicit **Share MaglaSync** action remains user-triggered.

## What did not change

- No analytics or telemetry was added.
- No new browser permission was added.
- No account, AI API key, contact access, advertising code, or backend was added.
- There is no reward or feature unlock for leaving a rating or review.
- MaglaSync still reads only chats the user explicitly connects and never presses Send.

The goal is simple: ask for genuine feedback only after the extension has actually been used, while leaving the user fully in control.
