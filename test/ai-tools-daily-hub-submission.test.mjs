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

test('AI Tools Daily Hub submitter binds only the $0 no-card form state', () => {
  assert.match(submitter, /Free\\s\*\\\$0/);
  assert.match(submitter, /No credit card required/);
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
