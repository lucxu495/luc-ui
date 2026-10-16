import next from "eslint-config-next";
import { lucDesignRules } from "../../eslint-rules/no-raw-color-literals.mjs";

const config = [
  {
    /*
     * The second pattern is not decoration: each development session gets its
     * own output directory (CONCURRENCY-001, docs/DEV_MODE.md §7) and Turbopack
     * writes thousands of generated chunks into it. Without it, `pnpm lint` lints
     * the build output — 2322 problems, 1370 of them errors, all framework code.
     * A session directory has to be invisible to every tool: the repository
     * ignore file, ESLint, and `tsconfig.json`.
     */
    ignores: ["**/.next/**", "**/.next-*/**", "**/node_modules/**", "next-env.d.ts"],
  },
  ...next,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { luc: lucDesignRules },
    rules: {
      // The Showcase is a consumer of @luc/ui, so the consumer contract applies
      // here: tokens, not literals; public subpaths, not source files.
      "luc/no-raw-color-literals": "error",
      "luc/no-deep-package-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error", "log"] }],
    },
  },
  {
    /*
     * `themeColor` in the Next viewport export is browser chrome metadata, not a
     * design decision: the platform paints the address bar with it before any
     * CSS is parsed, so it cannot be a token reference. This must stay last: a
     * later matching config wins.
     */
    files: ["app/layout.tsx"],
    rules: { "luc/no-raw-color-literals": "off" },
  },
];

export default config;
