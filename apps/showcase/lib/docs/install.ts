/*
 * Installation, written once.
 *
 * The rule this file exists to enforce: **a page may not invent an install
 * command, and it may not invent a version.** In Phase 9 the package is built,
 * packed and consumed by an external fixture test, but it is not published to a
 * registry. So there are two honest modes, and the UI always says which one the
 * reader is looking at:
 *
 *   source   — true today. Either this monorepo's pnpm workspace, or the packed
 *              tarball that `pnpm verify:package` produces and installs.
 *   package  — intended publication usage. Correct in shape, labelled as not
 *              yet published, because a command that fails on paste is worse
 *              than a sentence that explains why it is not there yet.
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type DistributionMode = "source" | "package";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["pnpm", "npm", "yarn", "bun"];

export interface DistributionModeInfo {
  id: DistributionMode;
  label: string;
  /** Whether the command can be relied on today. */
  available: boolean;
  /** One sentence the page shows above the commands. */
  note: string;
}

export const DISTRIBUTION_MODES: Record<DistributionMode, DistributionModeInfo> = {
  source: {
    id: "source",
    label: "Workspace or tarball",
    available: true,
    note:
      "The library is distributed as source inside its pnpm workspace, and as a packed tarball that is installed and built in an external consumer fixture. This is what works today.",
  },
  package: {
    id: "package",
    label: "Package registry",
    available: false,
    note:
      "Intended publication usage. The package is built and packed, but no release has been published to a registry yet, so these commands do not resolve today.",
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

/** The spec each mode installs. The package name is the only constant. */
export const PACKAGE_NAME = "@luc/ui";
export const PACKED_TARBALL = "./luc-ui-1.0.0.tgz";

export function distributionSpec(mode: DistributionMode): string {
  return mode === "package" ? PACKAGE_NAME : PACKED_TARBALL;
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
        mode === "package"
          ? "Add the package with whichever manager the project already uses."
          : "Install the packed tarball that the package gate builds and verifies.",
      code: installCommand("pnpm", distributionSpec(mode)),
      language: "bash",
    },
    {
      title: "Import the styles",
      description:
        "The design tokens and component styles ship as one stylesheet. Import it once, in the root layout.",
      code: `import "${PACKAGE_NAME}/styles.css";`,
      language: "css",
    },
    {
      title: "Install the provider",
      description:
        "One provider supplies the resolved theme, the locale and the motion default to every component below it. It is the only provider a product needs.",
      code: [
        `import { LucProvider } from "${PACKAGE_NAME}";`,
        `import "${PACKAGE_NAME}/styles.css";`,
        ``,
        `export function Root({ children }: { children: React.ReactNode }) {`,
        `  return <LucProvider>{children}</LucProvider>;`,
        `}`,
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
  "react >= 19 and react-dom >= 19",
  "TypeScript >= 5.6 for the published types",
];

/**
 * The import line for one component, and the note that goes with it when the
 * symbol only exists on the root barrel.
 */
export function importLine(importPath: string, symbols: readonly string[]): string {
  const named = symbols.length > 1 ? `{ ${symbols.join(", ")} }` : `{ ${symbols[0] ?? ""} }`;
  return `import ${named} from "${importPath}";`;
}
