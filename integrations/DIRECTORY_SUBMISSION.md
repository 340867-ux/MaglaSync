# Official directory submission checklist

## WordPress.org Plugin Directory

Package: `maglasync-context-wordpress-0.1.0.zip`

- Account already exists: `andreivf`.
- Official submission route: `https://wordpress.org/plugins/developers/add/`.
- Slug target: `maglasync-context`.
- License: GPL-2.0-or-later.
- Tested up to: WordPress 7.1.
- Requires PHP: 7.4.
- No telemetry, external assets, account, API key or backend.
- Main user value: editor-side reviewable AI context packet from the current
  post/page.
- Automated status: WordPress Plugin Check passes on the current plugin code.
- Before submission: complete a runtime install/edit/copy smoke test on
  WordPress 7.1, then upload the complete ZIP through the official form.
- Review state must remain `not submitted` until the form returns a submission
  acknowledgement or WordPress sends its confirmation email.

## Drupal.org contributed module

Package: `maglasync-context-drupal-0.1.0.zip`

- Account already exists: `andrei_vf`.
- Official project route: `https://www.drupal.org/project/add` and choose a
  **Full module project** when that option is available.
- Machine name target: `maglasync_context`.
- Core: Drupal 10 / 11.
- License: GPL-2.0-or-later ecosystem requirement.
- Access control: node view access is required before the context page is
  exposed.
- No remote calls or stored MaglaSync data.
- Main user value: node-local AI context tab for editors/site builders.
- Automated status: Drupal Coder runs both Drupal and DrupalPractice standards.
- Before project creation/release: runtime smoke test on Drupal 11.4.x and
  10.6.x, then create the Drupal.org project and push the module to the project
  repository according to the generated Version control instructions.
- Project/release state must remain `not submitted` until Drupal.org creates the
  project page.

## Moodle Marketplace

Package: `maglasync-context-moodle-0.1.0.zip`

- Moodle.org account already exists and is verified.
- Moodle Marketplace replaced the old Plugins Directory in July 2026.
- Marketplace: `https://marketplace.moodle.com/`.
- Component: `local_maglasync_context`.
- Installation path: `local/maglasync_context`.
- Minimum declared core: Moodle 4.2; current validation target is Moodle 5.2.
- Capability: `local/maglasync_context:use`.
- Privacy API: null provider declares that the plugin stores no personal data
  of its own.
- No remote calls or stored MaglaSync data.
- Main user value: course context packet with course summary and visible
  activities.
- Automated status: Moodle Plugin CI installs a MOODLE_502_STABLE environment
  and runs PHP lint, Moodle CodeSniffer, PHPDoc and plugin validation.
- Before Marketplace submission: finish a Moodle 5.2 runtime smoke test and
  submit through the Marketplace provider/support flow exposed by the official
  Marketplace site.
- Marketplace state must remain `not submitted` until Moodle returns a provider
  submission acknowledgement.

## Shared release rule

A package is **built** when CI produces the ZIP and SHA-256. It is **validated**
only when the applicable directory compliance checks pass. It is **submitted**
only after the official directory/marketplace receives it. It is **published**
only after the platform exposes a public listing. Never conflate these states
in growth reporting.
