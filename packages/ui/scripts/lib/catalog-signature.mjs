/**
 * Make serialized TypeScript signatures machine-independent.
 *
 * Why this exists
 * ---------------
 * `generate-catalog.mjs` records `checker.typeToString(...)` output as the
 * public signature of every exported symbol. When a type lives in an external
 * package that the declaring file does not import by name, the TypeScript
 * printer falls back to a *resolved filesystem path* for the module reference:
 *
 *   ({ ... }: DataTableProps<TData>) => import("/Users/luc/.../node_modules/.pnpm/
 *   @types+react@19.3.0/node_modules/@types/react/index").JSX.Element
 *
 * That path depends on the machine, the home directory and the pnpm store
 * layout — and because the signature is truncated to a fixed character budget,
 * even the truncation point moved with the path length. The committed catalog
 * therefore "drifted" on every machine except the one that produced it.
 *
 * The fix is a deterministic, platform-neutral rewrite of *quoted absolute
 * module specifiers* before truncation:
 *
 *   /Users/…/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index
 *   /home/…/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index
 *   C:\…\node_modules\.pnpm\@types+react@19.3.0\node_modules\@types\react\index
 *      -> "@types/react"
 *
 * Module identity is preserved (package name, and any subpath the printer
 * chose); only the machine-specific prefix, the `.pnpm` store encoding, the
 * version segment and a trailing `/index` or declaration extension are removed.
 * Relative and bare specifiers are never touched.
 */

const DECLARATION_EXTENSION = /\.d\.(?:ts|mts|cts)$/i;
const NODE_MODULES_MARKER = "/node_modules/";

/** Strip a declaration extension and a conventional trailing `/index`. */
function stripIndexAndExtension(value) {
  let out = value.replace(DECLARATION_EXTENSION, "");
  out = out.replace(/\/index$/i, "");
  return out;
}

function toPosix(value) {
  return value.replaceAll("\\", "/");
}

function isAbsolute(value) {
  return value.startsWith("/") || /^[A-Za-z]:\//.test(value);
}

/**
 * Rewrite one module specifier into a stable, machine-independent form.
 *
 * @param {string} specifier raw specifier as printed by the type checker
 * @param {{ uiRoot?: string }} [options] workspace root used for repo-internal paths
 * @returns {string}
 */
export function normalizeModuleSpecifier(specifier, options = {}) {
  const normalized = toPosix(specifier);
  if (!isAbsolute(normalized)) return specifier;

  const root = options.uiRoot ? toPosix(options.uiRoot).replace(/\/+$/, "") : undefined;
  const markerIndex = normalized.lastIndexOf(NODE_MODULES_MARKER);

  let stable;
  if (markerIndex !== -1) {
    // Everything after the *last* node_modules is the package the type came
    // from: this drops the pnpm store prefix and its version segment.
    stable = normalized.slice(markerIndex + NODE_MODULES_MARKER.length);
  } else if (root && (normalized === root || normalized.startsWith(`${root}/`))) {
    stable = normalized.slice(root.length).replace(/^\/+/, "");
  } else {
    // Last resort: never leak a machine path, keep the file identity.
    stable = normalized.slice(normalized.lastIndexOf("/") + 1);
  }

  stable = stripIndexAndExtension(stable);
  if (!stable) stable = normalized.slice(normalized.lastIndexOf("/") + 1);
  return stable;
}

/**
 * Rewrite every quoted absolute module specifier in a serialized signature.
 *
 * @param {string} text signature as produced by the type checker
 * @param {{ uiRoot?: string }} [options]
 * @returns {string}
 */
export function normalizeSignature(text, options = {}) {
  return text.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
    const replacement = normalizeModuleSpecifier(inner, options);
    return replacement === inner ? match : `"${replacement}"`;
  });
}

/**
 * Machine-specific path shapes that must never appear in generated output.
 *
 * Deliberately narrow: real filesystem roots, not generic slashes, and a drive
 * letter that is not the tail of a URL scheme (`https://` must not match). It
 * cannot be tripped by a legitimate specifier such as `@types/react` or by a
 * URL literal type such as `"https://s3.tradingview.com"`.
 */
export const ABSOLUTE_PATH_PATTERNS = [
  /\/(?:Users|home|root|var|tmp|mnt|opt|srv|Volumes|private)\//,
  /(?:^|[^A-Za-z0-9])([A-Za-z]:[\\/])/,
];

/** @returns {string[]} the machine-path fragments found in `value` */
export function findAbsolutePaths(value) {
  const found = [];
  for (const pattern of ABSOLUTE_PATH_PATTERNS) {
    const match = pattern.exec(value);
    if (match) found.push(match[1] ?? match[0]);
  }
  return found;
}

