import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET = 'https://inforelay.ai/submit/';
const PAYLOAD_PATH = 'growth/submissions/inforelay-v1.json';
const REPORT_DIR = 'reports/growth/inforelay-v1';
const REPORT_PATH = path.join(REPORT_DIR, 'SUBMISSION_REPORT.json');

fs.mkdirSync(REPORT_DIR, { recursive: true });
const payload = JSON.parse(fs.readFileSync(PAYLOAD_PATH, 'utf8'));
const contactEmail = String(process.env.INFORELAY_CONTACT_EMAIL || '').trim();

const report = {
  generatedAt: new Date().toISOString(),
  target: TARGET,
  submissionId: payload.submission_id,
  status: 'NOT_ATTEMPTED',
  clickedSubmit: false,
  submitted: false,
  preflight: {},
  submissionResponse: null,
  finalUrl: null,
  confirmationEvidence: null,
  failureEvidence: null,
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

if (payload.submission_id !== 'inforelay-maglasync-free-2026-08-30-v1') {
  fail('BLOCKED_PAYLOAD', `Unexpected submission_id: ${payload.submission_id}`);
}
if (payload.category !== 'productivity') fail('BLOCKED_PAYLOAD', 'Unexpected category.');
if (payload.pricing !== 'free') fail('BLOCKED_PAYLOAD', 'Unexpected pricing.');
if (payload.url !== 'https://sync.magla.ru/en/') fail('BLOCKED_PAYLOAD', 'Unexpected public product URL.');
if (!payload.tagline || payload.tagline.length > 70) fail('BLOCKED_PAYLOAD', 'Tagline must be 1-70 characters.');
if (!contactEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail) || /noreply/i.test(contactEmail)) {
  fail('BLOCKED_CONTACT', 'A valid non-noreply maintainer email is required at runtime.');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const response = await page.goto(TARGET, { waitUntil: 'domcontentloaded', timeout: 45000 });
  report.preflight.httpStatus = response?.status() ?? null;
  if (!response || response.status() >= 400) {
    fail('BLOCKED_PREFLIGHT', `InfoRelay returned HTTP ${response?.status() ?? 'unknown'}.`);
  }

  await page.waitForTimeout(1500);
  const bodyBefore = await page.locator('body').innerText();
  const frames = page.frames().map(frame => frame.url());
  const freeEvidence = /Submit your tool for a free listing/i.test(bodyBefore)
    && /Free listing/i.test(bodyBefore)
    && /no spam, no pay-to-play ranking/i.test(bodyBefore);
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

  if (!freeEvidence) fail('BLOCKED_PREFLIGHT', 'Expected free hand-reviewed route is no longer visible.');
  if (captchaEvidence) fail('BLOCKED_PREFLIGHT', 'CAPTCHA detected; automated submission is forbidden.');
  if (loginEvidence) fail('BLOCKED_PREFLIGHT', 'Login requirement detected; stop before submission.');
  if (requiredPaymentEvidence) fail('BLOCKED_PREFLIGHT', 'Required payment detected; only the free route is authorized.');

  const form = page.locator('form');
  const matchingForms = form.filter({ has: page.locator('[name="submitter_email"]') });
  if (await matchingForms.count() !== 1) {
    fail('BLOCKED_PREFLIGHT', `Expected exactly one InfoRelay submission form; found ${await matchingForms.count()}.`);
  }
  const targetForm = matchingForms.first();
  const action = await targetForm.getAttribute('action');
  const method = String(await targetForm.getAttribute('method') || 'GET').toUpperCase();
  report.preflight.formAction = action;
  report.preflight.formMethod = method;
  if (action !== '/api/submit-tool' || method !== 'POST') {
    fail('BLOCKED_PREFLIGHT', `Unexpected form route: ${method} ${action}.`);
  }

  const expectedFields = ['name', 'url', 'tagline', 'category', 'pricing', 'description', 'submitter_name', 'submitter_email', 'website'];
  for (const fieldName of expectedFields) {
    if (await targetForm.locator(`[name="${fieldName}"]`).count() !== 1) {
      fail('BLOCKED_PREFLIGHT', `Expected field is missing or duplicated: ${fieldName}`);
    }
  }

  const categoryOptions = await targetForm.locator('[name="category"] option').evaluateAll(options => options.map(option => option.value));
  const pricingOptions = await targetForm.locator('[name="pricing"] option').evaluateAll(options => options.map(option => option.value));
  report.preflight.categoryOptions = categoryOptions;
  report.preflight.pricingOptions = pricingOptions;
  if (!categoryOptions.includes(payload.category)) fail('BLOCKED_PREFLIGHT', `Category ${payload.category} is no longer available.`);
  if (!pricingOptions.includes(payload.pricing)) fail('BLOCKED_PREFLIGHT', `Pricing ${payload.pricing} is no longer available.`);

  await targetForm.locator('[name="name"]').fill(payload.name);
  await targetForm.locator('[name="url"]').fill(payload.url);
  await targetForm.locator('[name="tagline"]').fill(payload.tagline);
  await targetForm.locator('[name="category"]').selectOption(payload.category);
  await targetForm.locator('[name="pricing"]').selectOption(payload.pricing);
  await targetForm.locator('[name="description"]').fill(payload.description);
  await targetForm.locator('[name="submitter_name"]').fill(payload.submitterName);
  await targetForm.locator('[name="submitter_email"]').fill(contactEmail);
  await targetForm.locator('[name="website"]').fill('');

  const honeypotValue = await targetForm.locator('[name="website"]').inputValue();
  if (honeypotValue !== '') fail('BLOCKED_PREFLIGHT', 'Honeypot field must remain empty.');

  const selectedCategory = await targetForm.locator('[name="category"]').inputValue();
  const selectedPricing = await targetForm.locator('[name="pricing"]').inputValue();
  report.preflight.selectedCategory = selectedCategory;
  report.preflight.selectedPricing = selectedPricing;
  if (selectedCategory !== payload.category || selectedPricing !== payload.pricing) {
    fail('BLOCKED_PREFLIGHT', 'Selected category or pricing does not match payload.');
  }

  const requiredEmpty = await targetForm.locator('input[required],textarea[required],select[required]').evaluateAll(elements => elements
    .filter(el => !String(el.value ?? '').trim())
    .map(el => el.getAttribute('name') || el.id || el.tagName));
  if (requiredEmpty.length) fail('BLOCKED_PREFLIGHT', `Required fields are empty: ${requiredEmpty.join(', ')}`);

  const button = targetForm.getByRole('button', { name: /Submit for review/i });
  if (await button.count() !== 1 || !(await button.isEnabled())) {
    fail('BLOCKED_PREFLIGHT', 'Submit-for-review button is missing or disabled.');
  }

  await button.scrollIntoViewIfNeeded();
  await button.click({ trial: true, timeout: 10000 });

  const responsePromise = page.waitForResponse(res =>
    res.request().method() === 'POST' && /\/api\/submit-tool(?:$|\?)/.test(res.url()),
    { timeout: 20000 }
  );
  report.clickedSubmit = true;
  await button.click({ timeout: 15000 });
  const submissionResponse = await responsePromise;
  let responseBody = '';
  try { responseBody = (await submissionResponse.text()).slice(0, 4000); } catch {}
  report.submissionResponse = {
    url: submissionResponse.url(),
    status: submissionResponse.status(),
    body: responseBody,
  };

  await page.waitForTimeout(2000);
  report.finalUrl = page.url();
  const bodyAfter = await page.locator('body').innerText().catch(() => '');
  const finalUrl = new URL(report.finalUrl);
  const errorParam = finalUrl.searchParams.get('error');
  if (errorParam) {
    report.failureEvidence = { type: 'error_redirect', value: { url: report.finalUrl, error: errorParam } };
    fail('ATTEMPTED_UNCONFIRMED', `InfoRelay returned a server failure redirect: error=${errorParam}. Do not count or retry automatically.`);
  }

  let parsed = null;
  try { parsed = JSON.parse(responseBody); } catch {}
  const responseSuccess = Boolean(parsed && parsed.success === true);
  const responseMessage = parsed && typeof parsed.message === 'string' ? parsed.message : '';
  const responseTextSuccess = /submitted successfully|submission (?:has been )?(?:received|created)|thank you for submitting/i.test(responseMessage || responseBody);
  const pageTextMatch = bodyAfter.match(/thank you for submitting[^\n]*|submission (?:has been )?(?:received|submitted)[^\n]*|submitted successfully[^\n]*/i);
  const successPage = finalUrl.pathname === '/submitted/' && !finalUrl.searchParams.has('error');

  if (responseSuccess) report.confirmationEvidence = { type: 'response_json', value: { success: true, message: responseMessage.slice(0, 500) } };
  else if (submissionResponse.status() >= 200 && submissionResponse.status() < 300 && responseTextSuccess) {
    report.confirmationEvidence = { type: 'response_text', value: responseBody.slice(0, 1000) };
  } else if (successPage && pageTextMatch) {
    report.confirmationEvidence = { type: 'success_page_text', value: pageTextMatch[0].slice(0, 500) };
  }

  if (!report.confirmationEvidence) {
    fail('ATTEMPTED_UNCONFIRMED', 'Submit was clicked but InfoRelay returned no direct success evidence; do not count or retry automatically.');
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
