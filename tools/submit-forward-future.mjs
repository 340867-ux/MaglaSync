import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://forwardfuture.com/tools/submit';
const PAYLOAD_PATH = 'growth/submissions/forward-future-v1.json';
const REPORT_DIR = 'reports/growth/forward-future-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');
const BEFORE_PATH = path.join(REPORT_DIR, 'before-submit.png');
const AFTER_PATH = path.join(REPORT_DIR, 'after-submit.png');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  submissionId: payload.submission_id,
  attempt: payload.attempt ?? 1,
  status: 'NOT_ATTEMPTED',
  clickedSubmit: false,
  submitted: false,
  preflight: {},
  submissionResponses: [],
  finalUrl: null,
  confirmationEvidence: null,
};

function writeReport() {
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

function fail(status, message) {
  report.status = status;
  report.error = message;
  writeReport();
  throw new Error(message);
}

if (payload.submission_id !== 'forward-future-maglasync-free-2026-08-30-v1') {
  fail('BLOCKED_PAYLOAD', `Unexpected submission_id: ${payload.submission_id}`);
}
if (payload.pricing !== 'Free') fail('BLOCKED_PAYLOAD', 'Only the Free listing is authorized.');
if (payload.websiteUrl !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
if ((payload.attempt ?? 1) > 2) fail('BLOCKED_PAYLOAD', 'More than one pre-submit retry is not authorized.');
if ((payload.attempt ?? 1) === 2 && payload.previous_attempt_status !== 'BLOCKED_PREFLIGHT_NO_CLICK') {
  fail('BLOCKED_PAYLOAD', 'Retry is allowed only after a proven preflight block with no Submit click.');
}

const browser = await chromium.launch({ headless: true });
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.on('response', async response => {
    const method = response.request().method();
    if (method === 'GET') return;
    const item = {
      method,
      url: response.url(),
      status: response.status(),
      body: null,
    };
    try {
      item.body = (await response.text()).slice(0, 2000);
    } catch {}
    report.submissionResponses.push(item);
  });

  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 });
  report.preflight.httpStatus = response?.status() ?? null;
  if (!response || response.status() >= 400) {
    fail('BLOCKED_PREFLIGHT', `Forward Future returned HTTP ${response?.status() ?? 'unknown'}.`);
  }

  await page.waitForTimeout(2500);
  const bodyBefore = await page.locator('body').innerText();
  const framesBefore = page.frames().map(frame => frame.url());

  const freeEvidence = /\bFree\b/i.test(bodyBefore);
  const noAccountEvidence = /No account needed/i.test(bodyBefore);
  const reviewEvidence = /Every submission reviewed/i.test(bodyBefore);
  const captchaEvidence = /captcha|recaptcha|hcaptcha|turnstile/i.test(bodyBefore) || framesBefore.some(url => /recaptcha|hcaptcha|turnstile/i.test(url));
  const loginEvidence = /login required|log in to submit|sign in to submit|continue with google|continue with github/i.test(bodyBefore);

  Object.assign(report.preflight, {
    freeEvidence,
    noAccountEvidence,
    reviewEvidence,
    captchaEvidence,
    loginEvidence,
    frames: framesBefore,
  });

  if (!freeEvidence || !noAccountEvidence || !reviewEvidence) {
    fail('BLOCKED_PREFLIGHT', 'The public page no longer exposes the expected free/no-account/editorial-review route.');
  }
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; this one-time public route is no longer valid.');

  const form = page.locator('form:has(#name):has(#websiteUrl):has(#description):has(#features):has(#useCases):has(#pricing):has(#industry):has(#profession)');
  if (await form.count() !== 1) {
    fail('BLOCKED_PREFLIGHT', `Expected exactly one product form; found ${await form.count()}.`);
  }

  await form.locator('#name').fill(payload.name);
  await form.locator('#websiteUrl').fill(payload.websiteUrl);
  await form.locator('#description').fill(payload.description);
  await form.locator('#features').fill(payload.features);
  await form.locator('#useCases').fill(payload.useCases);
  await form.locator('#pricing').selectOption(payload.pricing);
  await form.locator('#industry').selectOption(payload.industry);
  await form.locator('#profession').selectOption(payload.profession);

  const selectedTaxonomy = {
    pricing: await form.locator('#pricing').inputValue(),
    industry: await form.locator('#industry').inputValue(),
    profession: await form.locator('#profession').inputValue(),
  };
  report.preflight.selectedTaxonomy = selectedTaxonomy;
  if (selectedTaxonomy.pricing !== payload.pricing || selectedTaxonomy.industry !== payload.industry || selectedTaxonomy.profession !== payload.profession) {
    fail('BLOCKED_PREFLIGHT', `Selected taxonomy does not match payload: ${JSON.stringify(selectedTaxonomy)}`);
  }

  const tagInput = form.locator('input#tags:visible');
  if (await tagInput.count()) {
    for (const tag of payload.tags ?? []) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
      await page.waitForTimeout(80);
    }
  }

  const requiredEmpty = await form.locator('input[required],textarea[required],select[required]').evaluateAll(elements => elements
    .filter(el => !String(el.value ?? '').trim())
    .map(el => el.id || el.getAttribute('name') || el.tagName));
  if (requiredEmpty.length) {
    fail('BLOCKED_PREFLIGHT', `Required fields are still empty: ${requiredEmpty.join(', ')}`);
  }

  await page.screenshot({ path: BEFORE_PATH, fullPage: true });

  const button = form.getByRole('button', { name: /Submit for review/i });
  if (await button.count() !== 1 || !(await button.isEnabled())) {
    fail('BLOCKED_PREFLIGHT', 'Submit for review button is missing or disabled.');
  }

  report.clickedSubmit = true;
  await button.click();
  await page.waitForTimeout(6000);

  const finalUrl = page.url();
  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  report.finalUrl = finalUrl;
  await page.screenshot({ path: AFTER_PATH, fullPage: true }).catch(() => {});

  const urlSuccess = /thank|success|submitted/i.test(new URL(finalUrl).pathname);
  const newBody = bodyAfter === bodyBefore ? '' : bodyAfter;
  const textMatch = newBody.match(/thank you[^\n]*|thanks for submitting[^\n]*|submission (?:has been )?received[^\n]*|submitted successfully[^\n]*|we(?:'|’)ll review[^\n]*|we will review[^\n]*|pending review[^\n]*/i);
  const responseMatch = report.submissionResponses.find(item =>
    item.status >= 200 && item.status < 300 &&
    /success["'\s:]*true|submitted|submission.{0,80}(received|created|success)|thank you/i.test(item.body || '')
  );

  if (urlSuccess) report.confirmationEvidence = { type: 'url', value: finalUrl };
  else if (textMatch) report.confirmationEvidence = { type: 'page_text', value: textMatch[0].slice(0, 500) };
  else if (responseMatch) report.confirmationEvidence = { type: 'response', value: responseMatch };

  if (!report.confirmationEvidence) {
    fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but the site returned no direct success evidence; do not count this as submitted.');
  }

  report.status = 'SUBMITTED_CONFIRMED';
  report.submitted = true;
  writeReport();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (!report.error) {
    report.status = report.clickedSubmit ? 'ATTEMPTED_UNCONFIRMED' : 'BLOCKED_PREFLIGHT';
    report.error = String(error?.message || error);
    writeReport();
  }
  throw error;
} finally {
  await browser.close();
}
