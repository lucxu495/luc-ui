/**
 * Public entry for the button family (`@luc/ui/components/button`).
 *
 * Deliberately a module **without** `"use client"`: it re-exports the client
 * component (`Button`, from the internal `button-base`) next to the
 * server-safe recipe (`buttonVariants`). Exporting the recipe from the client
 * module would turn it into a client reference, and a server component could no
 * longer call `buttonVariants()` while rendering.
 *
 * The bundle cost is unchanged: `button-base` already imported the recipe.
 */

export { Button, type ButtonProps } from "./button-base";
export { buttonVariants } from "./button-variants";
