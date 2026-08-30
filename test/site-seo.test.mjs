import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const crossBrowserGuides = [
  "ai-chat-memory",
  "ai-project-memory",
  "chatgpt-loses-context",
  "chatgpt-memory-extension",
  "chatgpt-to-claude",
  "claude-memory",
  "move-ai-chat-between-chatgpt-claude-gemini",
  "new-chat-before-context-is-lost"
];

const chromiumGuides = [
  "maglasync-for-edge",
  "maglasync-for-brave"
];

for (const slug of crossBrowserGuides) {
  test(`organic guide ${slug} is canonical and store-first`, async () => {
    const html = await readFile(new URL(`../site/en/${slug}/index.html`, import.meta.url), "utf8");
    assert.match(html, new RegExp(`https://sync\\.magla\\.ru/en/${slug}/`));
    assert.match(html, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
    assert.match(html, /addons\.mozilla\.org\/addon\/maglasync-free/);
    assert.doesNotMatch(html, /downloads\/[^"]+\.zip/);
  });
}

for (const slug of chromiumGuides) {
  test(`Chromium guide ${slug} is canonical and routes to the signed Chrome listing`, async () => {
    const html = await readFile(new URL(`../site/en/${slug}/index.html`, import.meta.url), "utf8");
    assert.match(html, new RegExp(`https://sync\\.magla\\.ru/en/${slug}/`));
    assert.match(html, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
    assert.doesNotMatch(html, /downloads\/[^"]+\.zip/);
  });
}

test("sitemap indexes every organic guide", async () => {
  const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");
  for (const slug of [...crossBrowserGuides, ...chromiumGuides]) {
    assert.match(sitemap, new RegExp(`<loc>https://sync\\.magla\\.ru/en/${slug}/</loc>`));
  }
});
