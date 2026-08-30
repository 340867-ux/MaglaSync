import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/store-submit.yml", import.meta.url), "utf8");

test("store submission is manual and explicitly confirmed", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n\s*push:/);
  assert.match(workflow, /confirm input must be exactly SUBMIT/);
});

test("Chrome submission uses Web Store API v2 and the published extension id", () => {
  assert.match(workflow, /hhcmedgckaedhlegpgphflmmmhfaegpi/);
  assert.match(workflow, /BASE="https:\/\/chromewebstore\.googleapis\.com"/);
  assert.match(workflow, /UPLOAD_URL="\$BASE\/upload\/v2\/publishers\//);
  assert.match(workflow, /STATUS_URL="\$BASE\/v2\/publishers\//);
  assert.match(workflow, /chromewebstore\.googleapis\.com\/v2\/publishers\/\$PUBLISHER_ID\/items\/\$CHROME_EXTENSION_ID:publish/);
  assert.match(workflow, /CWS_REFRESH_TOKEN/);
  assert.match(workflow, /CWS_PUBLISHER_ID/);
});

test("Firefox submission is listed-channel and credential-gated", () => {
  assert.match(workflow, /web-ext@10\.6\.0 sign/);
  assert.match(workflow, /--channel listed/);
  assert.match(workflow, /AMO_JWT_ISSUER/);
  assert.match(workflow, /AMO_JWT_SECRET/);
  assert.match(workflow, /maglasync@magla\.ru/);
  assert.match(workflow, /--upload-source-code/);
});
