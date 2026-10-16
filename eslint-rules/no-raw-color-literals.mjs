/**
 * LUC design contracts, as lint rules.
 *
 * `@shadcn/lint` is the mature version of this idea (see
 * `docs/research/v0.5-open-source-audit.md`), but it is 0.2.x and it needs a
 * hand-written contract per component before it says anything useful. These two
 * rules are the part that pays for itself today, with no new dependency and no
 * false positives on legitimate metadata (a `<meta name="theme-color">` hex is
 * not a design decision).
 *
 *   1. no-raw-color-literals — colour must come from a token, not from a
 *      literal pasted into a utility class or an inline style.
 *   2. no-deep-package-imports — a consumer imports `@luc/ui/...`, never
 *      `@luc/ui/src/...` or a compiled path.
 */

const COLOR_FUNCTION = /^(?:#|rgb\(|rgba\(|hsl\(|hsla\(|oklch\(|oklab\(|lab\(|lch\(|color-mix\()/i;
const ARBITRARY_COLOR_CLASS =
  /\b(?:bg|text|border|ring|fill|stroke|shadow|from|via|to|outline|decoration|divide|accent|caret)-\[(?:#|rgb|hsl|oklch|oklab|lab|lch|color-mix)/i;

const COLOR_STYLE_PROPS = new Set([
  "color",
  "background",
  "backgroundColor",
  "borderColor",
  "outlineColor",
  "fill",
  "stroke",
  "textDecorationColor",
  "caretColor",
]);

function isStringLiteral(node) {
  return node?.type === "Literal" && typeof node.value === "string";
}

const noRawColorLiterals = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Colour comes from a LUC token. Use a semantic utility (bg-surface-overlay) or var(--token) inside an arbitrary value.",
    },
    schema: [],
    messages: {
      classLiteral:
        "Raw colour in a class name: add or reuse a semantic token and use its utility instead.",
      styleLiteral:
        "Raw colour in an inline style: reference a token, e.g. color: \"var(--fg-primary)\".",
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (!ARBITRARY_COLOR_CLASS.test(node.value)) return;
        // A token reference inside the arbitrary value is the correct form.
        if (node.value.includes("var(--")) return;
        context.report({ node, messageId: "classLiteral" });
      },
      Property(node) {
        const key = node.key?.name ?? node.key?.value;
        if (typeof key !== "string" || !COLOR_STYLE_PROPS.has(key)) return;
        if (!isStringLiteral(node.value)) return;
        if (!COLOR_FUNCTION.test(node.value.value)) return;
        context.report({ node: node.value, messageId: "styleLiteral" });
      },
    };
  },
};

const noDeepPackageImports = {
  meta: {
    type: "problem",
    docs: {
      description: "Import a public @luc/ui subpath, never a source or build path.",
    },
    schema: [],
    messages: {
      deepImport:
        "Import `{{name}}` through a public subpath such as `@luc/ui/components/button` (see docs/PACKAGING_GUIDE.md).",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const name = node.source?.value;
        if (typeof name !== "string") return;
        if (!/^@luc\/ui\/(?:src|dist)\//.test(name)) return;
        context.report({ node: node.source, messageId: "deepImport", data: { name } });
      },
      ExportNamedDeclaration(node) {
        const name = node.source?.value;
        if (typeof name !== "string") return;
        if (!/^@luc\/ui\/(?:src|dist)\//.test(name)) return;
        context.report({ node: node.source, messageId: "deepImport", data: { name } });
      },
    };
  },
};

export const lucDesignRules = {
  rules: {
    "no-raw-color-literals": noRawColorLiterals,
    "no-deep-package-imports": noDeepPackageImports,
  },
};

export default lucDesignRules;
