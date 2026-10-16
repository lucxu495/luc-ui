/**
 * Merge several refs onto one element. Used where a component both owns an
 * internal ref and must forward a consumer ref (or a Radix Slot ref) to the
 * same DOM node.
 */
export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    }
  };
}
