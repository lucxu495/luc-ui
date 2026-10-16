"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { Text } from "../typography.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RiAlertLine, RiArrowRightSLine, RiCheckLine, RiLoaderLine, RiRobot2Line, RiSendPlaneLine, RiSparklingLine, RiStopCircleLine, RiToolsLine, RiUserLine } from "@remixicon/react";
//#region src/components/ai.tsx
function StreamingText({ text, streaming = false, speed = 60, caret = true, className, onComplete }) {
	const reduced = useReducedMotion();
	const [count, setCount] = useState(() => text.length);
	const countRef = useRef(count);
	const completeRef = useRef(onComplete);
	useEffect(() => {
		countRef.current = count;
		completeRef.current = onComplete;
	});
	useEffect(() => {
		if (reduced || !streaming) return;
		let raf = 0;
		let last = performance.now();
		let chars = countRef.current > text.length ? 0 : countRef.current;
		const tick = (now) => {
			const elapsed = (now - last) / 1e3;
			last = now;
			chars = Math.min(text.length, chars + elapsed * speed);
			setCount(Math.floor(chars));
			if (chars < text.length) raf = window.requestAnimationFrame(tick);
			else completeRef.current?.();
		};
		raf = window.requestAnimationFrame(tick);
		return () => window.cancelAnimationFrame(raf);
	}, [
		reduced,
		speed,
		streaming,
		text
	]);
	const visible = streaming && !reduced ? text.slice(0, count) : text;
	const caughtUp = count >= text.length;
	if (!streaming && text === "") return null;
	return /* @__PURE__ */ jsxs("span", {
		className: cn("whitespace-pre-wrap", className),
		children: [visible, caret && streaming ? /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: cn("ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-fg-accent align-baseline", caughtUp ? "opacity-40" : "animate-pulse-soft")
		}) : null]
	});
}
const ROLE_LABEL = {
	user: "You",
	assistant: "Assistant",
	system: "System",
	tool: "Tool"
};
const roleGlyph = {
	user: /* @__PURE__ */ jsx(RiUserLine, {}),
	assistant: /* @__PURE__ */ jsx(RiSparklingLine, {}),
	system: /* @__PURE__ */ jsx(RiRobot2Line, {}),
	tool: /* @__PURE__ */ jsx(RiToolsLine, {})
};
function ChatMessage({ from, author, timestamp, status = "complete", avatar, actions, footer, children, className, ...props }) {
	const name = author ?? ROLE_LABEL[from];
	const isUser = from === "user";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "chat-message",
		"data-role": from,
		role: "group",
		"aria-label": name,
		className: cn("group/message flex flex-col gap-1.5", isUser ? "items-end" : "items-start", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: cn("flex items-center gap-1.5 px-1", isUser && "flex-row-reverse"),
				children: [
					/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: cn("grid size-5 shrink-0 place-items-center rounded-full text-micro", isUser ? "bg-surface-interactive text-fg-secondary" : "bg-surface-selected text-fg-accent"),
						children: avatar ?? roleGlyph[from]
					}),
					/* @__PURE__ */ jsx(Text, {
						variant: "micro",
						tone: "muted",
						children: name
					}),
					timestamp ? /* @__PURE__ */ jsx(Text, {
						variant: "micro",
						tone: "muted",
						className: "luc-numeric",
						children: timestamp
					}) : null
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: cn("luc-transition relative max-w-[min(46rem,92%)] rounded-lg px-3.5 py-2.5 text-body", isUser ? "bg-accent-default text-fg-on-accent shadow-rest" : "border border-line-subtle bg-surface-default text-fg-primary luc-rest", status === "error" && "border-negative-line bg-negative-soft", status === "pending" && "opacity-80"),
				children
			}),
			footer ? /* @__PURE__ */ jsx("div", {
				className: "w-full max-w-[min(46rem,92%)]",
				children: footer
			}) : null,
			actions ? /* @__PURE__ */ jsx("div", {
				className: cn("flex items-center gap-1 px-1 opacity-0 luc-transition", "group-hover/message:opacity-100 group-focus-within/message:opacity-100"),
				children: actions
			}) : null
		]
	});
}
function MessageList({ label = "Conversation", autoScroll = true, live = "polite", className, children, ...props }) {
	const ref = useRef(null);
	const pinned = useRef(true);
	useLayoutEffect(() => {
		const node = ref.current;
		if (!node || !autoScroll || !pinned.current) return;
		node.scrollTop = node.scrollHeight;
	});
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "message-list",
		role: "log",
		"aria-label": label,
		"aria-live": live,
		"aria-relevant": "additions text",
		onScroll: (event) => {
			const node = event.currentTarget;
			pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
		},
		className: cn("flex flex-col gap-4 overflow-y-auto", className),
		...props,
		children
	});
}
function PromptComposer({ value, defaultValue = "", onValueChange, onSubmit, busy = false, onStop, placeholder = "Ask anything…", label = "Prompt", disabled = false, toolbar, leading, maxLength, submitOnEnter = true, labels, className }) {
	const controlled = value !== void 0;
	const [internal, setInternal] = useState(defaultValue);
	const text = controlled ? value : internal;
	const fieldId = `${label.replace(/\s+/g, "-").toLowerCase()}-field`;
	const update = useCallback((next) => {
		if (!controlled) setInternal(next);
		onValueChange?.(next);
	}, [controlled, onValueChange]);
	const submit = useCallback(() => {
		const trimmed = text.trim();
		if (!trimmed || disabled || busy) return;
		onSubmit(trimmed);
		update("");
	}, [
		busy,
		disabled,
		onSubmit,
		text,
		update
	]);
	return /* @__PURE__ */ jsxs("form", {
		"data-slot": "prompt-composer",
		"aria-label": label,
		onSubmit: (event) => {
			event.preventDefault();
			submit();
		},
		className: cn("luc-transition flex flex-col gap-2 rounded-lg border border-line-default bg-surface-overlay p-2.5 luc-float", "focus-within:border-line-accent", disabled && "opacity-60", className),
		children: [
			leading,
			/* @__PURE__ */ jsx("label", {
				className: "sr-only",
				htmlFor: fieldId,
				children: label
			}),
			/* @__PURE__ */ jsx("textarea", {
				id: fieldId,
				value: text,
				disabled,
				placeholder,
				maxLength,
				rows: 1,
				onChange: (event) => update(event.target.value),
				onKeyDown: (event) => {
					if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
						event.preventDefault();
						submit();
					}
				},
				className: cn("max-h-40 min-h-11 w-full resize-none bg-transparent px-1.5 py-2 text-body text-fg-primary", "outline-none placeholder:text-fg-muted")
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex min-w-0 items-center gap-1.5",
					children: toolbar
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex shrink-0 items-center gap-1.5",
					children: [labels?.hint ? /* @__PURE__ */ jsx(Text, {
						variant: "micro",
						tone: "muted",
						className: "hidden sm:block",
						children: labels.hint
					}) : null, busy && onStop ? /* @__PURE__ */ jsx(IconButton, {
						type: "button",
						variant: "ghost",
						size: "md",
						label: labels?.stop ?? "Stop generating",
						icon: /* @__PURE__ */ jsx(RiStopCircleLine, {}),
						onClick: onStop
					}) : /* @__PURE__ */ jsx(IconButton, {
						type: "submit",
						variant: "accent",
						size: "md",
						disabled: disabled || text.trim().length === 0,
						label: labels?.send ?? "Send prompt",
						icon: /* @__PURE__ */ jsx(RiSendPlaneLine, {})
					})]
				})]
			})
		]
	});
}
const toolStatusTone = {
	pending: "text-fg-muted",
	running: "text-fg-accent",
	done: "text-positive",
	error: "text-negative"
};
function ToolCallTimeline({ calls, label = "Tool calls", defaultOpen = false, className, ...props }) {
	const [open, setOpen] = useState(() => Object.fromEntries(calls.map((call) => [call.id, defaultOpen])));
	return /* @__PURE__ */ jsx("ol", {
		"data-slot": "tool-call-timeline",
		"aria-label": label,
		className: cn("flex flex-col gap-1.5", className),
		...props,
		children: calls.map((call) => {
			const expanded = open[call.id] ?? defaultOpen;
			const hasDetail = Boolean(call.input ?? call.output ?? call.error);
			return /* @__PURE__ */ jsxs("li", {
				className: "luc-transition overflow-hidden rounded-md border border-line-subtle bg-surface-sunken",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					"aria-expanded": hasDetail ? expanded : void 0,
					disabled: !hasDetail,
					onClick: () => setOpen((current) => ({
						...current,
						[call.id]: !expanded
					})),
					className: cn("luc-focus-inset flex w-full items-center gap-2 px-2.5 py-2 text-left", hasDetail && "hover:bg-surface-interactive-hover"),
					children: [
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: cn("grid size-3.5 shrink-0 place-items-center", toolStatusTone[call.status]),
							children: call.status === "done" ? /* @__PURE__ */ jsx(RiCheckLine, { className: "size-3.5" }) : call.status === "error" ? /* @__PURE__ */ jsx(RiAlertLine, { className: "size-3.5" }) : call.status === "running" ? /* @__PURE__ */ jsx(RiLoaderLine, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ jsx(RiToolsLine, { className: "size-3.5" })
						}),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate font-mono text-caption text-fg-primary",
							children: call.name
						}),
						call.duration ? /* @__PURE__ */ jsx("span", {
							className: "shrink-0 text-micro text-fg-muted luc-numeric",
							children: call.duration
						}) : null,
						hasDetail ? /* @__PURE__ */ jsx(RiArrowRightSLine, {
							"aria-hidden": "true",
							className: cn("size-4 shrink-0 text-fg-muted luc-transition", expanded && "rotate-90")
						}) : null
					]
				}), expanded && hasDetail ? /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col gap-2 border-t border-line-subtle px-2.5 py-2",
					children: [
						call.input ? /* @__PURE__ */ jsx(Detail, {
							label: "Input",
							children: /* @__PURE__ */ jsx("pre", {
								className: "luc-table-scroll overflow-x-auto font-mono text-caption text-fg-secondary",
								children: call.input
							})
						}) : null,
						call.output ? /* @__PURE__ */ jsx(Detail, {
							label: "Result",
							children: /* @__PURE__ */ jsx("pre", {
								className: "luc-table-scroll overflow-x-auto font-mono text-caption text-fg-secondary",
								children: call.output
							})
						}) : null,
						call.error ? /* @__PURE__ */ jsx(Detail, {
							label: "Error",
							children: /* @__PURE__ */ jsx("p", {
								className: "font-mono text-caption text-negative",
								children: call.error
							})
						}) : null
					]
				}) : null]
			}, call.id);
		})
	});
}
function Detail({ label, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-0.5",
		children: [/* @__PURE__ */ jsx(Text, {
			variant: "micro",
			tone: "muted",
			children: label
		}), children]
	});
}
/**
* `AgentActivity` renders the steps the application *declares*. It has no
* concept of hidden reasoning and no affordance for revealing any — the only
* text it can show is text its caller passed in.
*/
function AgentActivity({ steps, title = "Working", elapsed, label = "Agent activity", compact = false, className, ...props }) {
	const active = steps.find((step) => step.status === "active");
	const done = steps.filter((step) => step.status === "done").length;
	const last = steps[steps.length - 1];
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "agent-activity",
		"aria-label": label,
		className: cn("luc-transition flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-sunken p-3 luc-well", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("grid size-5 shrink-0 place-items-center rounded-full bg-surface-selected text-fg-accent", active && "animate-pulse-soft"),
					children: /* @__PURE__ */ jsx(RiSparklingLine, { className: "size-3" })
				}),
				/* @__PURE__ */ jsx(Text, {
					variant: "label",
					className: "min-w-0 flex-1 truncate text-fg-primary",
					children: title
				}),
				/* @__PURE__ */ jsx(Text, {
					variant: "micro",
					tone: "muted",
					className: "shrink-0 luc-numeric",
					children: elapsed ?? `${done}/${steps.length}`
				})
			]
		}), compact ? /* @__PURE__ */ jsx(Text, {
			variant: "caption",
			tone: "muted",
			className: "truncate",
			children: active?.label ?? last?.label
		}) : /* @__PURE__ */ jsx("ol", {
			"aria-live": "polite",
			className: "flex flex-col gap-1.5 pl-0.5",
			children: steps.map((step) => /* @__PURE__ */ jsxs("li", {
				className: "flex items-start gap-2",
				children: [/* @__PURE__ */ jsxs("span", {
					"aria-hidden": "true",
					className: cn("mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-full border", step.status === "done" && "border-positive bg-positive text-fg-on-accent", step.status === "active" && "border-fg-accent bg-surface-selected text-fg-accent", step.status === "error" && "border-negative bg-negative text-fg-on-accent", step.status === "pending" && "border-line-default bg-surface-default"),
					children: [step.status === "done" ? /* @__PURE__ */ jsx(RiCheckLine, { className: "size-2.5" }) : null, step.status === "error" ? /* @__PURE__ */ jsx(RiAlertLine, { className: "size-2.5" }) : null]
				}), /* @__PURE__ */ jsxs("span", {
					className: "flex min-w-0 flex-1 flex-col gap-0.5",
					children: [/* @__PURE__ */ jsx("span", {
						className: cn("text-caption", step.status === "pending" ? "text-fg-muted" : "text-fg-secondary", step.status === "active" && "text-fg-primary"),
						children: step.label
					}), step.detail ? /* @__PURE__ */ jsx("span", {
						className: "text-micro text-fg-muted",
						children: step.detail
					}) : null]
				})]
			}, step.id))
		})]
	});
}
//#endregion
export { AgentActivity, ChatMessage, MessageList, PromptComposer, StreamingText, ToolCallTimeline };

//# sourceMappingURL=ai.js.map