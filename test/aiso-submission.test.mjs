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
  assert.equal(payload.categoryValue, 'productivity');
  assert.equal(payload.pricing, 'Free');
  assert.equal(payload.pricingValue, 'free');
  assert.equal(payload.url, 'https://sync.magla.ru/en/');
});

test('AISO retry is bound to the proven no-click preflight stop', () => {
  assert.equal(payload.attempt, 2);
  assert.equal(payload.previous_attempt_status, 'BLOCKED_PREFLIGHT_NO_CLICK');
  assert.match(submitter, /More than one pre-submit retry is not authorized/);
  assert.match(submitter, /Retry is allowed only after a proven preflight block with no Submit click/);
});

test('AISO submitter binds stable free category and pricing values', () => {
  assert.match(submitter, /selectOption\(payload\.categoryValue\)/);
  assert.match(submitter, /selectOption\(payload\.pricingValue\)/);
  assert.match(submitter, /selectedCategoryValue/);
  assert.match(submitter, /selectedPricingValue/);
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
