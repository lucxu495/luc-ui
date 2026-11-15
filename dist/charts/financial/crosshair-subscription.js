//#region src/charts/financial/crosshair-subscription.ts
function isLocalPointerEvent(event) {
	return event.sourceEvent !== void 0;
}
/**
* Event callbacks live for the lifetime of the engine, while React state is
* replaced on every render. Read the latest state at event time and remove the
* exact handler on destroy, rather than capturing one render's props forever.
*/
function subscribeLatestCrosshair(chart, getState, onEvent) {
	const handler = (event) => {
		onEvent(event, getState());
	};
	chart.subscribeCrosshairMove(handler);
	return () => chart.unsubscribeCrosshairMove(handler);
}
const browserFrameScheduler = {
	request(callback) {
		if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
		return setTimeout(callback, 0);
	},
	cancel(handle) {
		if (typeof cancelAnimationFrame === "function") {
			cancelAnimationFrame(handle);
			return;
		}
		clearTimeout(handle);
	}
};
/**
* Coalesce a high-frequency stream to the browser's paint cadence.
*
* Crosshair events can arrive more often than the browser paints. Only the
* latest payload matters because each payload contains the complete tooltip
* state, so one frame callback is enough regardless of how many events arrived.
*/
function createLatestFrameBatch(run, scheduler = browserFrameScheduler) {
	let frame = null;
	let latest;
	let pending = false;
	const flush = () => {
		if (frame !== null) {
			scheduler.cancel(frame);
			frame = null;
		}
		if (!pending) return;
		const payload = latest;
		latest = void 0;
		pending = false;
		run(payload);
	};
	const schedule = (payload) => {
		latest = payload;
		pending = true;
		if (frame === null) frame = scheduler.request(flush);
	};
	const cancel = () => {
		if (frame !== null) scheduler.cancel(frame);
		frame = null;
		latest = void 0;
		pending = false;
	};
	return {
		schedule,
		flush,
		cancel
	};
}
//#endregion
export { createLatestFrameBatch, isLocalPointerEvent, subscribeLatestCrosshair };

//# sourceMappingURL=crosshair-subscription.js.map