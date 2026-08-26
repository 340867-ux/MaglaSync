import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const archive = resolve(root, "dist", `maglasync-free-firefox-v${manifest.version}.zip`);
const work = await mkdtemp(resolve(tmpdir(), "maglasync-firefox-lint-"));
const source = resolve(work, "extension");

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", stdio: "inherit", env });
  if (result.status !== 0) throw new Error(`${command} failed with status ${result.status}.`);
}

try {
  run(process.execPath, [resolve(root, "tools/package.mjs"), "--firefox-only"]);
  run("unzip", ["-q", archive, "-d", source]);
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  run(
    npx,
    ["--yes", "web-ext@10.6.0", "lint", "--source-dir", source, "--warnings-as-errors"],
    { ...process.env, NPM_CONFIG_CACHE: resolve(tmpdir(), "maglasync-npm-cache") }
  );
  console.log(`PASS Firefox AMO lint · web-ext 10.6.0 · MaglaSync ${manifest.version}`);
} finally {
  await rm(work, { recursive: true, force: true });
}
