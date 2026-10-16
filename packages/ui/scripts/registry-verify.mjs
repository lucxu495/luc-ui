/**
 * Verify the source registry in a clean consumer fixture.
 *
 * "It is a registry" is a claim, and the only way to check a claim about
 * installation is to install. This script:
 *
 *   1. copies the generated items into a fresh temporary project, following the
 *      `path` targets in `registry.json` exactly as a registry client would;
 *   2. writes a consumer module that imports and renders the extracted
 *      components;
 *   3. type-checks that project with the same TypeScript this repository uses;
 *   4. removes the fixture.
 *
 *   node packages/ui/scripts/registry-verify.mjs
 *
 * What this proves, and what it does not — stated here because a verification
 * script is the easiest place in a repository to overstate:
 *
 *   proves      the extracted source compiles standalone: no hidden import of
 *               `../src/...`, no implicit dependency on the monorepo's path
 *               aliases, no missing internal file, and the components still
 *               type-check when used.
 *   does not    prove a styled page. The registry ships source, not the
 *               compiled stylesheet, so a real project still installs
 *               `@luc/ui/styles.css` (or ports the tokens). And it does not
 *               prove every component can be extracted — only the items the
 *               generator declares, which is why the item list is short and
 *               honest rather than aspirational.
 */

import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const registryRoot = path.join(packageRoot, "registry");
const itemsRoot = path.join(registryRoot, "items");

const manifest = JSON.parse(await readFile(path.join(registryRoot, "registry.json"), "utf8"));
const fixture = await mkdtemp(path.join(os.tmpdir(), "luc-registry-fixture-"));

try {
  await mkdir(path.join(fixture, "src"), { recursive: true });
  /* The fixture borrows this package's dependency tree — react, radix-ui, clsx,
   * tailwind-merge, class-variance-authority and their types — which is what a
   * consumer would have installed from `dependencies` in the manifest. */
  await symlink(path.join(packageRoot, "node_modules"), path.join(fixture, "node_modules"), "dir");

  const installed = [];
  for (const item of manifest.items) {
    for (const file of item.files) {
      const from = path.join(itemsRoot, item.name, file.path.replace("components/luc-ui/", ""));
      const to = path.join(fixture, "src", file.path);
      await mkdir(path.dirname(to), { recursive: true });
      await cp(from, to);
      installed.push(file.path);
    }
  }

  await writeFile(
    path.join(fixture, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          esModuleInterop: true,
          resolveJsonModule: true,
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src/**/*.ts", "src/**/*.tsx"],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  /* A consumer that actually uses every extracted component: an unused import
   * would let a broken API slip through the type check. */
  await writeFile(
    path.join(fixture, "src/consumer.tsx"),
    [
      `import { Badge, Tag } from "./components/luc-ui/components/badge";`,
      `import { Skeleton, SkeletonText } from "./components/luc-ui/components/skeleton";`,
      `import { Spinner } from "./components/luc-ui/components/spinner";`,
      ``,
      `export function Consumer() {`,
      `  return (`,
      `    <div className="flex flex-col gap-2">`,
      `      <Badge tone="positive" size="sm">Ready</Badge>`,
      `      <Tag>storage</Tag>`,
      `      <Skeleton className="h-4 w-32" />`,
      `      <SkeletonText lines={2} />`,
      `      <Spinner size={16} label="Loading" />`,
      `      <Spinner size={24} />`,
      `    </div>`,
      `  );`,
      `}`,
      ``,
    ].join("\n"),
    "utf8",
  );

  const tsc = require.resolve("typescript/bin/tsc");
  let output = "";
  let ok = true;
  try {
    await run(process.execPath, [tsc, "-p", path.join(fixture, "tsconfig.json")], {
      cwd: fixture,
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (error) {
    ok = false;
    output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }

  console.log(`  registry items      : ${manifest.items.length}`);
  console.log(`  files installed     : ${installed.length}`);
  console.log(`  fixture             : a clean directory, items copied by their declared targets`);
  console.log(`  typecheck           : ${ok ? "clean" : "FAILED"}`);
  if (!ok) {
    console.error(output.trim());
    process.exit(1);
  }
} finally {
  await rm(fixture, { recursive: true, force: true });
}
