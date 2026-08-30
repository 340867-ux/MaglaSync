import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://aitoolsdailyhub.com/submit-a-tool/';
const PAYLOAD_PATH = 'growth/submissions/ai-tools-daily-hub-v1.json';
const REPORT_DIR = 'reports/growth/ai-tools-daily-hub-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');
const BEFORE_PATH = path.join(REPORT_DIR, 'before-submit.png');
const AFTER_PATH = path.join(REPORT_DIR, 'after-submit.png');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
const contactEmail = String(process.env.AI_TOOLS_DAILY_HUB_CONTACT_EMAIL || '').trim();

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

if (payload.submission_id !== 'ai-tools-daily-hub-maglasync-free-2026-08-30-v1') fail('BLOCKED_PAYLOAD', 'Unexpected submission id.');
if (payload.toolUrl !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
if (payload.category !== 'productivity' || payload.pricingType !== 'free' || payload.hasFreePlan !== true) {
  fail('BLOCKED_PAYLOAD', 'Only the Productivity / Free listing is authorized.');
}
if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || /noreply/i.test(contactEmail)) {
  fail('BLOCKED_CONTACT', 'A valid non-noreply maintainer email is required at runtime.');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1300 } });
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
  if (!response || response.status() >= 400) fail('BLOCKED_PREFLIGHT', `AI Tools Daily Hub returned HTTP ${response?.status() ?? 'unknown'}.`);

  await page.waitForTimeout(2500);
  const bodyBefore = await page.locator('body').innerText();
  const frames = page.frames().map(frame => frame.url());
  const freeEvidence = /Free\s*\$0/i.test(bodyBefore)
    && /Is the free listing really free\?/i.test(bodyBefore)
    && /completely free/i.test(bodyBefore)
    && /No credit card required/i.test(bodyBefore);
  const captchaEvidence = /captcha|recaptcha|hcaptcha|turnstile/i.test(bodyBefore)
    || frames.some(url => /recaptcha|hcaptcha|turnstile/i.test(url));
  const loginEvidence = /login required|log in to submit|sign in to submit|continue with google|continue with github/i.test(bodyBefore);

  Object.assign(report.preflight, { freeEvidence, captchaEvidence, loginEvidence, frames });
  if (!freeEvidence) fail('BLOCKED_PREFLIGHT', 'Expected $0/free/no-credit-card route is no longer visible.');
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; stop before submission.');

  const form = page.locator('form:has(#tool_name):has(#tool_url):has(#tool_tagline):has(#tool_excerpt):has(#tool_category):has(#pricing_type):has(#contact_email)');
  if (await form.count() !== 1) fail('BLOCKED_PREFLIGHT', `Expected exactly one free listing form; found ${await form.count()}.`);

  const sensitiveInputs = await form.locator('input').evaluateAll(inputs => inputs.map(input => `${input.name || ''} ${input.type || ''}`).filter(value => /card|stripe|payment|checkout|billing/i.test(value)));
  report.preflight.sensitiveInputs = sensitiveInputs;
  if (sensitiveInputs.length) fail('BLOCKED_PREFLIGHT', `Payment fields unexpectedly appeared in the listing form: ${sensitiveInputs.join(', ')}`);

  await form.locator('#tool_name').fill(payload.toolName);
  await form.locator('#tool_url').fill(payload.toolUrl);
  await form.locator('#tool_tagline').fill(payload.tagline);
  await form.locator('#tool_excerpt').fill(payload.shortDescription);
  await form.locator('#tool_about').fill(payload.fullDescription);
  await form.locator('#tool_category').selectOption({ label: 'Productivity' });
  await form.locator('#pricing_type').selectOption({ label: 'Free' });
  await form.locator('#pricing_detail').fill(payload.pricingDetail);
  const freeCheckbox = form.locator('input[name="is_free"]');
  if (!(await freeCheckbox.isChecked())) await freeCheckbox.check();
  await form.locator('#contact_name').fill(payload.submitterName);
  await form.locator('#contact_email').fill(contactEmail);

  const selectedCategory = (await form.locator('#tool_category option:checked').textContent() || '').trim();
  const selectedPricing = (await form.locator('#pricing_type option:checked').textContent() || '').trim();
  report.preflight.selectedCategory = selectedCategory;
  report.preflight.selectedPricing = selectedPricing;
  report.preflight.freeCheckbox = await freeCheckbox.isChecked();
  if (selectedCategory !== 'Productivity' || selectedPricing !== 'Free' || !report.preflight.freeCheckbox) {
    fail('BLOCKED_PREFLIGHT', 'Selected form state is not the authorized free Productivity listing.');
  }

  const requiredIds = ['#tool_name','#tool_url','#tool_tagline','#tool_excerpt','#tool_category','#pricing_type','#contact_name','#contact_email'];
  const empty = [];
  for (const selector of requiredIds) {
    if (!String(await form.locator(selector).inputValue()).trim()) empty.push(selector);
  }
  if (empty.length) fail('BLOCKED_PREFLIGHT', `Required fields are empty: ${empty.join(', ')}`);

  const button = form.getByRole('button', { name: /Submit Tool for Review/i });
  if (await button.count() !== 1 || !(await button.isEnabled())) fail('BLOCKED_PREFLIGHT', 'Free submit button is missing or disabled.');

  await button.scrollIntoViewIfNeeded();
  await button.click({ trial: true, timeout: 10000 });
  await page.screenshot({ path: BEFORE_PATH, fullPage: true });

  report.clickedSubmit = true;
  await Promise.all([
    page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => null),
    button.click({ timeout: 15000 }),
  ]);
  await page.waitForTimeout(5000);

  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  report.finalUrl = page.url();
  await page.screenshot({ path: AFTER_PATH, fullPage: true }).catch(() => {});

  const textMatch = bodyAfter.match(/thank you[^\n]*|tool (?:has been )?submitted[^\n]*|submission (?:has been )?(?:received|submitted)[^\n]*|submitted for review[^\n]*|we(?:'|’)ll review[^\n]*|we will review[^\n]*/i);
  const responseMatch = report.submissionResponses.find(item =>
    item.status >= 200 && item.status < 300 &&
    /success|submitted|submission.{0,100}(received|created)|thank you|review/i.test(item.body || '')
  );

  if (textMatch) report.confirmationEvidence = { type: 'page_text', value: textMatch[0].slice(0, 500) };
  else if (responseMatch) report.confirmationEvidence = { type: 'response', value: responseMatch };

  if (!report.confirmationEvidence) fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but AI Tools Daily Hub returned no direct success evidence; do not count as submitted.');

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
