import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-inforelay.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-inforelay.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/inforelay-v1.json', 'utf8'));

test('InfoRelay submission is a single scoped free-listing trigger', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/inforelay-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.submission_id, 'inforelay-maglasync-free-2026-08-30-v1');
  assert.equal(payload.category, 'productivity');
  assert.equal(payload.pricing, 'free');
  assert.equal(payload.url, 'https://sync.magla.ru/en/');
  assert.ok(payload.tagline.length > 0 && payload.tagline.length <= 70);
  assert.equal(Object.hasOwn(payload, 'submitterEmail'), false);
});

test('InfoRelay workflow refuses reruns and later payload edits', () => {
  assert.match(workflow, /fetch-depth:\s*2/);
  assert.match(workflow, /GITHUB_RUN_ATTEMPT/);
  assert.match(workflow, /may not be re-run/);
  assert.match(workflow, /git diff-tree/);
  assert.match(workflow, /Expected a first-time payload add/);
});

test('InfoRelay submitter requires the exact free no-login/no-captcha route', () => {
  assert.match(submitter, /Submit your tool for a free listing/);
  assert.match(submitter, /no spam, no pay-to-play ranking/);
  assert.match(submitter, /\/api\/submit-tool/);
  assert.match(submitter, /CAPTCHA detected; automated submission is forbidden/);
  assert.match(submitter, /Login requirement detected/);
  assert.match(submitter, /Required payment detected/);
  assert.match(submitter, /Honeypot field must remain empty/);
});

test('InfoRelay submitter proves clickability and requires direct success evidence', () => {
  assert.match(submitter, /click\(\{ trial: true/);
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
  assert.match(submitter, /response_json/);
});
