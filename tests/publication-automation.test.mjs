import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("verified releases are synchronized and deployed without manual metadata", async () => {
  const [workflow, synchronizer, themes] = await Promise.all([
    readFile(new URL("../.github/workflows/sync-published-themes.yml", import.meta.url), "utf8"),
    readFile(new URL("../tools/sync-published-themes.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/themes.ts", import.meta.url), "utf8"),
  ]);

  assert.match(workflow, /schedule:/);
  assert.doesNotMatch(workflow, /CodexThemeStore\.Cli|setup-dotnet/);
  assert.match(workflow, /dreamskin-verify -- "\$package" macos/);
  assert.match(workflow, /dreamskin-verify -- "\$package" windows/);
  assert.match(workflow, /Install Linux verifier dependencies/);
  assert.match(workflow, /libwebkit2gtk-4\.1-dev/);
  assert.match(workflow, /git push origin HEAD:main/);
  assert.match(workflow, /actions\/deploy-pages@v5/);
  assert.match(synchronizer, /theme-\$\{entry\.id\}-v\$\{catalog\.version\}/);
  assert.match(synchronizer, /createHash\("sha256"\)/);
  assert.match(synchronizer, /asset\.digest/);
  assert.match(themes, /theme\.package\?\.published === true/);
});
