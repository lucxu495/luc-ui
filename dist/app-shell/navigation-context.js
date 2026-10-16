"use client";
import { Fragment, jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
//#region src/app-shell/navigation-context.tsx
const NavigationContext = createContext({});
function NavigationProvider({ renderLink, pathname, onNavigate, children }) {
	const value = useMemo(() => ({
		renderLink,
		pathname,
		onNavigate
	}), [
		onNavigate,
		pathname,
		renderLink
	]);
	return /* @__PURE__ */ jsx(NavigationContext.Provider, {
		value,
		children
	});
}
function useNavigation() {
	return useContext(NavigationContext);
}
/**
* Render a link through the consumer's adapter.
*
* The default is a real `<a href>`: keyboard, middle-click and "open in new
* tab" keep working even without a router, and an app that never configures a
* provider still gets correct semantics.
*/
function NavigationLink({ href, onNavigate, onClick, children, ...props }) {
	const context = useNavigation();
	const handleClick = (event) => {
		onClick?.(event);
		if (event.defaultPrevented) return;
		(onNavigate ?? context.onNavigate)?.(href);
	};
	if (context.renderLink) return /* @__PURE__ */ jsx(Fragment, { children: context.renderLink({
		href,
		onClick: handleClick,
		...props,
		children
	}) });
	return /* @__PURE__ */ jsx("a", {
		href,
		onClick: handleClick,
		...props,
		children
	});
}
//#endregion
export { NavigationLink, NavigationProvider, useNavigation };

//# sourceMappingURL=navigation-context.js.map