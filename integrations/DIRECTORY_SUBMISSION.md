# Official directory submission checklist

## WordPress.org Plugin Directory

Package: `maglasync-context-wordpress-0.1.0.zip`

- Slug target: `maglasync-context`
- License: GPL-2.0-or-later
- Tested up to: WordPress 7.1
- Requires PHP: 7.4
- No telemetry, external assets, account, API key or backend
- Main user value: editor-side reviewable AI context packet from the current post/page
- Before submission: runtime test on WordPress 7.1 and run Plugin Check if available

## Drupal.org contributed module

Package: `maglasync-context-drupal-0.1.0.zip`

- Machine name target: `maglasync_context`
- Core: Drupal 10 / 11
- License: GPL-2.0-or-later ecosystem requirement
- Access control: node view access is required before context page is exposed
- No remote calls or stored MaglaSync data
- Main user value: node-local AI context tab for editors/site builders
- Before submission: runtime test on Drupal 11.4.x and 10.6.x; run Drupal coding standards / PHP_CodeSniffer

## Moodle plugins directory

Package: `maglasync-context-moodle-0.1.0.zip`

- Component: `local_maglasync_context`
- Installation path: `local/maglasync_context`
- Minimum declared core: Moodle 4.2; target runtime validation also includes current Moodle 5.2
- Capability: `local/maglasync_context:use`
- Privacy API: null provider declares that the plugin stores no personal data of its own
- No remote calls or stored MaglaSync data
- Main user value: course context packet with course summary and visible activities
- Before submission: runtime test on Moodle 5.2 and run Moodle Plugin CI / coding style checks

## Shared release rule

A package is **built** when CI produces the ZIP and SHA-256. It is **submitted** only after the official directory receives it. It is **published** only after the directory exposes a public listing. Never conflate these states in growth reporting.
