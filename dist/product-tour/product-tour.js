"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { useReducedMotion as useReducedMotion$1 } from "../hooks/use-reduced-motion.js";
import { measureTarget, resolveTourTarget, revealTourTarget, sameTourRect } from "./engine.js";
import { ProductTourBubble } from "./bubble.js";
import { ProductTourSpotlight } from "./spotlight.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
//#region src/product-tour/product-tour.tsx
function useViewport() {
	const [viewport, setViewport] = useState(() => typeof window === "undefined" ? {
		width: 0,
		height: 0
	} : {
		width: window.innerWidth,
		height: window.innerHeight
	});
	useEffect(() => {
		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const visual = window.visualViewport;
				setViewport((current) => {
					const next = {
						width: visual?.width ?? window.innerWidth,
						height: visual?.height ?? window.innerHeight
					};
					return current.width === next.width && current.height === next.height ? current : next;
				});
			});
		};
		update();
		window.addEventListener("resize", update);
		window.visualViewport?.addEventListener("resize", update);
		window.visualViewport?.addEventListener("scroll", update);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("scroll", update);
		};
	}, []);
	return viewport;
}
function isVisiblePage() {
	return typeof document === "undefined" || document.visibilityState !== "hidden";
}
/**
* LUC ProductTour — a guided layer over a live product surface.
*
* Visual identity lives in `ProductTourBubble` and `ProductTourSpotlight`;
* positioning lives in the adapter (`engine.ts`), and this file owns only the
* lifecycle. The separation is intentional: a different positioning engine can
* replace the adapter without changing the public component contract.
*/
function ProductTour({ steps, intro, open: controlledOpen, defaultOpen = false, onOpenChange, stepIndex: controlledIndex, defaultStepIndex = 0, onStepChange, variant = "minimal-glass", mode = "manual", interval = 2e3, spotlight = true, onComplete, onSkip, onClose, onTargetUnavailable, onStatusChange, labels, className, ref }) {
	const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
	const [open, setOpen] = useControllableState({
		value: controlledOpen,
		defaultValue: defaultOpen,
		onChange: onOpenChange
	});
	const [index, setIndex] = useControllableState({
		value: controlledIndex,
		defaultValue: defaultStepIndex,
		onChange: (next) => {
			const step = steps[next];
			if (step) onStepChange?.(next, step);
		}
	});
	const safeIndex = Math.min(Math.max(index, 0), Math.max(0, steps.length - 1));
	const step = steps[safeIndex];
	const [introDone, setIntroDone] = useState(false);
	const introActive = Boolean(intro) && !introDone && steps.length > 0;
	const introTimed = introActive && (intro?.autoStartAfter ?? 0) > 0;
	const activeStep = useMemo(() => introActive && intro ? {
		id: "__product-tour-intro__",
		target: intro.target,
		eyebrow: intro.eyebrow,
		title: intro.title,
		description: intro.description,
		icon: intro.icon,
		placement: intro.placement,
		padding: intro.padding
	} : step, [
		intro,
		introActive,
		step
	]);
	const [rect, setRect] = useState(null);
	const [missing, setMissing] = useState(false);
	const [paused, setPaused] = useState(false);
	const [bubbleHovered, setBubbleHovered] = useState(false);
	const [targetEngaged, setTargetEngaged] = useState(false);
	const [pageVisible, setPageVisible] = useState(isVisiblePage);
	const [finalStatus, setFinalStatus] = useState("idle");
	const bubbleRef = useRef(null);
	const previousFocus = useRef(null);
	const viewport = useViewport();
	const reducedMotion = useReducedMotion$1();
	const titleId = useId();
	const descriptionId = useId();
	const statusId = useId();
	const stepRef = useRef(activeStep);
	const callbacks = useRef({
		onComplete,
		onSkip,
		onClose,
		onTargetUnavailable
	});
	useEffect(() => {
		callbacks.current = {
			onComplete,
			onSkip,
			onClose,
			onTargetUnavailable
		};
	}, [
		onClose,
		onComplete,
		onSkip,
		onTargetUnavailable
	]);
	useEffect(() => {
		stepRef.current = activeStep;
	}, [activeStep]);
	const autoPaused = paused || (mode === "auto" || introTimed) && (bubbleHovered || targetEngaged || !pageVisible);
	const status = !open ? finalStatus : autoPaused ? "paused" : "running";
	useEffect(() => {
		onStatusChange?.(status);
	}, [onStatusChange, status]);
	const dismiss = useCallback((kind) => {
		setIntroDone(true);
		setPaused(false);
		setFinalStatus(kind === "skip" ? "dismissed" : "dismissed");
		setOpen(false);
		if (kind === "skip") callbacks.current.onSkip?.();
		else callbacks.current.onClose?.();
	}, [setOpen]);
	const complete = useCallback(() => {
		setIntroDone(true);
		setPaused(false);
		setFinalStatus("completed");
		setOpen(false);
		callbacks.current.onComplete?.();
	}, [setOpen]);
	const goTo = useCallback((next) => {
		if (steps.length === 0) return;
		setIntroDone(true);
		const bounded = Math.min(Math.max(next, 0), steps.length - 1);
		if (bounded === safeIndex) return;
		if (mode === "auto") setPaused(true);
		setBubbleHovered(false);
		setIndex(bounded);
	}, [
		mode,
		safeIndex,
		setIndex,
		steps.length
	]);
	const autoAdvance = useCallback(() => {
		if (safeIndex >= steps.length - 1) return;
		setPaused(false);
		setBubbleHovered(false);
		setIndex(safeIndex + 1);
	}, [
		safeIndex,
		setIndex,
		steps.length
	]);
	const acceptIntro = useCallback(() => {
		setIntroDone(true);
		setPaused(false);
		setBubbleHovered(false);
	}, []);
	const advanceByTimer = useCallback(() => {
		if (introActive) acceptIntro();
		else autoAdvance();
	}, [
		acceptIntro,
		autoAdvance,
		introActive
	]);
	const next = useCallback(() => {
		if (introActive) {
			acceptIntro();
			return;
		}
		if (safeIndex >= steps.length - 1) complete();
		else goTo(safeIndex + 1);
	}, [
		acceptIntro,
		complete,
		goTo,
		introActive,
		safeIndex,
		steps.length
	]);
	const start = useCallback((nextIndex = 0) => {
		if (steps.length === 0) return;
		const boundedIndex = Math.min(Math.max(nextIndex, 0), steps.length - 1);
		setPaused(false);
		setBubbleHovered(false);
		setTargetEngaged(false);
		setRect(null);
		setMissing(false);
		setFinalStatus("idle");
		setIntroDone(!intro || boundedIndex !== 0);
		setIndex(boundedIndex);
		setOpen(true);
	}, [
		intro,
		setIndex,
		setOpen,
		steps.length
	]);
	useImperativeHandle(ref, () => ({
		start,
		next,
		previous: () => goTo(safeIndex - 1),
		goTo,
		pause: () => setPaused(true),
		resume: () => setPaused(false),
		skip: () => dismiss("skip"),
		complete,
		close: () => dismiss("close"),
		restart: () => start(0)
	}), [
		complete,
		dismiss,
		goTo,
		next,
		safeIndex,
		start
	]);
	useEffect(() => {
		if (!open) return;
		previousFocus.current = document.activeElement;
		const timer = window.setTimeout(() => bubbleRef.current?.focus(), 0);
		return () => {
			window.clearTimeout(timer);
			const previous = previousFocus.current;
			if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
		};
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const handleVisibility = () => setPageVisible(isVisiblePage());
		document.addEventListener("visibilitychange", handleVisibility);
		return () => document.removeEventListener("visibilitychange", handleVisibility);
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const handleFocus = (event) => {
			const target = stepRef.current ? resolveTourTarget(stepRef.current.target) : null;
			setTargetEngaged(Boolean(target && event.target instanceof Node && target.contains(event.target)));
		};
		document.addEventListener("focusin", handleFocus);
		return () => document.removeEventListener("focusin", handleFocus);
	}, [open]);
	const measuredRef = useRef(null);
	useEffect(() => {
		if (!open || !activeStep) return;
		let disposed = false;
		let frame = 0;
		let observer = null;
		let mutation = null;
		let retryTimers = [];
		let revealTimer = 0;
		let lastReveal = 0;
		const update = (reveal = false) => {
			if (disposed) return;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				if (disposed) return;
				if (!activeStep.target) {
					measuredRef.current = null;
					observer?.disconnect();
					observer = null;
					setMissing(false);
					setRect(null);
					return;
				}
				const target = resolveTourTarget(activeStep.target);
				if (!target) {
					measuredRef.current = null;
					observer?.disconnect();
					observer = null;
					setMissing(true);
					setRect(null);
					callbacks.current.onTargetUnavailable?.(activeStep);
					return;
				}
				if (measuredRef.current !== target) {
					measuredRef.current = target;
					observer?.disconnect();
					observer = new ResizeObserver(() => update(false));
					observer.observe(target);
					if (reveal) revealTourTarget(target, reducedMotion);
				}
				const nextRect = measureTarget(target, activeStep.padding ?? 8);
				setMissing(!nextRect);
				setRect((current) => sameTourRect(current, nextRect) ? current : nextRect);
				if (nextRect && (nextRect.top < 0 || nextRect.left < 0 || nextRect.top + nextRect.height > window.innerHeight || nextRect.left + nextRect.width > window.innerWidth) && Date.now() - lastReveal > 400) {
					lastReveal = Date.now();
					window.clearTimeout(revealTimer);
					revealTimer = window.setTimeout(() => revealTourTarget(target, reducedMotion), 40);
				}
			});
		};
		update(true);
		const handleViewportChange = () => update(false);
		mutation = new MutationObserver(() => {
			const target = resolveTourTarget(activeStep.target);
			if (!target || !target.isConnected || measuredRef.current !== target) update(false);
		});
		mutation.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: [
				"class",
				"style",
				"hidden",
				"disabled"
			]
		});
		retryTimers = [
			120,
			480,
			1200
		].map((delay) => window.setTimeout(() => update(false), delay));
		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, true);
		window.visualViewport?.addEventListener("scroll", handleViewportChange);
		return () => {
			disposed = true;
			cancelAnimationFrame(frame);
			observer?.disconnect();
			mutation?.disconnect();
			retryTimers.forEach((timer) => window.clearTimeout(timer));
			window.clearTimeout(revealTimer);
			window.removeEventListener("resize", handleViewportChange);
			window.removeEventListener("scroll", handleViewportChange, true);
			window.visualViewport?.removeEventListener("scroll", handleViewportChange);
		};
	}, [
		activeStep,
		open,
		reducedMotion
	]);
	useEffect(() => {
		if (!open || !activeStep) return;
		const handleKeyDown = (event) => {
			const active = document.activeElement;
			const editing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement || active instanceof HTMLElement && active.isContentEditable;
			if (event.key === "Escape") {
				event.preventDefault();
				dismiss("skip");
				return;
			}
			if (!editing && event.key === "ArrowRight") {
				event.preventDefault();
				next();
				return;
			}
			if (!editing && event.key === "ArrowLeft") {
				event.preventDefault();
				goTo(safeIndex - 1);
				return;
			}
			if (event.key !== "Tab") return;
			const target = resolveTourTarget(activeStep.target);
			const candidates = [...target ? [...target.matches("a[href], button, input, select, textarea, [tabindex]") ? [target] : [], ...Array.from(target.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"))] : [], ...Array.from(bubbleRef.current?.querySelectorAll("a[href], button, input, select, textarea, [tabindex]:not([tabindex=\"-1\"])") ?? [])].filter((node) => !node.hasAttribute("disabled") && !node.getAttribute("aria-hidden"));
			if (candidates.length === 0) return;
			const first = candidates[0];
			const last = candidates[candidates.length - 1];
			if (event.shiftKey && (active === first || !candidates.includes(active))) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && active === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		activeStep,
		dismiss,
		goTo,
		next,
		open,
		safeIndex
	]);
	if (!mounted || !activeStep) return null;
	return createPortal(/* @__PURE__ */ jsx(AnimatePresence, { children: open ? /* @__PURE__ */ jsxs(motion.div, {
		"data-slot": "product-tour",
		"data-variant": variant,
		"data-status": status,
		className,
		initial: reducedMotion ? false : { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: {
			duration: reducedMotion ? .001 : .22,
			ease: [
				.2,
				0,
				0,
				1
			]
		},
		children: [
			spotlight ? /* @__PURE__ */ jsx(ProductTourSpotlight, {
				rect,
				viewport,
				visible: true,
				variant,
				onDismiss: () => dismiss("close"),
				dismissLabel: labels?.close ?? "Close tour"
			}) : null,
			/* @__PURE__ */ jsx(AnimatePresence, {
				initial: false,
				children: /* @__PURE__ */ jsx(ProductTourBubble, {
					eyebrow: activeStep.eyebrow,
					title: activeStep.title,
					description: activeStep.description,
					icon: activeStep.icon,
					index: safeIndex,
					total: steps.length,
					placement: activeStep.placement ?? "auto",
					anchor: rect,
					variant,
					auto: mode === "auto" && !introActive,
					interval,
					paused: autoPaused,
					missing,
					intro: introActive,
					introAutoStartAfter: introActive ? intro?.autoStartAfter : void 0,
					onBack: () => goTo(safeIndex - 1),
					onNext: next,
					onAutoAdvance: advanceByTimer,
					onSkip: () => dismiss("skip"),
					onClose: () => dismiss("close"),
					onTogglePause: () => setPaused((current) => !current),
					labels,
					titleId,
					descriptionId,
					bubbleRef,
					onHoverChange: setBubbleHovered
				}, "bubble")
			}),
			/* @__PURE__ */ jsx("div", {
				id: statusId,
				role: "status",
				"aria-live": "polite",
				"aria-atomic": "true",
				className: "sr-only",
				children: introActive ? labels?.introStatus ?? "Tour welcome. Take the tour or explore on your own." : missing ? labels?.unavailableTitle ?? "Waiting for the highlighted element" : `${labels?.region ?? "Product tour"}. ${labels?.step?.(safeIndex + 1, steps.length) ?? `Step ${safeIndex + 1} of ${steps.length}`}.`
			})
		]
	}, "product-tour") : null }), document.body);
}
//#endregion
export { ProductTour };

//# sourceMappingURL=product-tour.js.map