import fs from 'node:fs';
import { chromium } from 'playwright';

const targets = [
  { name: 'ExtensionHub', url: 'https://extensionhub.in/submit' },
  { name: 'ChromeXts', url: 'https://www.chromexts.com/' },
  { name: 'Resource.fyi', url: 'https://resource.fyi/' },
  { name: 'TestNest', url: 'https://testnest.website/' },
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const target of targets) {
  const page = await browser.newPage();
  const record = { name: target.name, url: target.url, status: 'UNKNOWN', forms: [], frames: [], blockers: [] };
  try {
    const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    record.httpStatus = response?.status() ?? null;
    await page.waitForTimeout(2500);

    const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 25000);
    const blockerPatterns = [
      ['captcha', /captcha|recaptcha|hcaptcha|turnstile/i],
      ['login', /sign in|log in|login required|continue with google|continue with github/i],
    ];
    for (const [kind, pattern] of blockerPatterns) {
      if (pattern.test(bodyText)) record.blockers.push(kind);
    }

    record.forms = await page.locator('form').evaluateAll(forms => forms.map((form, index) => ({
      index,
      action: form.getAttribute('action'),
      method: form.getAttribute('method'),
      inputs: [...form.querySelectorAll('input,textarea,select,button')].map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        name: el.getAttribute('name'),
        id: el.id || null,
        placeholder: el.getAttribute('placeholder'),
        text: (el.textContent || '').trim().slice(0, 120),
        ariaLabel: el.getAttribute('aria-label'),
      })),
    })));

    record.frames = page.frames().map(frame => ({ url: frame.url() }));
    record.status = 'PROBED_NO_SUBMISSION';
  } catch (error) {
    record.status = 'PROBE_FAILED';
    record.error = String(error?.message || error);
  } finally {
    await page.close();
  }
  results.push(record);
}

await browser.close();
fs.mkdirSync('reports/growth', { recursive: true });
fs.writeFileSync('reports/growth/PUBLIC_FORM_PROBE.json', JSON.stringify({ generatedAt: new Date().toISOString(), submitted: false, results }, null, 2));
console.log(JSON.stringify(results, null, 2));
