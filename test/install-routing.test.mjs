import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const page of ["site/install/index.html", "site/en/install/index.html"]) {
  test(`${page} keeps both signed-store routes and local-only recommendation`, async () => {
    const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");

    assert.match(html, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
    assert.match(html, /addons\.mozilla\.org\/addon\/maglasync-free/);
    assert.match(html, /navigator\.userAgent/);
    assert.match(html, /#firefox-store/);
    assert.match(html, /#chrome-store/);

    assert.doesNotMatch(html, /\bfetch\s*\(/);
    assert.doesNotMatch(html, /XMLHttpRequest/);
    assert.doesNotMatch(html, /sendBeacon/);
    assert.doesNotMatch(html, /localStorage/);
    assert.doesNotMatch(html, /sessionStorage/);
    assert.doesNotMatch(html, /downloads\/[^"]+\.zip/);
  });
}
