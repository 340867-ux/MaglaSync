import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/submit-ai-valley.yml', 'utf8');
const submitter = fs.readFileSync('tools/submit-ai-valley.mjs', 'utf8');
const payload = JSON.parse(fs.readFileSync('growth/submissions/ai-valley-v1.json', 'utf8'));

test('AI Valley submission is one-shot and scoped to main', () => {
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.match(workflow, /growth\/submissions\/ai-valley-v1\.json/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /pull_request:/);
  assert.equal(payload.submission_id, 'ai-valley-maglasync-free-2026-08-30-v1');
  assert.equal(payload.toolUrl, 'https://sync.magla.ru/en/');
});

test('AI Valley submitter blocks login captcha and payment routes', () => {
  assert.match(submitter, /Submit any Tools Here/);
  assert.match(submitter, /CAPTCHA detected; automated submission is forbidden/);
  assert.match(submitter, /Login requirement detected/);
  assert.match(submitter, /Payment requirement detected/);
  assert.match(submitter, /click\(\{ trial: true/);
});

test('AI Valley submission requires direct Contact Form 7 or page success evidence', () => {
  assert.match(submitter, /mail_sent/);
  assert.match(submitter, /SUBMITTED_CONFIRMED/);
  assert.match(submitter, /ATTEMPTED_UNCONFIRMED/);
  assert.match(submitter, /confirmationEvidence/);
});
