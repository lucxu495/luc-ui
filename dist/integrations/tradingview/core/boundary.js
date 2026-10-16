"use client";
import { TradingViewRetryAction, TradingViewWidgetError } from "./surface.js";
import { jsx } from "react/jsx-runtime";
import { Component, Fragment as Fragment$1 } from "react";
//#region src/integrations/tradingview/core/boundary.tsx
var TradingViewBoundary = class extends Component {
	state = {
		error: null,
		attempt: 0
	};
	static getDerivedStateFromError(error) {
		return { error };
	}
	componentDidUpdate(previous) {
		if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState((state) => ({
			error: null,
			attempt: state.attempt + 1
		}));
	}
	componentDidCatch(error, _info) {
		this.props.onError?.(error);
	}
	retry = () => {
		this.setState((state) => ({
			error: null,
			attempt: state.attempt + 1
		}));
	};
	render() {
		if (this.state.error) return /* @__PURE__ */ jsx(TradingViewWidgetError, {
			className: this.props.className,
			title: this.props.title ?? "Market widget unavailable",
			description: this.props.description ?? "This market widget could not be initialized. The rest of this page is unaffected.",
			action: /* @__PURE__ */ jsx(TradingViewRetryAction, { onRetry: this.retry })
		});
		return /* @__PURE__ */ jsx(Fragment$1, { children: this.props.children }, this.state.attempt);
	}
};
//#endregion
export { TradingViewBoundary };

//# sourceMappingURL=boundary.js.map