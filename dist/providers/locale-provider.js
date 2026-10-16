"use client";
import { I18nProvider } from "react-aria-components";
import { Fragment, jsx } from "react/jsx-runtime";
//#region src/providers/locale-provider.tsx
/**
* Applies a locale to every date, time and number control underneath.
*
* It is a thin wrapper — LUC does not own internationalisation data, and React
* Aria already resolves it correctly — but it gives products one place to set
* the locale for the whole system and keeps server/client output identical.
*/
function LocaleProvider({ locale, children }) {
	if (!locale) return /* @__PURE__ */ jsx(Fragment, { children });
	return /* @__PURE__ */ jsx(I18nProvider, {
		locale,
		children
	});
}
//#endregion
export { LocaleProvider };

//# sourceMappingURL=locale-provider.js.map