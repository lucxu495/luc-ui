//#region src/components/button-variants.d.ts
/**
 * The Button recipe.
 *
 * Deliberately six variants, not fifteen. Two of them answer the same question
 * at different volume — `primary` is the filled accent, `accent` the tinted,
 * lower-emphasis twin (it matches `IconButton`'s `accent`). `outline` exists for
 * surfaces that already carry elevation; `ghost` for toolbars and dense headers.
 *
 * `primary` and `accent` carry `luc-sheen` — one soft highlight that crosses the
 * fill on hover. It is the family's signature gesture and the only decorative
 * motion in the recipe; the global reduced-motion clamp removes it.
 *
 * This module has no `"use client"` directive on purpose: server components
 * (and plain anchors) can apply the recipe without pulling in client code.
 */
export declare const buttonVariants: (props?: ({
  variant?: "outline" | "ghost" | "accent" | "primary" | "secondary" | "danger" | null | undefined;
  size?: "sm" | "md" | "lg" | null | undefined;
  block?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
//#endregion
//# sourceMappingURL=button-variants.d.ts.map