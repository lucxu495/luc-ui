"use client";
import { cn } from "../../utils/cn.js";
import { IconButton } from "../../components/icon-button.js";
import { Input } from "../../components/input.js";
import { jsx } from "react/jsx-runtime";
import { useState } from "react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
//#region src/forms/inputs/password-input.tsx
/**
* A password field with a reveal toggle.
*
* Three rules, deliberately: the field keeps `type="password"` semantics for
* password managers, the toggle is a real button with an accessible name, and
* no policy is enforced here — length rules, breach checks and strength meters
* are the product's business, not the design system's. Paste is never blocked.
*/
function PasswordInput({ toggleLabels = {
	show: "Show password",
	hide: "Hide password"
}, defaultVisible = false, className, autoComplete = "current-password", ...props }) {
	const [visible, setVisible] = useState(defaultVisible);
	return /* @__PURE__ */ jsx(Input, {
		...props,
		type: visible ? "text" : "password",
		autoComplete,
		spellCheck: false,
		className,
		trailingAction: /* @__PURE__ */ jsx(IconButton, {
			label: visible ? toggleLabels.hide : toggleLabels.show,
			variant: "ghost",
			size: "sm",
			showTooltip: false,
			"aria-pressed": visible,
			className: cn("text-fg-muted"),
			onClick: () => setVisible((current) => !current),
			icon: visible ? /* @__PURE__ */ jsx(RiEyeOffLine, {}) : /* @__PURE__ */ jsx(RiEyeLine, {})
		})
	});
}
//#endregion
export { PasswordInput };

//# sourceMappingURL=password-input.js.map