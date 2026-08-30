import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = {
  wordpress: [
    'integrations/wordpress/maglasync-context/maglasync-context.php',
    'integrations/wordpress/maglasync-context/assets/admin.js',
    'integrations/wordpress/maglasync-context/readme.txt',
  ],
  drupal: [
    'integrations/drupal/maglasync_context/maglasync_context.info.yml',
    'integrations/drupal/maglasync_context/maglasync_context.routing.yml',
    'integrations/drupal/maglasync_context/src/Controller/MaglaSyncContextController.php',
    'integrations/drupal/maglasync_context/js/maglasync-context.js',
  ],
  moodle: [
    'integrations/moodle/local/maglasync_context/version.php',
    'integrations/moodle/local/maglasync_context/db/access.php',
    'integrations/moodle/local/maglasync_context/index.php',
    'integrations/moodle/local/maglasync_context/classes/privacy/provider.php',
    'integrations/moodle/local/maglasync_context/context.js',
  ],
};

async function text(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('all three context bridges exist and use the same explicit transport marker', async () => {
  for (const [platform, paths] of Object.entries(files)) {
    for (const path of paths) {
      const source = await text(path);
      assert.ok(source.length > 0, `${platform}: ${path} must not be empty`);
    }
  }

  const wp = await text(files.wordpress[0]);
  const drupal = await text(files.drupal[2]);
  const moodle = await text(files.moodle[2]);
  for (const [platform, source] of [['wordpress', wp], ['drupal', drupal], ['moodle', moodle]]) {
    assert.match(source, /MAGLASYNC_CONTEXT_V1/, `${platform} transport marker missing`);
    assert.match(source, /INSTRUCTION=/, `${platform} review instruction missing`);
  }
});

test('server-side bridge code contains no outbound networking client', async () => {
  const serverFiles = [files.wordpress[0], files.drupal[2], files.moodle[2]];
  const forbidden = [
    /wp_remote_(get|post|request)\s*\(/i,
    /curl_(init|exec)\s*\(/i,
    /file_get_contents\s*\(\s*['"]https?:/i,
    /GuzzleHttp/i,
    /http_client/i,
  ];

  for (const path of serverFiles) {
    const source = await text(path);
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path} must remain local-only`);
    }
  }
});

test('platform access/privacy guards remain present', async () => {
  const wp = await text(files.wordpress[0]);
  assert.match(wp, /current_user_can\('edit_post'/);
  assert.match(wp, /GPL-2\.0-or-later/);

  const drupalRoute = await text(files.drupal[1]);
  assert.match(drupalRoute, /_entity_access: 'node\.view'/);

  const moodleAccess = await text(files.moodle[1]);
  assert.match(moodleAccess, /local\/maglasync_context:use/);
  const moodlePrivacy = await text(files.moodle[3]);
  assert.match(moodlePrivacy, /implements null_provider/);
});

test('WordPress directory metadata tracks current supported release family', async () => {
  const readme = await text(files.wordpress[2]);
  assert.match(readme, /Tested up to: 7\.1/);
  assert.match(readme, /License: GPL-2\.0-or-later/);
});
