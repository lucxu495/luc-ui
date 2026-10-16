//#region src/hooks/use-media-query.d.ts
/**
 * SSR-safe media query subscription. Returns `false` on the server so markup
 * stays deterministic during hydration.
 */
export declare function useMediaQuery(query: string, defaultValue?: boolean): boolean;
/** True for coarse pointers — used to calm down pointer-driven effects. */
export declare function useCoarsePointer(): boolean;
//#endregion
//# sourceMappingURL=use-media-query.d.ts.map