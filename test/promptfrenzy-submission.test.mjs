import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const press = await readFile(new URL("../site/en/press/index.html", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/submit-promptfrenzy.yml", import.meta.url), "utf8");

test("PromptFrenzy verification link is static, dofollow, and tracker-free", () => {
  assert.match(press, /data-submission="promptfrenzy-20260830"/);
  assert.match(press, /href="https:\/\/www\.promptfrenzy\.com\/directory"/);
  assert.match(press, /rel="noopener"/);
  assert.doesNotMatch(press, /rel="[^"]*(?:nofollow|sponsored)/);
  assert.doesNotMatch(press, /promptfrenzy\.com\/badges\//);
  assert.doesNotMatch(press, /<script[^>]+src=["']https?:\/\//i);
});

test("PromptFrenzy submission is a one-marker push action with no secrets", () => {
  assert.match(workflow, /paths:\s*\n\s*- growth\/submissions\/promptfrenzy-v1\.json/);
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.match(workflow, /https:\/\/www\.promptfrenzy\.com\/api\/directory\/submit/);
  assert.match(workflow, /PROMPTFRENZY_ALREADY_LISTED/);
});

test("PromptFrenzy payload stays public, free, and product-accurate", () => {
  assert.match(workflow, /"name": "MaglaSync Free"/);
  assert.match(workflow, /"pricing": "free"/);
  assert.match(workflow, /"category": "productivity"/);
  assert.match(workflow, /"badge_url": "https:\/\/sync\.magla\.ru\/en\/press\/"/);
  assert.match(workflow, /"works_with": \["chatgpt", "claude", "gemini"\]/);
  assert.match(workflow, /"platforms": \["browser-extension", "windows", "macos", "linux"\]/);
  assert.doesNotMatch(workflow, /paid|credit card|payment|review exchange/i);
});
