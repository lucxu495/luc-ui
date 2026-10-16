//#region src/utils/refs.ts
/**
* Merge several refs onto one element. Used where a component both owns an
* internal ref and must forward a consumer ref (or a Radix Slot ref) to the
* same DOM node.
*/
function mergeRefs(...refs) {
	return (node) => {
		for (const ref of refs) {
			if (!ref) continue;
			if (typeof ref === "function") ref(node);
			else ref.current = node;
		}
	};
}
//#endregion
export { mergeRefs };

//# sourceMappingURL=refs.js.map