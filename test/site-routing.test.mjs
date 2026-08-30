import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const page of ["site/index.html", "site/en/index.html"]) {
  test(`${page} routes ordinary users through the signed-store install page`, async () => {
    const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");

    assert.match(html, /href="(?:install\/|\.\/install\/)"/);
    assert.doesNotMatch(
      html,
      /class="button primary"[^>]+href="[^"]*downloads\/[^\"]+\.zip(?:\.keep)?"/,
      "Primary install CTAs must not send ordinary users to a sideload ZIP."
    );
  });
}
