import { access, chmod, cp, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const firefoxOnly = process.argv.includes("--firefox-only");
const common = [
  "background.js", "shared/core.js",
  "content/content.js", "content/content.css",
  "popup/popup.html", "popup/popup.js", "popup/popup.css",
  "dashboard/dashboard.html", "dashboard/dashboard.js", "dashboard/dashboard.css",
  "icons/icon16.png", "icons/icon32.png", "icons/icon48.png", "icons/icon128.png"
];
const chromiumFiles = ["manifest.json", ...common];
const safariExtras = ["PRIVACY.md", "platform/safari/README.md"];
const firefoxSourceFiles = [
  "package.json", "manifest.json", "platform/firefox/manifest.json",
  "platform/firefox/SOURCE_SUBMISSION.md", "tools/package.mjs", ...common
];
const storeKitFiles = [
  "docs/CHROME_WEB_STORE_SUBMISSION_RU.md",
  "assets/store/screenshot-chat-sync.png", "assets/store/screenshot-dashboard.png",
  "assets/store/promo-small.png", "assets/store/promo-marquee.png",
  "icons/icon128.png", "PRIVACY.md"
];

const requiredFiles = firefoxOnly
  ? firefoxSourceFiles
  : [...chromiumFiles, "platform/firefox/manifest.json", "platform/firefox/SOURCE_SUBMISSION.md", ...safariExtras, ...storeKitFiles];
for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const chromiumManifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const firefoxManifest = JSON.parse(await readFile(resolve(root, "platform/firefox/manifest.json"), "utf8"));
if (chromiumManifest.manifest_version !== 3) throw new Error("Chromium Manifest V3 is required.");
if (firefoxManifest.manifest_version !== 2) throw new Error("Firefox Android package must use its event-page manifest.");
if (chromiumManifest.version !== firefoxManifest.version) throw new Error("Platform manifest versions differ.");
if (!chromiumManifest.permissions.every((permission) => permission === "storage")) throw new Error("Unexpected Chromium extension permission.");
if (chromiumManifest.content_security_policy) throw new Error("Custom CSP is not expected in the free edition.");
if (firefoxManifest.browser_specific_settings?.gecko?.strict_min_version !== "140.0") {
  throw new Error("Firefox desktop must start at the built-in consent floor (140.0).");
}
if (firefoxManifest.browser_specific_settings?.gecko_android?.strict_min_version !== "142.0") {
  throw new Error("Firefox Android must start at the built-in consent floor (142.0).");
}
const firefoxDataDeclaration = firefoxManifest.browser_specific_settings?.gecko?.data_collection_permissions;
if (JSON.stringify(firefoxDataDeclaration) !== JSON.stringify({ required: ["none"] })) {
  throw new Error("Firefox must declare the exact no-data-collection permission.");
}

const forbiddenRuntimePatterns = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["sendBeacon", /\bnavigator\.sendBeacon\b/],
  ["EventSource", /\bEventSource\b/],
  ["remote script", /<script[^>]+src=["']https?:\/\//i],
  ["eval", /\beval\s*\(/],
  ["Function constructor", /\bnew\s+Function\s*\(/]
];

async function verifyRuntime(files, base = root) {
  const textFiles = files.filter((file) => /\.(?:js|html|css|json)$/.test(file));
  for (const file of textFiles) {
    const source = await readFile(resolve(base, file), "utf8");
    for (const [label, pattern] of forbiddenRuntimePatterns) {
      if (pattern.test(source)) throw new Error(`Forbidden runtime primitive (${label}) in ${file}.`);
    }
  }
  return textFiles.length;
}

function stripImports(source) {
  return source.replace(/^import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];\s*/m, "");
}

function stripExports(source) {
  return source.replace(/^export\s+/gm, "");
}

async function copyFiles(files, target) {
  for (const file of files) {
    const destination = resolve(target, file);
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(root, file), destination);
  }
}

async function normalizePackageTimes(directory) {
  const fixedTime = new Date("1980-01-01T00:00:00.000Z");
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await normalizePackageTimes(path);
    else {
      await chmod(path, 0o644);
      await utimes(path, fixedTime, fixedTime);
    }
  }
}

async function zipDirectory(source, output) {
  await normalizePackageTimes(source);
  const result = spawnSync("zip", ["-q", "-X", "-D", "-r", output, "."], { cwd: source, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `zip failed for ${basename(output)}`);
}

const checkedFiles = await verifyRuntime(chromiumFiles);
console.log(`PASS package checks · MaglaSync ${chromiumManifest.version} · Chromium MV3 + Firefox event page`);
console.log(`PASS offline boundary · ${checkedFiles} runtime text files`);

if (process.argv.includes("--check")) process.exit(0);

const dist = resolve(root, "dist");
await mkdir(dist, { recursive: true });
const work = await mkdtemp(resolve(tmpdir(), "maglasync-package-"));
try {
  const chromiumDir = resolve(work, "chromium");
  const chromiumOutput = resolve(dist, `maglasync-free-chromium-v${chromiumManifest.version}.zip`);
  const safariPreservedOutput = resolve(dist, `maglasync-free-chromium-v${chromiumManifest.version}.zip.keep`);
  const legacyOutput = resolve(dist, `maglasync-free-v${chromiumManifest.version}.zip`);
  if (!firefoxOnly) {
    await copyFiles(chromiumFiles, chromiumDir);
    await rm(chromiumOutput, { force: true });
    await rm(safariPreservedOutput, { force: true });
    await rm(legacyOutput, { force: true });
    await zipDirectory(chromiumDir, chromiumOutput);
    await cp(chromiumOutput, safariPreservedOutput);
    await cp(chromiumOutput, legacyOutput);
  }

  const coreSource = stripExports(await readFile(resolve(root, "shared/core.js"), "utf8"));
  const backgroundSource = stripImports(await readFile(resolve(root, "background.js"), "utf8"));
  const dashboardSource = stripImports(await readFile(resolve(root, "dashboard/dashboard.js"), "utf8"));
  const firefoxDir = resolve(work, "firefox");
  await copyFiles(common.filter((file) => !["background.js", "shared/core.js", "dashboard/dashboard.js"].includes(file)), firefoxDir);
  await cp(resolve(root, "platform/firefox/manifest.json"), resolve(firefoxDir, "manifest.json"));
  await writeFile(resolve(firefoxDir, "background.bundle.js"), `${coreSource}\n\n${backgroundSource}`);
  await writeFile(resolve(firefoxDir, "dashboard/dashboard.bundle.js"), `${coreSource}\n\n${dashboardSource}`);
  const dashboardHtmlPath = resolve(firefoxDir, "dashboard/dashboard.html");
  const dashboardHtml = (await readFile(dashboardHtmlPath, "utf8"))
    .replace('<script type="module" src="dashboard.js"></script>', '<script src="dashboard.bundle.js"></script>');
  await writeFile(dashboardHtmlPath, dashboardHtml);
  await verifyRuntime([
    "manifest.json", "background.bundle.js", "content/content.js", "content/content.css",
    "popup/popup.html", "popup/popup.js", "popup/popup.css",
    "dashboard/dashboard.html", "dashboard/dashboard.bundle.js", "dashboard/dashboard.css"
  ], firefoxDir);
  for (const script of ["background.bundle.js", "dashboard/dashboard.bundle.js"]) {
    const syntax = spawnSync(process.execPath, ["--check", resolve(firefoxDir, script)], { encoding: "utf8" });
    if (syntax.status !== 0) throw new Error(syntax.stderr || `Firefox bundle syntax failed: ${script}`);
  }
  const firefoxOutput = resolve(dist, `maglasync-free-firefox-v${chromiumManifest.version}.zip`);
  await rm(firefoxOutput, { force: true });
  await zipDirectory(firefoxDir, firefoxOutput);

  const firefoxSourceDir = resolve(work, "firefox-source");
  await copyFiles(firefoxSourceFiles, firefoxSourceDir);
  await cp(
    resolve(root, "platform/firefox/SOURCE_SUBMISSION.md"),
    resolve(firefoxSourceDir, "README.md")
  );
  const firefoxSourceOutput = resolve(dist, `maglasync-free-firefox-source-v${chromiumManifest.version}.zip`);
  await rm(firefoxSourceOutput, { force: true });
  await zipDirectory(firefoxSourceDir, firefoxSourceOutput);

  const safariOutput = resolve(dist, `maglasync-free-safari-source-v${chromiumManifest.version}.zip`);
  const storeKitOutput = resolve(dist, `maglasync-chrome-store-submission-kit-v${chromiumManifest.version}.zip`);
  if (!firefoxOnly) {
    const safariDir = resolve(work, "safari-source");
    await copyFiles([...chromiumFiles, ...safariExtras], safariDir);
    await rm(safariOutput, { force: true });
    await zipDirectory(safariDir, safariOutput);

    const storeKitDir = resolve(work, "chrome-store-kit");
    await mkdir(resolve(storeKitDir, "03-store-assets"), { recursive: true });
    await cp(chromiumOutput, resolve(storeKitDir, "01-upload-to-chrome-web-store.zip"));
    await cp(resolve(root, "docs/CHROME_WEB_STORE_SUBMISSION_RU.md"), resolve(storeKitDir, "02-field-by-field-ru.md"));
    for (const file of [
      "screenshot-chat-sync.png", "screenshot-dashboard.png", "promo-small.png", "promo-marquee.png"
    ]) {
      await cp(resolve(root, "assets/store", file), resolve(storeKitDir, "03-store-assets", file));
    }
    await cp(resolve(root, "icons/icon128.png"), resolve(storeKitDir, "03-store-assets/icon128.png"));
    await cp(resolve(root, "PRIVACY.md"), resolve(storeKitDir, "04-privacy-policy.md"));
    await rm(storeKitOutput, { force: true });
    await zipDirectory(storeKitDir, storeKitOutput);
  }

  if (!firefoxOnly) {
    console.log(`Built ${chromiumOutput}`);
    console.log(`Built ${safariPreservedOutput}`);
  }
  console.log(`Built ${firefoxOutput}`);
  console.log(`Built ${firefoxSourceOutput}`);
  if (!firefoxOnly) {
    console.log(`Built ${safariOutput}`);
    console.log(`Built ${storeKitOutput}`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
