//#region src/tokens/version.d.ts
/**
 * The LUC UI token schema version.
 *
 * Bumped when a token is added, renamed or removed in a way that changes what a
 * consumer can rely on — never for a value tweak. The same number is declared in
 * CSS as `--luc-token-version`, so a product can assert compatibility from
 * either side:
 *
 *   import { LUC_UI_TOKEN_VERSION } from "@luc/ui";
 *   getComputedStyle(document.documentElement).getPropertyValue("--luc-token-version");
 *
 * Version 1 is the frozen V1.0 set documented in `docs/V1_TOKEN_AUDIT.md`.
 */
export declare const LUC_UI_TOKEN_VERSION = 1;
//#endregion
//# sourceMappingURL=version.d.ts.map