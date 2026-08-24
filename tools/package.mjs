import { access, mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "manifest.json", "background.js", "shared/core.js",
  "content/content.js", "content/content.css",
  "popup/popup.html", "popup/popup.js", "popup/popup.css",
  "dashboard/dashboard.html", "dashboard/dashboard.js", "dashboard/dashboard.css",
  "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png"
];

for (const file of required) await access(resolve(root, file));
const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
if (manifest.manifest_version !== 3) throw new Error("Manifest V3 is required.");
if (!manifest.permissions.every((permission) => ["storage"].includes(permission))) throw new Error("Unexpected extension permission.");
if (manifest.content_security_policy) throw new Error("Custom CSP is not expected in the free edition.");
console.log(`PASS package checks · MaglaSync ${manifest.version} · ${required.length} required files`);

if (process.argv.includes("--check")) process.exit(0);
await mkdir(resolve(root, "dist"), { recursive: true });
const output = resolve(root, `dist/maglasync-free-v${manifest.version}.zip`);
await rm(output, { force: true });
const result = spawnSync("zip", ["-q", "-r", output, ...required], { cwd: root, encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr || "zip failed");
console.log(`Built ${output}`);

