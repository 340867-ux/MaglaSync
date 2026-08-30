# MaglaSync CMS/LMS directory submission payloads

These payloads are for the first public 0.1.0 release of the local-only companion plugins. They are intentionally conservative: no claims of cloud sync, no automatic AI sending, no telemetry, no account requirement.

## Shared facts

- Product family: MaglaSync
- Source: https://github.com/340867-ux/MaglaSync
- License: GPL-2.0-or-later for CMS/LMS companion plugins
- Data handling: local-only; no MaglaSync backend, analytics, advertising, or AI API key
- User action: generated context is shown for review and copied only after an explicit user action
- Context marker: `MAGLASYNC_CONTEXT_V1`

## WordPress.org

**Plugin Name**: MaglaSync Context Bridge

**Preferred slug**: `maglasync-context`

**Short description**: Build a local, reviewable AI context handoff from the current WordPress post or page for ChatGPT, Claude, Gemini, or another AI assistant.

**Long description**:

MaglaSync Context Bridge adds a small editor-side panel that prepares a structured context packet from the current WordPress post or page. The editor can review the generated text and copy it into ChatGPT, Claude, Gemini, or another AI assistant.

The plugin does not connect to an AI provider and does not send content anywhere automatically. It has no MaglaSync account requirement, analytics, advertising, API key, remote assets, or MaglaSync backend dependency. The generated context remains visible to the editor before copying.

**Tags**: `ai`, `chatgpt`, `claude`, `gemini`, `productivity`

**Requires at least**: WordPress 6.0

**Tested up to**: WordPress 7.1

**Requires PHP**: 7.4

**Stable tag**: 0.1.0

**Support/source URL**: https://github.com/340867-ux/MaglaSync

**Review evidence**: WordPress Plugin Check 2.1.0 on latest WordPress: no errors found.

## Drupal.org

**Project title**: MaglaSync Context Bridge

**Preferred machine name**: `maglasync_context`

**Project type**: Module — Full project

**Core compatibility**: Drupal 10 and 11

**Short description**: Adds an AI Context tab to Drupal nodes so authorised editors can review and copy a local context packet into ChatGPT, Claude, Gemini, or another AI assistant.

**Long description**:

MaglaSync Context Bridge provides a node-local AI Context page for authorised Drupal users. It prepares a structured `MAGLASYNC_CONTEXT_V1` packet from the node title, canonical URL, content type, publication status, and body text when available.

Nothing is sent automatically. The module performs no remote MaglaSync calls, stores no MaglaSync data, uses no AI API key, and does not add analytics or advertising. Node access is enforced before the context route is exposed.

**Package/category suggestion**: Content authoring / Productivity

**Source/support URL before Drupal repository is created**: https://github.com/340867-ux/MaglaSync

**Review evidence**: Drupal Coder 9 with Drupal and DrupalPractice standards: PASS.

## Moodle Marketplace

**Plugin name**: MaglaSync Context Bridge

**Component**: `local_maglasync_context`

**Plugin type**: Local plugin

**Secondary category**: AI

**Version**: 0.1.0

**Supported Moodle versions**: Moodle 4.2 through 5.2

**Short description**: Prepare a reviewable course context packet from the current Moodle course and visible activities, then copy it into ChatGPT, Claude, Gemini, or another AI assistant.

**Long description**:

MaglaSync Context Bridge adds an AI Context link for authorised course users. It creates a structured context packet containing the course name, short name, course summary, and visible course activities. The user reviews the packet before copying it into an AI assistant.

The plugin does not call an AI provider, does not send course data automatically, and requires no MaglaSync account, analytics, advertising, AI API key, or MaglaSync backend. Its Privacy API provider declares that the plugin stores no personal data of its own. Access is protected by the `local/maglasync_context:use` course capability.

**Source/support URL**: https://github.com/340867-ux/MaglaSync

**Review evidence**: Moodle Plugin CI against `MOODLE_502_STABLE` on PHP 8.3/PostgreSQL: install PASS, PHP lint PASS, Moodle Code Checker PASS, PHPDoc Checker PASS, plugin validation PASS.

## Submission state rule

- `BUILT`: reproducible ZIP and SHA-256 exist.
- `SUBMISSION_READY`: current source has passed the platform-specific compliance gate.
- `SUBMITTED`: the official directory has accepted the form/upload and returned direct evidence.
- `PUBLISHED`: a public directory listing is visible.

Never report a plugin as submitted or published based only on local packaging, CI success, an email draft, or a prepared form payload.
