import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const guides = [
  "ai-chat-memory",
  "ai-project-memory",
  "chatgpt-loses-context",
  "chatgpt-memory-extension",
  "chatgpt-to-claude",
  "claude-memory"
];

for (const slug of guides) {
  test(`organic guide ${slug} is canonical and store-first`, async () => {
    const html = await readFile(new URL(`../site/en/${slug}/index.html`, import.meta.url), "utf8");
    assert.match(html, new RegExp(`https://sync\\.magla\\.ru/en/${slug}/`));
    assert.match(html, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
    assert.match(html, /addons\.mozilla\.org\/addon\/maglasync-free/);
    assert.doesNotMatch(html, /downloads\/[^"]+\.zip/);
  });
}

test("sitemap indexes every organic guide", async () => {
  const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");
  for (const slug of guides) {
    assert.match(sitemap, new RegExp(`<loc>https://sync\\.magla\\.ru/en/${slug}/</loc>`));
  }
});