/**
 * Throw if any generated signature or source field still carries a machine path.
 * A guard, not a formatter: it must fail loudly rather than emit a leaking file.
 *
 * @param {{ entries: Record<string, { exports?: { name: string, signature: string, source?: string }[] }> }} catalog
 */
export function assertNoAbsolutePaths(catalog) {
  const offenders = [];
  for (const [key, entry] of Object.entries(catalog.entries)) {
    for (const symbol of entry.exports ?? []) {
      for (const field of ["signature", "source"]) {
        const value = symbol[field];
        if (typeof value !== "string") continue;
        const found = findAbsolutePaths(value);
        if (found.length) offenders.push(`${key}: ${symbol.name}.${field} contains ${found.join(", ")}`);
      }
    }
  }
  if (offenders.length) {
    throw new Error(`catalog: machine-specific absolute paths in generated output:\n${offenders.slice(0, 10).join("\n")}`);
  }
}

/**
 * Regression fixtures for the path rewrite.
 *
 * The first group is the determinism contract: the same package resolved
 * through a macOS pnpm store, a Linux pnpm store and a Windows pnpm store must
 * normalize to exactly the same specifier. The rest pin the subpath, extension
 * and non-node_modules behaviour.
 */
export const PATH_FIXTURES = [
  {
    label: "macOS pnpm store",
    specifier: "/Users/luc/Documents/luc/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index",
    expected: "@types/react",
  },
  {
    label: "Linux pnpm store",
    specifier: "/home/luc/code/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index",
    expected: "@types/react",
  },
  {
    label: "Windows pnpm store",
    specifier: "C:\\Users\\luc\\Documents\\luc\\luc-quant\\node_modules\\.pnpm\\@types+react@19.3.0\\node_modules\\@types\\react\\index",
    expected: "@types/react",
  },
  {
    label: "pnpm store with peer suffix and subpath",
    specifier:
      "/home/luc/code/luc-quant/node_modules/.pnpm/@tanstack+react-table@9.2.4_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@tanstack/react-table/dist/useTable",
    expected: "@tanstack/react-table/dist/useTable",
  },
  {
    label: "hoisted node_modules",
    specifier: "/home/luc/code/luc-quant/node_modules/@tanstack/react-table/dist/useTable",
    expected: "@tanstack/react-table/dist/useTable",
  },
  {
    label: "declaration extension",
    specifier: "/home/luc/code/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index.d.ts",
    expected: "@types/react",
  },
  {
    label: "nested node_modules wins",
    specifier: "/repo/node_modules/.pnpm/a@1.0.0/node_modules/a/node_modules/b/dist/index",
    expected: "b/dist",
  },
  {
    label: "workspace-internal absolute path",
    /*
     * The workspace prefix is `$UI_ROOT` rather than a literal path.
     *
     * The point of this fixture is that a path *inside the workspace* normalizes
     * relative to the workspace, and the workspace is wherever this checkout is.
     * Written as a literal it only held on the machine that wrote it: on a
     * different checkout the prefix did not match, the rewrite fell through to
     * "keep the last segment", and `catalog:generate`, `catalog:check` and
     * `verify:package` all failed with `expected "packages/ui/src/…", got
     * "types"` before generating anything.
     */
    specifier: "$UI_ROOT/packages/ui/src/charts/core/types",
    expected: "packages/ui/src/charts/core/types",
  },
  {
    label: "bare specifier is untouched",
    specifier: "react",
    expected: "react",
  },
  {
    label: "relative specifier is untouched",
    specifier: "./charts/core/types",
    expected: "./charts/core/types",
  },
];

/**
 * Run the fixtures. Called by the generator on every invocation (generate,
 * `--check`, `--self-test`) so the standing verification gate exercises them.
 *
 * @param {string} uiRoot
 * @returns {number} number of fixtures checked
 */
export function runPathFixtures(uiRoot) {
  for (const fixture of PATH_FIXTURES) {
    /* `$UI_ROOT` is this checkout's own prefix; see the fixture's note. */
    const specifier = fixture.specifier.replace("$UI_ROOT", toPosix(uiRoot));
    const actual = normalizeModuleSpecifier(specifier, { uiRoot });
    if (actual !== fixture.expected) {
      throw new Error(
        `catalog fixture "${fixture.label}": expected ${JSON.stringify(fixture.expected)}, got ${JSON.stringify(actual)}`,
      );
    }
  }

  const crossPlatform = PATH_FIXTURES.filter((fixture) =>
    ["macOS pnpm store", "Linux pnpm store", "Windows pnpm store"].includes(fixture.label),
  ).map((fixture) => normalizeModuleSpecifier(fixture.specifier, { uiRoot }));
  if (new Set(crossPlatform).size !== 1) {
    throw new Error(`catalog fixture: pnpm store layouts are not normalized identically (${crossPlatform.join(" | ")})`);
  }

  return PATH_FIXTURES.length;
}
