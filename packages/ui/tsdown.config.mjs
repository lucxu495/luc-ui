import { defineConfig } from "tsdown";

/**
 * @luc/ui package build.
 *
 * `unbundle` keeps one output module per source module, which is what makes the
 * subpath promises real: importing `@luc/ui/components/button` pulls the button
 * and its own imports, not the chart engines or the date system.
 *
 * Entries are explicit. `exports: true` would happily publish every internal
 * file — including the chart adapters — so the public surface stays a curated
 * list, and `scripts/verify-package.mjs` checks that every declared path exists.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",

    "app-shell": "src/app-shell/index.ts",
    workspace: "src/workspace/index.ts",
    "url-state": "src/url-state/index.ts",

    charts: "src/charts/index.ts",
    experiences: "src/experiences/index.ts",
    tradingview: "src/integrations/tradingview/index.ts",
    "financial-chart": "src/charts/financial/financial-chart.tsx",
    "data-table": "src/table/index.ts",
    data: "src/data/index.ts",

    forms: "src/forms/index.ts",
    "forms/react-hook-form": "src/forms/adapters/react-hook-form.tsx",
    datetime: "src/datetime/index.ts",
    "date-picker": "src/datetime/date-picker.tsx",
    calendar: "src/datetime/calendar.tsx",

    slider: "src/components/slider.tsx",
    "dropdown-menu": "src/components/dropdown-menu.tsx",
    "context-menu": "src/components/context-menu.tsx",
    alert: "src/components/alert.tsx",
    "empty-state": "src/components/empty-state.tsx",
    typography: "src/components/typography.tsx",

    // The button family entry is a server-safe module that re-exports the
    // client component and the recipe, so `buttonVariants()` stays callable
    // during SSR. See docs/PUBLIC_API.md.
    "components/button": "src/components/button.tsx",
    "components/badge": "src/components/badge.tsx",
    "components/card": "src/components/card.tsx",
    "components/command": "src/components/command.tsx",
    "components/combobox": "src/components/combobox.tsx",
    "components/dialog": "src/components/dialog.tsx",
    "components/input": "src/components/input.tsx",
    "components/select": "src/components/select.tsx",
    "components/sheet": "src/components/sheet.tsx",
    "components/tabs": "src/components/tabs.tsx",
    "components/textarea": "src/components/textarea.tsx",
    "components/timeline": "src/components/timeline.tsx",
    "components/toast": "src/components/toast.tsx",

    layout: "src/layout/index.ts",
    motion: "src/motion/index.ts",
    hooks: "src/hooks/index.ts",
    providers: "src/providers/index.ts",
    utils: "src/utils/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  platform: "browser",
  target: "es2022",
  unbundle: true,
  dts: true,
  sourcemap: true,
  clean: true,
  // Package validation runs in `scripts/verify-package.mjs`, against the packed
  // tarball. It cannot run here because the CSS entry points only exist after
  // `scripts/postbuild.mjs` has copied them.
  publint: false,
  attw: false,
});
