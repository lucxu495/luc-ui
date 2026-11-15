//#region src/charts/financial/tooltip-position.ts
/** Place a crosshair tooltip inside its host without covering the pointer. */
function financialTooltipPosition(input) {
	const margin = 8;
	const offset = 16;
	let left = input.pointerX + offset;
	if (left + input.tooltipWidth > input.hostWidth - margin) left = input.pointerX - input.tooltipWidth - offset;
	let top = input.pointerY - 12;
	if (top + input.tooltipHeight > input.hostHeight - margin) top = input.pointerY - input.tooltipHeight - 12;
	return {
		left: Math.max(margin, Math.min(left, Math.max(margin, input.hostWidth - input.tooltipWidth - margin))),
		top: Math.max(margin, Math.min(top, Math.max(margin, input.hostHeight - input.tooltipHeight - margin)))
	};
}
//#endregion
export { financialTooltipPosition };

//# sourceMappingURL=tooltip-position.js.map