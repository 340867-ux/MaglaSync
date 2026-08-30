import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-ai-tools-daily-hub.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-ai-tools-daily-hub.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/ai-tools-daily-hub-v1.json', 'utf8'));

test('AI Tools Daily Hub submission is one-shot and free-only', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/ai-tools-daily-hub-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.category, 'productivity');
  assert.equal(payload.pricingType, 'free');
  assert.equal(payload.hasFreePlan, true);
});

test('AI Tools Daily Hub retry is bound to the proven no-click preflight stop', () => {
  assert.equal(payload.attempt, 2);
  assert.equal(payload.previous_attempt_status, 'BLOCKED_PREFLIGHT_NO_CLICK');
  assert.match(submitter, /More than one pre-submit retry is not authorized/);
  assert.match(submitter, /Retry is allowed only after a proven preflight block with no Submit click/);
});

test('AI Tools Daily Hub submitter binds durable free-route evidence and free form state', () => {
  assert.match(submitter, /Is the free listing really free/);
  assert.match(submitter, /completely free/);
  assert.match(submitter, /No credit card required/);
  assert.match(submitter, /Submit Tool for Review/);
  assert.match(submitter, /selectOption\(\{ label: 'Productivity' \}\)/);
  assert.match(submitter, /selectOption\(\{ label: 'Free' \}\)/);
  assert.match(submitter, /Payment fields unexpectedly appeared/);
  assert.match(submitter, /click\(\{ trial: true/);
});

test('AI Tools Daily Hub requires direct submission confirmation', () => {
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
});
