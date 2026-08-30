# MaglaSync Organic 50K System

Goal: 50,000 installs on Chrome Web Store and 50,000 installs on Mozilla Add-ons with zero paid acquisition.

Budget rule: paid ads, paid directory placement, sponsorships, paid review acceleration, purchased traffic, incentivized installs, and purchased reviews are out of scope.

## North-star metrics

Track Chrome and Firefox separately.

1. Store visitors -> installs.
2. Installs -> first project created.
3. First project -> first connected chat.
4. Connected chat -> first successful handoff.
5. Successful handoff -> repeat use.
6. Repeat use -> voluntary share/recommendation.
7. External discovery sources -> store installs.

A channel is not considered successful because it produced a backlink. It is successful only when it produces discoverable referral traffic, store installs, durable search visibility, or qualified community adoption.

## Growth loops

### Loop A — store conversion

External discovery -> direct Chrome/Firefox install page -> store listing -> install -> first successful handoff.

Rules:
- Never send ordinary users to a ZIP when a signed store listing exists.
- Chrome and Firefox links are always visible as equal primary choices.
- Store copy leads with the user problem, not implementation details.
- Privacy proof supports conversion but does not replace the product benefit.

### Loop B — product referral

Install -> useful handoff -> user clicks Share MaglaSync -> install landing -> recipient chooses Chrome or Firefox -> new install.

Rules:
- Sharing is voluntary and user-triggered.
- No address-book access, auto-posting, dark patterns, install rewards, review rewards, or referral spam.
- No additional extension permissions are added for growth.

### Loop C — search

High-intent search query -> useful MaglaSync page -> direct store install -> installation.

Priority query families:
- ChatGPT memory extension
- Claude memory extension
- Gemini memory extension
- transfer context between ChatGPT and Claude
- continue AI chat in another model
- local AI memory browser extension
- private AI memory extension
- move project context between AI chats

Each search page must answer a real question and avoid doorway-page duplication.

### Loop D — community proof

Open-source release / useful technical write-up / real user problem -> community discussion -> GitHub/site -> store -> install -> feedback -> stronger release -> next discussion.

Priority communities:
- Hacker News / Show HN
- Product Hunt
- relevant Reddit communities when their self-promotion rules permit it
- browser-extension communities
- open-source and privacy communities
- AI workflow communities

No mass-posting of identical copy across communities.

### Loop E — directory compounding

Free legitimate directory submission -> permanent listing/backlink -> search discovery + direct traffic -> store install.

Prioritize directories that are free without forced payment. Badge/backlink exchanges are optional and must not be added to the main landing page unless they materially help users.

### Loop F — release cadence

Compatibility fix / useful feature / measurable UX improvement -> release notes -> store update -> renewed store freshness -> community update -> new installs.

Release cadence is driven by real product value, not version-number spam.

## Execution gates

### Gate 0 — activation integrity

Must pass before scaling traffic:
- popup opens without JavaScript initialization failure;
- project creation works;
- ChatGPT, Claude, and Gemini connection paths work;
- handoff preview works;
- backup/restore remains valid;
- no new permissions or telemetry are introduced by growth work.

### Gate 1 — signed-store path

- Chrome listing live and linked directly.
- Firefox listing live and linked directly.
- install landing exists in EN and RU.
- sitemap contains both install pages.

### Gate 2 — first 100 genuine users per store

Focus: activation defects, reviews from real users, support issues, store conversion, first external mentions.

Do not broaden aggressively until obvious first-use defects are fixed.

### Gate 3 — 1,000 per store

Focus: repeatable organic channels. Drop channels that produce backlinks but no discovery. Double down on sources that produce real users.

### Gate 4 — 10,000 per store

Focus: localization, comparison/education pages, stronger community proof, recurring releases, creator/tutorial coverage.

### Gate 5 — 50,000 per store

Focus: compounding search + referral + community + store ranking. Preserve product trust; do not trade privacy or store-policy compliance for acquisition.

## Weekly operating cycle

1. Read Chrome and Firefox public listing state.
2. Record installs/users, ratings/reviews, version, and last update where public.
3. Search for new MaglaSync mentions and backlinks.
4. Read incoming Gmail responses to directory/editorial submissions.
5. Fix activation/conversion defects before adding traffic.
6. Submit to the next small batch of legitimate free channels.
7. Publish one useful, non-duplicative piece of content or release proof when there is something real to say.
8. Record channel outcomes in `growth/channel_queue.csv`.
9. Stop or change channels that repeatedly produce no discovery.

## Store positioning

Primary promise:

**Keep one project continuous across ChatGPT, Claude, and Gemini — without re-explaining everything.**

Supporting proof:
- free and open source;
- local project journal;
- no MaglaSync account;
- no AI API key;
- explicit per-chat connection;
- review before placement;
- no analytics/backend in Free.

Technical details such as SHA-256 integrity checks belong below the primary benefit, not above it.

## Prohibited growth tactics

- fake users or bot installs;
- purchased installs;
- review farms;
- incentivized positive reviews;
- misleading claims;
- hidden auto-sharing;
- unsolicited bulk email;
- fake community accounts;
- copy-paste spam across forums;
- installing unrelated permissions for attribution;
- collecting private conversation data for marketing analytics.

The 50K target must be reached with genuine users.
