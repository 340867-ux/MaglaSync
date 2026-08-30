import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const popupSource = await readFile(new URL("../popup/popup.js", import.meta.url), "utf8");
const popupHtml = await readFile(new URL("../popup/popup.html", import.meta.url), "utf8");

test("popup initializes extension API before first render", () => {
  const apiDeclaration = popupSource.indexOf("const extensionApi = globalThis.browser ?? globalThis.chrome;");
  const renderCall = popupSource.lastIndexOf("render();");
  assert.notEqual(apiDeclaration, -1);
  assert.notEqual(renderCall, -1);
  assert.ok(apiDeclaration < renderCall, "extensionApi must be initialized before render() executes");
});

test("share loop is explicit and user-triggered", () => {
  assert.match(popupHtml, /id="share"/);
  assert.match(popupSource, /#share/);
  assert.match(popupSource, /addEventListener\("click", shareMaglaSync\)/);
  assert.doesNotMatch(popupSource, /setInterval\([^)]*shareMaglaSync/);
  assert.doesNotMatch(popupSource, /setTimeout\([^)]*shareMaglaSync/);
});
