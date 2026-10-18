import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import { lucDesignRules } from "./eslint-rules/no-raw-color-literals.mjs";

/**
 * Shared ESLint floor for LUC UI. Rules that encode a house rule from
 * DESIGN_SYSTEM.md are marked; the rest is hygiene.
 */
export const sharedConfig = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.open-next/**",
      "**/.wrangler/**",
      "**/dist/**",
      "**/coverage/**",
      "**/artifacts/**",
      "**/next-env.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
      "react-hooks": reactHooks,
      luc: lucDesignRules,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      /*
       * House rule: a scrolling code block is a tab stop.
       *
       * `no-noninteractive-tabindex` exists to stop pointless tab stops, and it
       * is right about that — but it collides with `scrollable-region-focusable`
       * on exactly one shape: a `<pre>`/`<code>` region that scrolls
       * horizontally. Nothing inside such a region is focusable, so without a
       * tab stop the lines past the fold are unreachable from the keyboard.
       * The alternative the rule pushes you towards — wrap the code — is what
       * makes a snippet unreadable in the first place. So the two elements are
       * named here and nothing else is.
       */
      "jsx-a11y/no-noninteractive-tabindex": [
        "error",
        /*
         * `region` is the one non-interactive *role* that legitimately takes a
         * tab stop: a scrollable region with no interactive child is
         * unreachable without one. `Code`, the carousel track and the AppShell
         * status bar all already had this pattern; naming it here is what lets
         * them be correct without a per-file disable.
         */
        { tags: ["pre", "code"], roles: ["tabpanel", "region"], allowExpressionValues: true },
      ],
      // House rules from DESIGN_SYSTEM.md. See docs/SOURCE_POLICY.md.
      "luc/no-raw-color-literals": "error",
      "luc/no-deep-package-imports": "error",
      // House rule: no unused values left behind in a component.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
];

export default sharedConfig;
