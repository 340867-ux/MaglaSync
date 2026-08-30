import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-listai.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-listai.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/listai-v1.json', 'utf8'));

test('ListAI submission is a single scoped free-listing trigger', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/listai-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.submission_id, 'listai-maglasync-free-2026-08-30-v1');
  assert.equal(payload.category, 'Productivity');
  assert.equal(payload.url, 'https://sync.magla.ru/en/');
});

test('ListAI submitter requires the permanent free no-account route', () => {
  assert.match(submitter, /Free listing\\s\*\[—-\]\\s\*no account needed/);
  assert.match(submitter, /Free\\s\*Forever/);
  assert.match(submitter, /No account required/);
  assert.match(submitter, /Submit Tool for Free/);
  assert.match(submitter, /CAPTCHA detected; automated submission is forbidden/);
  assert.match(submitter, /Required payment detected/);
});

test('ListAI submitter proves clickability before the real submit and requires success evidence', () => {
  assert.match(submitter, /click\(\{ trial: true/);
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
});
