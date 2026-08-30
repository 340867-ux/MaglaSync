import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const locales = ["en", "ru", "es", "pt_BR", "de", "fr", "id", "ja", "ko", "hi", "zh_CN", "zh_TW", "ar"];
const chromiumManifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url), "utf8"));
const firefoxManifest = JSON.parse(await readFile(new URL("../platform/firefox/manifest.json", import.meta.url), "utf8"));

test("store identity is localized consistently in Chromium and Firefox", () => {
  for (const manifest of [chromiumManifest, firefoxManifest]) {
    assert.equal(manifest.version, "1.2.4");
    assert.equal(manifest.default_locale, "en");
    assert.equal(manifest.name, "__MSG_extensionName__");
    assert.equal(manifest.description, "__MSG_extensionDescription__");
  }
});

for (const locale of locales) {
  test(`store locale ${locale} is complete and within browser limits`, async () => {
    const messages = JSON.parse(await readFile(new URL(`../_locales/${locale}/messages.json`, import.meta.url), "utf8"));
    const name = messages.extensionName?.message;
    const description = messages.extensionDescription?.message;
    assert.ok(name?.startsWith("MaglaSync Free"));
    assert.ok(description?.includes("ChatGPT"));
    assert.ok(description?.includes("Claude"));
    assert.ok(description?.includes("Gemini"));
    assert.ok([...name].length <= 45, `${locale} name exceeds Chrome's 45-character limit`);
    assert.ok([...description].length <= 132, `${locale} description exceeds Chrome's 132-character limit`);
  });
}

test("localization does not widen Chromium permissions", () => {
  assert.deepEqual(chromiumManifest.permissions, ["storage"]);
});
