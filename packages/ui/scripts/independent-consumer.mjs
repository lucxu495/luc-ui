/** Install the packed artifact in a fresh directory outside the workspace. */
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePack } from "./lib/pack.mjs";
import { reportInstalledPackage, verifyInstalledPackage } from "./lib/consumer-fixture.mjs";

const run = promisify(execFile);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tarball = await ensurePack(packageRoot);
const fixture = await mkdtemp(path.join(tmpdir(), "luc-ui-independent-"));
const keep = process.env.LUC_KEEP_INDEPENDENT_FIXTURE === "1";

async function command(bin, args) {
  const result = await run(bin, args, { cwd: fixture, maxBuffer: 12 * 1024 * 1024, timeout: 180000 });
  return `${result.stdout}${result.stderr}`;
}

try {
  await writeFile(path.join(fixture, "package.json"), JSON.stringify({ name: "luc-ui-independent-proof", private: true, type: "module" }));
  await command("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball,
    "react@19.3.0", "react-dom@19.3.0", "typescript@5.9.3", "tailwindcss@4.3.3", "@tailwindcss/cli@4.3.3", "vite@8.3.1", "@types/react@19.3.0", "@types/react-dom@19.3.0"]);

  console.log(`independent consumer: ${path.basename(tarball)} (npm install, no workspace, ${path.basename(fixture)})`);
  reportInstalledPackage("independent consumer", await verifyInstalledPackage(fixture));
} finally {
  if (!keep) await rm(fixture, { recursive: true, force: true });
  else console.log(`fixture kept at ${fixture}`);
}
