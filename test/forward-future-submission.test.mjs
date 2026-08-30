import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-forward-future.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-forward-future.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/forward-future-v1.json', 'utf8'));

test('Forward Future submission is a single scoped free-listing trigger', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/forward-future-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.submission_id, 'forward-future-maglasync-free-2026-08-30-v1');
  assert.equal(payload.pricing, 'Free');
  assert.equal(payload.websiteUrl, 'https://sync.magla.ru/en/');
});

test('Forward Future submitter fails closed on route changes and requires confirmation', () => {
  assert.match(submitter, /https:\/\/forwardfuture\.com\/tools\/submit/);
  assert.match(submitter, /No account needed/);
  assert.match(submitter, /Every submission reviewed/);
  assert.match(submitter, /CAPTCHA detected; automated submission is forbidden/);
  assert.match(submitter, /Login requirement detected/);
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
});
