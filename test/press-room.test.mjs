import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const press = await readFile(new URL("../site/en/press/index.html", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../site/sitemap.xml", import.meta.url), "utf8");

test("press room routes reviewers to signed stores and public source", () => {
  assert.match(press, /chromewebstore\.google\.com\/detail\/maglasync-free\/hhcmedgckaedhlegpgphflmmmhfaegpi/);
  assert.match(press, /addons\.mozilla\.org\/addon\/maglasync-free/);
  assert.match(press, /github\.com\/340867-ux\/MaglaSync/);
  assert.match(press, /MaglaSync does not press Send/);
  assert.match(press, /Chats are disconnected by default/);
});

test("press room distinguishes source release from store review", () => {
  assert.match(press, /Current source release<\/strong><p>v1\.2\.4/);
  assert.match(press, /Browser-store review and rollout can lag the source release/);
  assert.doesNotMatch(press, /50,?000 users/i);
  assert.doesNotMatch(press, /best AI memory/i);
});

test("press room is indexed", () => {
  assert.match(sitemap, /https:\/\/sync\.magla\.ru\/en\/press\//);
});
