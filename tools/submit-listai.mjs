import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://listai.cc/submit';
const PAYLOAD_PATH = 'growth/submissions/listai-v1.json';
const REPORT_DIR = 'reports/growth/listai-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');
const BEFORE_PATH = path.join(REPORT_DIR, 'before-submit.png');
const AFTER_PATH = path.join(REPORT_DIR, 'after-submit.png');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
const contactEmail = String(process.env.LISTAI_CONTACT_EMAIL || '').trim();

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  submissionId: payload.submission_id,
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

if (payload.submission_id !== 'listai-maglasync-free-2026-08-30-v1') {
  fail('BLOCKED_PAYLOAD', `Unexpected submission_id: ${payload.submission_id}`);
}
if (payload.category !== 'Productivity') fail('BLOCKED_PAYLOAD', 'Unexpected category.');
if (payload.url !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || /noreply/i.test(contactEmail)) {
  fail('BLOCKED_CONTACT', 'A valid non-noreply maintainer email is required at runtime.');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  page.on('response', async response => {
    if (response.request().method() === 'GET') return;
    const item = {
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
      body: null,
    };
    try {
      item.body = (await response.text()).slice(0, 3000);
    } catch {}
    report.submissionResponses.push(item);
  });

  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 });
  report.preflight.httpStatus = response?.status() ?? null;
  if (!response || response.status() >= 400) {
    fail('BLOCKED_PREFLIGHT', `ListAI returned HTTP ${response?.status() ?? 'unknown'}.`);
  }

  await page.waitForTimeout(2000);
  const bodyBefore = await page.locator('body').innerText();
  const frames = page.frames().map(frame => frame.url());
  const freeEvidence = /Free listing\s*[—-]\s*no account needed/i.test(bodyBefore)
    && /Free\s*Forever/i.test(bodyBefore)
    && /No account required/i.test(bodyBefore)
    && /Submit Tool for Free/i.test(bodyBefore);
  const captchaEvidence = /captcha|recaptcha|hcaptcha|turnstile/i.test(bodyBefore)
    || frames.some(url => /recaptcha|hcaptcha|turnstile/i.test(url));
  const loginEvidence = /login required|log in to submit|sign in to submit|continue with google|continue with github/i.test(bodyBefore);
  const requiredPaymentEvidence = /payment required|credit card required|pay to submit|required fee/i.test(bodyBefore);

  Object.assign(report.preflight, {
    freeEvidence,
    captchaEvidence,
    loginEvidence,
    requiredPaymentEvidence,
    frames,
  });

  if (!freeEvidence) fail('BLOCKED_PREFLIGHT', 'Expected permanent free/no-account route is no longer visible.');
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; stop before submission.');
  if (requiredPaymentEvidence) fail('BLOCKED_PREFLIGHT', 'Required payment detected; only the free route is authorized.');

  const form = page.locator('form:has(#toolName):has(#category):has(#url):has(#description):has(#email)');
  if (await form.count() !== 1) {
    fail('BLOCKED_PREFLIGHT', `Expected exactly one ListAI submission form; found ${await form.count()}.`);
  }

  const categoryOptions = await form.locator('#category option').evaluateAll(options => options.map(option => option.value));
  report.preflight.categoryOptions = categoryOptions;
  if (!categoryOptions.includes(payload.category)) {
    fail('BLOCKED_PREFLIGHT', `Category ${payload.category} is no longer available.`);
  }

  await form.locator('#toolName').fill(payload.toolName);
  await form.locator('#category').selectOption(payload.category);
  await form.locator('#url').fill(payload.url);
  await form.locator('#description').fill(payload.description);
  if (await form.locator('#name').count()) await form.locator('#name').fill(payload.submitterName);
  await form.locator('#email').fill(contactEmail);

  const selectedCategory = await form.locator('#category').inputValue();
  report.preflight.selectedCategory = selectedCategory;
  if (selectedCategory !== payload.category) fail('BLOCKED_PREFLIGHT', 'Selected category does not match payload.');

  const requiredEmpty = await form.locator('input[required],textarea[required],select[required]').evaluateAll(elements => elements
    .filter(el => !String(el.value ?? '').trim())
    .map(el => el.id || el.getAttribute('name') || el.tagName));
  if (requiredEmpty.length) fail('BLOCKED_PREFLIGHT', `Required fields are empty: ${requiredEmpty.join(', ')}`);

  const button = form.getByRole('button', { name: /Submit Tool for Free/i });
  if (await button.count() !== 1 || !(await button.isEnabled())) {
    fail('BLOCKED_PREFLIGHT', 'Free submit button is missing or disabled.');
  }

  await button.scrollIntoViewIfNeeded();
  await button.click({ trial: true, timeout: 10000 });
  await page.screenshot({ path: BEFORE_PATH, fullPage: true });

  report.clickedSubmit = true;
  await button.click({ timeout: 15000 });
  await page.waitForTimeout(7000);

  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  const finalUrl = page.url();
  report.finalUrl = finalUrl;
  await page.screenshot({ path: AFTER_PATH, fullPage: true }).catch(() => {});

  const urlSuccess = /thank|success|submitted/i.test(new URL(finalUrl).pathname);
  const textMatch = bodyAfter.match(/thank you[^\n]*|submission (?:has been )?(?:received|submitted)[^\n]*|submitted successfully[^\n]*|we(?:'|’)ll review[^\n]*|we will review[^\n]*|review(?:ed)? within 24[^\n]*/i);
  const responseMatch = report.submissionResponses.find(item =>
    item.status >= 200 && item.status < 300 &&
    /["']?success["']?\s*[:=]\s*true|submitted|submission.{0,100}(received|created|success)|thank you|pending.{0,50}review/i.test(item.body || '')
  );

  if (urlSuccess) report.confirmationEvidence = { type: 'url', value: finalUrl };
  else if (textMatch) report.confirmationEvidence = { type: 'page_text', value: textMatch[0].slice(0, 500) };
  else if (responseMatch) report.confirmationEvidence = { type: 'response', value: responseMatch };

  if (!report.confirmationEvidence) {
    fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but ListAI returned no direct success evidence; do not count as submitted.');
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
