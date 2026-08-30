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

test("PromptFrenzy submission remains a narrow push action with no secrets", () => {
  assert.match(workflow, /paths:\s*\n\s*- growth\/submissions\/promptfrenzy-v1\.json\s*\n\s*- \.github\/workflows\/submit-promptfrenzy\.yml/);
  assert.match(workflow, /branches:\s*\n\s*- main/);
  assert.doesNotMatch(workflow, /workflow_dispatch/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.match(workflow, /https:\/\/www\.promptfrenzy\.com\/api\/directory\/submit/);
  assert.match(workflow, /PROMPTFRENZY_ALREADY_LISTED/);
});

test("PromptFrenzy preflight uses stable public GitHub source instead of custom-domain DNS", () => {
  assert.match(workflow, /https:\/\/raw\.githubusercontent\.com\/340867-ux\/MaglaSync\/main\/site\/en\/press\/index\.html/);
  assert.doesNotMatch(workflow, /promptfrenzy-check=/);
  assert.doesNotMatch(workflow, /seq 1 36/);
});

test("PromptFrenzy payload matches the current public schema and stays free", () => {
  assert.match(workflow, /"name": "MaglaSync Free"/);
  assert.match(workflow, /"url": "https:\/\/sync\.magla\.ru\/en\/"/);
  assert.match(workflow, /"description": "Local project memory across ChatGPT, Claude, and Gemini/);
  assert.match(workflow, /"category": "productivity"/);
  assert.match(workflow, /"tags": \["ai-memory", "project-memory", "local-first", "browser-extension", "context"\]/);
  assert.match(workflow, /"pricing": "free"/);
  assert.match(workflow, /"logo": "https:\/\/sync\.magla\.ru\/icon128\.png"/);
  assert.match(workflow, /"badge_url": "https:\/\/sync\.magla\.ru\/en\/press\/"/);
  assert.doesNotMatch(workflow, /pricing_detail|key_features|works_with|platforms|submitted_by/);
});
