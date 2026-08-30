import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const locales = ["es", "de", "fr", "pt-br"];
const chromeId = "hhcmedgckaedhlegpgphflmmmhfaegpi";
const firefoxPath = "addons.mozilla.org/addon/maglasync-free/";
const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");

for (const locale of locales) {
  test(`${locale} landing page is canonical and store-first`, async () => {
    const html = await readFile(new URL(`../site/${locale}/index.html`, import.meta.url), "utf8");
    assert.match(html, new RegExp(`https://sync\\.magla\\.ru/${locale}/`));
    assert.match(html, new RegExp(chromeId));
    assert.match(html, new RegExp(firefoxPath.replaceAll(".", "\\.")));
    assert.doesNotMatch(html, /\.zip(?:["?#<]|$)/i);
    assert.match(sitemap, new RegExp(`https://sync\\.magla\\.ru/${locale}/`));
  });
}
