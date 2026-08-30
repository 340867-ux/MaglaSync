import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://aisotools.com/submit';
const PAYLOAD_PATH = 'growth/submissions/aiso-v1.json';
const REPORT_DIR = 'reports/growth/aiso-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');
const BEFORE_PATH = path.join(REPORT_DIR, 'before-submit.png');
const AFTER_PATH = path.join(REPORT_DIR, 'after-submit.png');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
const contactEmail = String(process.env.AISO_CONTACT_EMAIL || '').trim();

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

if (payload.submission_id !== 'aiso-maglasync-free-2026-08-30-v1') fail('BLOCKED_PAYLOAD', 'Unexpected submission id.');
if (payload.url !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
if (payload.category !== 'Productivity' || payload.pricing !== 'Free') fail('BLOCKED_PAYLOAD', 'Only Productivity / Free is authorized.');
if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || /noreply/i.test(contactEmail)) {
  fail('BLOCKED_CONTACT', 'A valid non-noreply maintainer email is required at runtime.');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  page.on('response', async response => {
    if (response.request().method() === 'GET') return;
    const item = {
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
      body: null,
    };
    try { item.body = (await response.text()).slice(0, 5000); } catch {}
    report.submissionResponses.push(item);
  });

  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 });
  report.preflight.httpStatus = response?.status() ?? null;
  if (!response || response.status() >= 400) fail('BLOCKED_PREFLIGHT', `AISO Tools returned HTTP ${response?.status() ?? 'unknown'}.`);

  await page.waitForTimeout(2500);
  const bodyBefore = await page.locator('body').innerText();
  const frames = page.frames().map(frame => frame.url());
  const freeEvidence = /listing is free/i.test(bodyBefore)
    && /No card required/i.test(bodyBefore)
    && /Free listing/i.test(bodyBefore)
    && /Submit Tool\s*[—-]\s*Free/i.test(bodyBefore);
  const captchaEvidence = /captcha|recaptcha|hcaptcha|turnstile/i.test(bodyBefore)
    || frames.some(url => /recaptcha|hcaptcha|turnstile/i.test(url));
  const loginEvidence = /login required|log in to submit|sign in to submit|continue with google|continue with github/i.test(bodyBefore);

  Object.assign(report.preflight, { freeEvidence, captchaEvidence, loginEvidence, frames });
  if (!freeEvidence) fail('BLOCKED_PREFLIGHT', 'Expected free/no-card AISO route is no longer visible.');
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; stop before submission.');

  const form = page.locator('form:has(input[name="tool_name"]):has(input[name="url"]):has(select[name="category"]):has(input[name="email"])');
  if (await form.count() !== 1) fail('BLOCKED_PREFLIGHT', `Expected exactly one AISO submission form; found ${await form.count()}.`);

  const honeypot = form.locator('input[name="website"]');
  if (await honeypot.count()) {
    if (await honeypot.inputValue()) fail('BLOCKED_PREFLIGHT', 'AISO honeypot unexpectedly contains a value.');
  }

  const categoryOptions = await form.locator('select[name="category"] option').evaluateAll(options => options.map(o => ({ value: o.value, text: (o.textContent || '').trim() })));
  const pricingOptions = await form.locator('select[name="pricing"] option').evaluateAll(options => options.map(o => ({ value: o.value, text: (o.textContent || '').trim() })));
  report.preflight.categoryOptions = categoryOptions;
  report.preflight.pricingOptions = pricingOptions;
  if (!categoryOptions.some(o => o.text === payload.category || o.value === payload.category)) fail('BLOCKED_PREFLIGHT', 'Productivity category is not available.');
  if (!pricingOptions.some(o => o.text === payload.pricing || o.value === payload.pricing)) fail('BLOCKED_PREFLIGHT', 'Free pricing option is not available.');

  await form.locator('input[name="tool_name"]').fill(payload.toolName);
  await form.locator('input[name="url"]').fill(payload.url);
  await form.locator('select[name="category"]').selectOption({ label: payload.category });
  await form.locator('input[name="short_description"]').fill(payload.shortDescription);
  await form.locator('textarea[name="description"]').fill(payload.description);
  await form.locator('select[name="pricing"]').selectOption({ label: payload.pricing });
  await form.locator('input[name="pricing_details"]').fill(payload.pricingDetails);
  await form.locator('textarea[name="features"]').fill(payload.features);
  await form.locator('input[name="email"]').fill(contactEmail);

  const selectedCategory = (await form.locator('select[name="category"] option:checked').textContent() || '').trim();
  const selectedPricing = (await form.locator('select[name="pricing"] option:checked').textContent() || '').trim();
  report.preflight.selectedCategory = selectedCategory;
  report.preflight.selectedPricing = selectedPricing;
  if (selectedCategory !== payload.category || selectedPricing !== payload.pricing) fail('BLOCKED_PREFLIGHT', 'Selected AISO form state does not match the authorized free listing.');

  const freeTierButton = form.getByRole('button', { name: /Free\s*\$0/i });
  if (await freeTierButton.count() === 1) {
    await freeTierButton.click({ trial: true, timeout: 10000 });
    await freeTierButton.click({ timeout: 10000 });
    await page.waitForTimeout(400);
  }

  const paymentFields = await form.locator('input').evaluateAll(inputs => inputs.map(input => `${input.name || ''} ${input.type || ''}`).filter(value => /card|stripe|payment|checkout|billing/i.test(value)));
  report.preflight.paymentFields = paymentFields;
  if (paymentFields.length) fail('BLOCKED_PREFLIGHT', `Payment fields appeared after choosing Free: ${paymentFields.join(', ')}`);

  const submitButton = form.getByRole('button', { name: /Submit Tool\s*[—-]\s*Free/i });
  if (await submitButton.count() !== 1 || !(await submitButton.isEnabled())) fail('BLOCKED_PREFLIGHT', 'AISO free submit button is missing or disabled.');

  await submitButton.scrollIntoViewIfNeeded();
  await submitButton.click({ trial: true, timeout: 10000 });
  await page.screenshot({ path: BEFORE_PATH, fullPage: true });

  report.clickedSubmit = true;
  await submitButton.click({ timeout: 15000 });
  await page.waitForTimeout(7000);

  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  report.finalUrl = page.url();
  await page.screenshot({ path: AFTER_PATH, fullPage: true }).catch(() => {});

  const textMatch = bodyAfter.match(/thank you[^\n]*|submission (?:has been )?(?:received|submitted)[^\n]*|submitted successfully[^\n]*|submitted for review[^\n]*|we(?:'|’)ll review[^\n]*|we will review[^\n]*/i);
  const responseMatch = report.submissionResponses.find(item =>
    item.status >= 200 && item.status < 300 &&
    /success|submitted|submission.{0,100}(received|created)|thank you|review/i.test(item.body || '')
  );

  if (textMatch) report.confirmationEvidence = { type: 'page_text', value: textMatch[0].slice(0, 500) };
  else if (responseMatch) report.confirmationEvidence = { type: 'response', value: responseMatch };

  if (!report.confirmationEvidence) fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but AISO Tools returned no direct success evidence; do not count as submitted.');

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
