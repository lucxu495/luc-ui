/*
 * Installation, written once.
 *
 * The rule this file exists to enforce: **a page may not invent an install
 * command, and it may not invent a version.** In Phase 9 the package is built,
 * packed and consumed by an external fixture test, but it is not published to a
 * registry. So there are two honest modes, and the UI always says which one the
 * reader is looking at:
 *
 *   git      — the public Git tag that consumers install today.
 *   tarball  — the packed release artifact used for offline and checksum-pinned
 *              installs.
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type DistributionMode = "git" | "tarball";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];
export const PACKAGE_NAME = "@luc/ui";
export const PUBLIC_VERSION = "1.0.1";
export const GIT_SPEC = `${PACKAGE_NAME}@github:lucxu495/luc-ui#v${PUBLIC_VERSION}`;
export const PACKED_TARBALL = `./luc-ui-${PUBLIC_VERSION}.tgz`;

export interface DistributionModeInfo {
  id: DistributionMode;
  label: string;
  /** Whether the command can be relied on today. */
  available: boolean;
  /** One sentence the page shows above the commands. */
  note: string;
}

export const DISTRIBUTION_MODES: Record<DistributionMode, DistributionModeInfo> = {
  git: {
    id: "git",
    label: "Git tag",
    available: true,
    note:
      "The public install is the built package at the immutable v1.0.1 Git tag. It needs no install script, and the lockfile records the resolved commit.",
  },
  tarball: {
    id: "tarball",
    label: "Packed tarball",
    available: true,
    note:
      "Use the release tarball for offline or checksum-pinned installs. This repository's consumer gate installs both this artifact and the public Git tag with plain npm.",
  },
};

/**
 * The install command per package manager.
 *
 * `spec` is passed in rather than baked in: the tarball path is a fact about a
 * build, and a version is a fact about a release. Neither belongs in this file.
 */
export function installCommand(manager: PackageManager, spec: string): string {
  switch (manager) {
    case "pnpm":
      return `pnpm add ${spec}`;
    case "npm":
      return `npm install ${spec}`;
    case "yarn":
      return `yarn add ${spec}`;
    case "bun":
      return `bun add ${spec}`;
  }
}

export function distributionSpec(mode: DistributionMode): string {
  return mode === "git" ? GIT_SPEC : PACKED_TARBALL;
}

export interface SetupSnippet {
  title: string;
  /** One sentence explaining why the step exists. */
  description: string;
  code: string;
  /** The language a highlighter or a copy button should assume. */
  language: "bash" | "tsx" | "css";
}

/** The three setup steps a consumer actually has to perform, in order. */
export function setupSnippets(mode: DistributionMode): SetupSnippet[] {
  return [
    {
      title: "Install",
      description:
        mode === "git"
          ? "Add the built package from the public Git tag with whichever package manager the project already uses."
          : "Install the packed release artifact; keep its checksum with the vendored file.",
      code: installCommand("pnpm", distributionSpec(mode)),
      language: "bash",
    },
    {
      title: "Import the styles",
      description:
        "The stylesheet is Tailwind CSS v4 and ships the tokens plus component styles. Import Tailwind first, then the package stylesheet, once at the application root.",
      code: `@import "tailwindcss";\n@import "${PACKAGE_NAME}/styles.css";`,
      language: "css",
    },
    {
      title: "Install the provider",
      description:
        "One provider supplies the resolved theme, the locale and the motion default to every component below it. In Next.js, put the returned init script in the document head before hydration.",
      code: [
        `import { LucProvider, lucThemeInitScript } from "${PACKAGE_NAME}";`,
        ``,
        `const themeScript = lucThemeInitScript({ defaultTheme: "dark" });`,
        `// <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>`,
        `// <LucProvider defaultTheme="dark">{children}</LucProvider>`,
      ].join("\n"),
      language: "tsx",
    },
  ];
}

/**
 * Peer requirements a page states rather than implies.
 *
 * A component library that pulls the wrong React into a product's tree is a
 * support ticket; naming the peers is cheaper than debugging it.
 */
export const PEER_REQUIREMENTS: readonly string[] = [
  "react ^19.0.0",
  "react-dom ^19.0.0",
  "react-hook-form ^7.0.0 (optional, for @luc/ui/forms/react-hook-form)",
  "tailwindcss ^4.0.0",
  "node >= 22 (repository tools)",
];

/**
 * The import line for one component, and the note that goes with it when the
 * symbol only exists on the root barrel.
 */
export function importLine(importPath: string, symbols: readonly string[]): string {
  const named = symbols.length > 1 ? `{ ${symbols.join(", ")} }` : `{ ${symbols[0] ?? ""} }`;
  return `import ${named} from "${importPath}";`;
}
