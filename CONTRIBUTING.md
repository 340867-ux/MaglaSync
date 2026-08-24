# Contributing to MaglaSync

MaglaSync is for people who use AI chats without writing code. A contribution should improve automatic continuity, privacy, reliability, accessibility, or clarity for that audience.

Before a pull request:

1. Explain the visible user problem.
2. Use fictional text in tests and screenshots.
3. Add a dependency-free test for logic changes.
4. Run `node --test` and `node tools/package.mjs --check`.
5. Confirm no new permission, remote endpoint, analytics library, or remote code was added without explicit design review.
6. Do not include private AI conversations in issues or fixtures.

Compatibility repairs should identify the site, changed selector, observable failure, and a safe fixture.

