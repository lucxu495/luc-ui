/*
 * The Showcase's unit tests, run by the library's own Vitest.
 *
 * Why not a runner in `apps/showcase`: adding one would mean a second
 * dependency tree (vitest, jsdom, the React plugin, testing-library) duplicating
 * what this package already installs and pins. Running them here keeps one
 * resolved version of each, and the test files still live beside the code they
 * cover.
 *
 * The tests are pure-logic and component-level: the documentation registry,
 * code generation, the installation and AI prompt builders, and the Playground
 * adapters. Browser behaviour is Playwright's job, not this config's.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const showcaseRoot = fileURLToPath(new URL("../../apps/showcase", import.meta.url));
const packageRoot = fileURLToPath(new URL(".", import.meta.url));

/*
 * Aliases are derived from this package's own `exports` map rather than listed
 * by hand, so a test that imports `@luc/ui/experiences` resolves to exactly the
 * source the Showcase imports — and a new subpath is testable the moment the
 * package publishes it. A hand-written list would silently drift into testing
 * the wrong module.
 */
const packageJson = JSON.parse(readFileSync(`${packageRoot}package.json`, "utf8")) as {
  exports: Record<string, string>;
};
const subpathAliases = Object.entries(packageJson.exports)
  .filter(([key]) => key.startsWith("./") && key.endsWith(".ts"))
  .flatMap(([key, target]) => {
    const specifier = key === "./index" ? "@luc/ui" : `@luc/ui/${key.slice(2, -3)}`;
    return [{ find: specifier, replacement: `${packageRoot}${target.slice(2)}` }];
  });

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...subpathAliases,
      "@": showcaseRoot,
    },
  },
  test: {
    root: showcaseRoot,
    environment: "jsdom",
    globals: false,
    restoreMocks: true,
    setupFiles: [fileURLToPath(new URL("./vitest.setup.ts", import.meta.url))],
    /*
     * Two directories on purpose. `tests/unit` is the behaviour of one module;
     * `tests/audit` is a property of the whole documentation surface — the
     * coverage inventory that proves every generated page has a real specimen
     * and that no page's code contradicts its preview. Both are unit-fast, but
     * they fail for different reasons, and the distinction survives in the
     * output.
     */
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/audit/**/*.test.{ts,tsx}"],
  },
});
