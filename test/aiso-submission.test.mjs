import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-aiso.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-aiso.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/aiso-v1.json', 'utf8'));

test('AISO submission is one-shot and free-only', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/aiso-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.category, 'Productivity');
  assert.equal(payload.pricing, 'Free');
  assert.equal(payload.url, 'https://sync.magla.ru/en/');
});

test('AISO submitter binds only the free no-card route', () => {
  assert.match(submitter, /listing is free/);
  assert.match(submitter, /No card required/);
  assert.match(submitter, /Submit Tool\\s\*\[—-\]\\s\*Free/);
  assert.match(submitter, /Free\\s\*\\\$0/);
  assert.match(submitter, /Payment fields appeared after choosing Free/);
  assert.match(submitter, /input\[name="website"\]/);
  assert.match(submitter, /click\(\{ trial: true/);
});

test('AISO submission requires direct success evidence', () => {
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
});
