/**
 * Install `@luc/ui` from a git ref, in a directory that has never seen this
 * repository, and use it the way a consumer does.
 *
 * This is the proof the release artifact exists for. It is deliberately not
 * satisfied by any of the weaker things that look like it:
 *
 *   · it does not read `packages/ui/dist` — it installs through pnpm from a git
 *     ref, so the bytes come from that commit and not from this working tree;
 *   · it adds no `onlyBuiltDependencies` entry for `@luc/ui` and sets no
 *     `dangerouslyAllowAllBuilds`, so a release that needed an install-time
 *     build script would fail here rather than pass by being allow-listed;
 *   · it asserts that the installed tree has no `src/` and no `scripts`, which
 *     is what separates "a git ref of the package" from "the repository".
 *
 *   node scripts/git-consumer.mjs                 # the local `release` tree
 *   node scripts/git-consumer.mjs --remote        # github.com/lucxu495/luc-ui
 *   node scripts/git-consumer.mjs --ref v1.1.0    # a specific tag or sha
 *
 * Local mode builds nothing: it reads the staged `release/` tree, commits it to
 * a throwaway repository and tags it, which exercises the same fetch path pnpm
 * uses for GitHub — clone, check out the ref, read the root manifest.
 */

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { reportInstalledPackage, verifyInstalledPackage } from "./lib/consumer-fixture.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, "..");
const repoRoot = path.resolve(pkgDir, "../..");
const staging = path.join(repoRoot, "release");

const remote = process.argv.includes("--remote");
const refIndex = process.argv.indexOf("--ref");
const version = JSON.parse(await readFile(path.join(pkgDir, "package.json"), "utf8")).version;
const tag = refIndex === -1 ? `v${version}` : process.argv[refIndex + 1];

const temporary = await mkdtemp(path.join(tmpdir(), "luc-ui-git-consumer-"));
const keep = process.env.LUC_KEEP_GIT_FIXTURE === "1";

const git = (args, cwd) => run("git", args, { cwd, maxBuffer: 16 * 1024 * 1024 });

/** A throwaway repository whose only commit is the staged release tree. */
async function localArtifact() {
  const source = path.join(temporary, "artifact");
  if (!(await stat(path.join(staging, "package.json")).catch(() => undefined))) {
    throw new Error(
      `no release tree at ${path.relative(repoRoot, staging)}/ — run \`pnpm --filter @luc/ui release:build\` first`,
    );
  }
  // Copied rather than committed in place: `release/` is a build output on
  // `main` and must never be added to that branch's history.
  await mkdir(source, { recursive: true });
  await run("cp", ["-R", `${staging}/.`, source]);
  await git(["init", "-q", "-b", "main", "."], source);
  await git(["add", "-A"], source);
  await git(
    ["-c", "user.email=release@luc.invalid", "-c", "user.name=LUC UI release", "commit", "-qm", `@luc/ui ${version}`],
    source,
  );
  await git(["tag", tag], source);
  const commit = (await git(["rev-parse", "HEAD"], source)).stdout.trim();
  return { spec: `git+file://${source}#${tag}`, commit, label: `local git ref ${tag}` };
}

function remoteArtifact() {
  return { spec: `github:lucxu495/luc-ui#${tag}`, commit: null, label: `github:lucxu495/luc-ui#${tag}` };
}

try {
  const artifact = remote ? remoteArtifact() : await localArtifact();
  const fixture = path.join(temporary, "consumer");
  await mkdir(fixture, { recursive: true });

  /*
   * The fixture declares build-script permission for the tooling it uses —
   * Tailwind's and Vite's native helpers — and for nothing else. `@luc/ui` is
   * absent from that list on purpose: if the release needed a `prepare` script,
   * this install would fail with ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED, which is
   * exactly the friction the release artifact is built to remove.
   */
  await writeFile(
    path.join(fixture, "package.json"),
    `${JSON.stringify(
      {
        name: "luc-ui-git-consumer-proof",
        private: true,
        type: "module",
        dependencies: { "@luc/ui": artifact.spec },
        devDependencies: {
          "@tailwindcss/cli": "4.3.3",
          "@types/react": "19.3.0",
          "@types/react-dom": "19.3.0",
          react: "19.3.0",
          "react-dom": "19.3.0",
          tailwindcss: "4.3.3",
          typescript: "5.9.3",
          vite: "8.3.1",
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    path.join(fixture, "pnpm-workspace.yaml"),
    /*
     * `strictDepBuilds: false` so that a transitive package with an unused
     * postinstall (`@parcel/watcher`, which tailwindcss pulls in for `--watch`
     * and this fixture never uses) is reported instead of failing the install.
     * That turns the run into a *list* to assert against, which is a sharper
     * check than "the install exited 0": `@luc/ui` must not appear in it.
     */
    'strictDepBuilds: false\nallowBuilds:\n  "@tailwindcss/oxide": true\n  esbuild: true\n',
  );

  const installed = await run("pnpm", ["install", "--prefer-offline"], {
    cwd: fixture,
    maxBuffer: 16 * 1024 * 1024,
    timeout: 600_000,
  });
  console.log(`git consumer: ${artifact.label}`);
  console.log(`  spec ${artifact.spec}`);
  const log = `${installed.stdout}${installed.stderr}`;
  if (log.includes("ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED")) {
    throw new Error("pnpm refused to install: the artifact carries a prepare script");
  }
  const ignored = log.match(/Ignored build scripts: ([^\n]*)/)?.[1] ?? "(none)";
  console.log(`  build scripts pnpm skipped: ${ignored}`);
  if (ignored.includes("@luc/ui")) throw new Error("@luc/ui was listed as needing a build script");

  const lock = await readFile(path.join(fixture, "pnpm-lock.yaml"), "utf8");
  const pinned = lock.match(/resolution: \{commit: ([0-9a-f]{40})/)?.[1] ?? null;
  console.log(`  lockfile pins ${pinned ?? "(no commit recorded)"}`);
  if (!pinned) throw new Error("a git install recorded no commit in the lockfile");
  if (artifact.commit && pinned !== artifact.commit) {
    throw new Error(`the lockfile pinned ${pinned} but the artifact is ${artifact.commit}`);
  }

  reportInstalledPackage("git consumer", await verifyInstalledPackage(fixture, { expectNoInstallScripts: true }));
  if (keep) console.log(`  fixture kept at ${fixture}`);
} finally {
  if (!keep) await rm(temporary, { recursive: true, force: true });
}
