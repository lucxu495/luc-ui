//#region src/utils/refs.d.ts
/**
 * Merge several refs onto one element. Used where a component both owns an
 * internal ref and must forward a consumer ref (or a Radix Slot ref) to the
 * same DOM node.
 */
export declare function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T>;
//#endregion
//# sourceMappingURL=refs.d.ts.map