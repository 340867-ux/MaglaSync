# MaglaSync Firefox reviewer source

This source archive rebuilds the exact Firefox extension ZIP submitted to Mozilla Add-ons.

## Build environment

- Linux or macOS
- Node.js 22.x
- Info-ZIP `zip` 3.0

MaglaSync has no third-party runtime dependency and this build does not run `npm install`.

## Exact build command

Run from the root of this source archive:

```bash
node tools/package.mjs --firefox-only
```

The submitted extension is written to:

```text
dist/maglasync-free-firefox-v1.2.1.zip
```

The build is deterministic: it copies the reviewed runtime files, removes the ES module import/export markers from the local source, concatenates `shared/core.js` with the background and dashboard entry points, normalizes file permissions and timestamps, and creates the ZIP with Info-ZIP metadata stripping enabled.

No code is minified, obfuscated, fetched, generated remotely, or downloaded during the build. The generated `background.bundle.js` and `dashboard/dashboard.bundle.js` remain human-readable.

For the same AMO lint used in CI, run after the build:

```bash
npx --yes web-ext@10.6.0 lint \
  --source-dir path/to/unzipped-extension \
  --warnings-as-errors
```
