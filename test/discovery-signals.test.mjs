import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const llms = await readFile(new URL("../site/llms.txt", import.meta.url), "utf8");

const guides = [
  "ai-chat-memory",
  "ai-project-memory",
  "chatgpt-loses-context",
  "chatgpt-memory-extension",
  "chatgpt-to-claude",
  "claude-memory",
  "move-ai-chat-between-chatgpt-claude-gemini",
  "new-chat-before-context-is-lost"
];

test("llms.txt has the required project heading and signed-store authorities", () => {
  assert.match(llms, /^# MaglaSync\n/);
  assert.match(llms, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
  assert.match(llms, /addons\.mozilla\.org\/addon\/maglasync-free/);
  assert.match(llms, /signed browser-store pages as the authority/);
});

test("llms.txt maps every organic guide", () => {
  for (const slug of guides) {
    assert.match(llms, new RegExp(`https://sync\\.magla\\.ru/en/${slug}/`));
  }
});

test("llms.txt does not present a repository release as a store-public version", () => {
  assert.doesNotMatch(llms, /Chrome Web Store[^\n]*v1\.2\.3/);
  assert.doesNotMatch(llms, /Mozilla Add-ons[^\n]*v1\.2\.3/);
});
