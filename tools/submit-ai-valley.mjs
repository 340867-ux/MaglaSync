import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://aivalley.ai/submit-tool/';
const PAYLOAD_PATH = 'growth/submissions/ai-valley-v1.json';
const REPORT_DIR = 'reports/growth/ai-valley-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');
const BEFORE_PATH = path.join(REPORT_DIR, 'before-submit.png');
const AFTER_PATH = path.join(REPORT_DIR, 'after-submit.png');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
const contactEmail = String(process.env.AI_VALLEY_CONTACT_EMAIL || '').trim();

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

if (payload.submission_id !== 'ai-valley-maglasync-free-2026-08-30-v1') {
  fail('BLOCKED_PAYLOAD', `Unexpected submission_id: ${payload.submission_id}`);
}
if (payload.toolUrl !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
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
      item.body = (await response.text()).slice(0, 4000);
    } catch {}
    report.submissionResponses.push(item);
  });

  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 });
  report.preflight.httpStatus = response?.status() ?? null;
  if (!response || response.status() >= 400) {
    fail('BLOCKED_PREFLIGHT', `AI Valley returned HTTP ${response?.status() ?? 'unknown'}.`);
  }

  await page.waitForTimeout(2500);
  const bodyBefore = await page.locator('body').innerText();
  const frames = page.frames().map(frame => frame.url());
  const submitEvidence = /Submit any Tools Here/i.test(bodyBefore) && /Tool Name/i.test(bodyBefore) && /Tool URL/i.test(bodyBefore);
  const captchaEvidence = /captcha|recaptcha|hcaptcha|turnstile/i.test(bodyBefore)
    || frames.some(url => /recaptcha|hcaptcha|turnstile/i.test(url));
  const loginEvidence = /login required|log in to submit|sign in to submit|continue with google|continue with github/i.test(bodyBefore);
  const paymentEvidence = /payment required|credit card required|required fee|pay to submit|checkout/i.test(bodyBefore);

  Object.assign(report.preflight, { submitEvidence, captchaEvidence, loginEvidence, paymentEvidence, frames });

  if (!submitEvidence) fail('BLOCKED_PREFLIGHT', 'Expected public tool-submission route is no longer visible.');
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; stop before submission.');
  if (paymentEvidence) fail('BLOCKED_PREFLIGHT', 'Payment requirement detected; no paid submission is authorized.');

  const form = page.locator('form:has(input[name="your-name"]):has(input[name="your-email"]):has(input[name="ToolName"]):has(input[name="ToolURL"])');
  if (await form.count() !== 1) {
    fail('BLOCKED_PREFLIGHT', `Expected exactly one AI Valley submission form; found ${await form.count()}.`);
  }

  const messages = form.locator('textarea[name="your-message"]');
  if (await messages.count() < 2) {
    fail('BLOCKED_PREFLIGHT', `Expected two description fields; found ${await messages.count()}.`);
  }

  await form.locator('input[name="your-name"]').fill(payload.submitterName);
  await form.locator('input[name="your-email"]').fill(contactEmail);
  await form.locator('input[name="ToolName"]').fill(payload.toolName);
  await form.locator('input[name="ToolURL"]').fill(payload.toolUrl);
  await messages.nth(0).fill(payload.description);
  await messages.nth(1).fill(payload.shortDescription);

  const boundValues = {
    name: await form.locator('input[name="your-name"]').inputValue(),
    emailPresent: Boolean(await form.locator('input[name="your-email"]').inputValue()),
    toolName: await form.locator('input[name="ToolName"]').inputValue(),
    toolUrl: await form.locator('input[name="ToolURL"]').inputValue(),
    descriptions: [await messages.nth(0).inputValue(), await messages.nth(1).inputValue()],
  };
  report.preflight.boundValues = boundValues;
  if (boundValues.name !== payload.submitterName || boundValues.toolName !== payload.toolName || boundValues.toolUrl !== payload.toolUrl || !boundValues.emailPresent) {
    fail('BLOCKED_PREFLIGHT', 'Bound form values do not match the authorized payload.');
  }

  const button = form.locator('input[type="submit"]');
  if (await button.count() !== 1 || !(await button.isEnabled())) {
    fail('BLOCKED_PREFLIGHT', 'AI Valley submit control is missing or disabled.');
  }

  await button.scrollIntoViewIfNeeded();
  await button.click({ trial: true, timeout: 10000 });
  await page.screenshot({ path: BEFORE_PATH, fullPage: true });

  report.clickedSubmit = true;
  await button.click({ timeout: 15000 });
  await page.waitForTimeout(7000);

  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  report.finalUrl = page.url();
  await page.screenshot({ path: AFTER_PATH, fullPage: true }).catch(() => {});

  const responseMatch = report.submissionResponses.find(item =>
    item.status >= 200 && item.status < 300 &&
    (/contact-form-7|wpcf7|feedback/i.test(item.url) || /mail_sent|message.{0,80}sent|thank/i.test(item.body || '')) &&
    /mail_sent|"status"\s*:\s*"mail_sent"|message.{0,80}sent|thank/i.test(item.body || '')
  );
  const textMatch = bodyAfter.match(/thank you[^\n]*|your message has been sent[^\n]*|message (?:was|has been) sent[^\n]*|submitted[^\n]*review[^\n]*/i);

  if (responseMatch) report.confirmationEvidence = { type: 'response', value: responseMatch };
  else if (textMatch) report.confirmationEvidence = { type: 'page_text', value: textMatch[0].slice(0, 500) };

  if (!report.confirmationEvidence) {
    fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but AI Valley returned no direct success evidence; do not count as submitted.');
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
