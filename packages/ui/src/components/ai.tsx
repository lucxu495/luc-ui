"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  RiAlertLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiLoaderLine,
  RiRobot2Line,
  RiSendPlaneLine,
  RiSparklingLine,
  RiStopCircleLine,
  RiToolsLine,
  RiUserLine,
} from "@remixicon/react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { IconButton } from "./icon-button";
import { Text } from "./typography";

/**
 * LUC AI surface — provider-neutral chat, streaming, tools and agent state.
 *
 * This file contains **no model, no transport and no provider SDK**, and that
 * is a design constraint rather than an omission. Whatever the application
 * receives — a hosted stream, a local model, a scripted demo — it hands the
 * *text* and the *tool records* to these components. Nothing here infers,
 * summarises, retries or extracts hidden reasoning: whatever the application did
 * not supply is not rendered, which keeps a UI component from ever presenting a
 * chain of thought as if the model had published one.
 *
 *   ChatMessage        one turn, from an identified author
 *   MessageList        a `log` region with optional follow-the-tail scrolling
 *   StreamingText      text that arrives character by character
 *   PromptComposer     the input, with Enter-to-send and a stop control
 *   ToolCallTimeline   the tool calls a turn made, as a disclosure list
 *   AgentActivity      the *declared* steps of a running process
 */

/* -------------------------------------------------------------------------- */
/* StreamingText                                                               */
/* -------------------------------------------------------------------------- */

export interface StreamingTextProps {
  /** The full text so far. Replace it as more arrives; the reveal follows. */
  text: string;
  /** `true` while the model is still writing. */
  streaming?: boolean;
  /** Characters per second. Default 60. */
  speed?: number;
  /** Show the caret while streaming. Default `true`. */
  caret?: boolean;
  className?: string;
  /** Called once the reveal catches up with `text`. Keep it referentially stable. */
  onComplete?: () => void;
}

export function StreamingText({
  text,
  streaming = false,
  speed = 60,
  caret = true,
  className,
  onComplete,
}: StreamingTextProps) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(() => text.length);
  const countRef = useRef(count);
  const completeRef = useRef(onComplete);
  // Sync after commit, not during render: the rAF loop below owns the refs.
  useEffect(() => {
    countRef.current = count;
    completeRef.current = onComplete;
  });

  useEffect(() => {
    if (reduced || !streaming) return;
    let raf = 0;
    let last = performance.now();
    let chars = countRef.current > text.length ? 0 : countRef.current;
    const tick = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      chars = Math.min(text.length, chars + elapsed * speed);
      setCount(Math.floor(chars));
      if (chars < text.length) raf = window.requestAnimationFrame(tick);
      else completeRef.current?.();
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [reduced, speed, streaming, text]);

  const visible = streaming && !reduced ? text.slice(0, count) : text;
  const caughtUp = count >= text.length;

  /*
   * Nothing to show and nothing on the way: render nothing.
   *
   * A caller that seeds the thread with an assistant turn and starts streaming
   * on mount will render this once with `text === ""`. Returning an empty
   * `<span>` left `ChatMessage`'s bubble painted around no content, which reads
   * as a broken message rather than as a message that has not started. While
   * `streaming` is true the caret still renders, so the "waiting for the first
   * token" state stays visible.
   */
  if (!streaming && text === "") return null;

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {/*
        One text node. The reveal is a substring, never per-character elements,
        so a screen reader reads the sentence once instead of spelling it out.
      */}
      {visible}
      {caret && streaming ? (
        <span
          aria-hidden="true"
          className={cn(
            "ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-fg-accent align-baseline",
            caughtUp ? "opacity-40" : "animate-pulse-soft",
          )}
        />
      ) : null}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ChatMessage / MessageList                                                   */
/* -------------------------------------------------------------------------- */

export type ChatRole = "user" | "assistant" | "system" | "tool";
export type ChatStatus = "complete" | "streaming" | "pending" | "error";

export interface ChatMessageProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Who the turn came from.
   *
   * Deliberately **not** called `role`: on a component that renders a DOM
   * element, a prop named `role` collides with the ARIA attribute and every
   * consumer with `eslint-plugin-jsx-a11y` gets a false "invalid aria role"
   * error on their own call site. `from` says the same thing and lints clean.
   */
  from: ChatRole;
  /** Display name. Defaults to a word for the role. */
  author?: string;
  /** Pre-formatted by the caller — a relative time is a product decision. */
  timestamp?: ReactNode;
  status?: ChatStatus;
  /** Replaces the role glyph. */
  avatar?: ReactNode;
  /** Actions revealed on hover or focus — copy, regenerate, rate. */
  actions?: ReactNode;
  /** Rendered under the body: sources, tool calls, attachments. */
  footer?: ReactNode;
  children?: ReactNode;
}

const ROLE_LABEL: Record<ChatRole, string> = {
  user: "You",
  assistant: "Assistant",
  system: "System",
  tool: "Tool",
};

const roleGlyph: Record<ChatRole, ReactNode> = {
  user: <RiUserLine />,
  assistant: <RiSparklingLine />,
  system: <RiRobot2Line />,
  tool: <RiToolsLine />,
};

export function ChatMessage({
  from,
  author,
  timestamp,
  status = "complete",
  avatar,
  actions,
  footer,
  children,
  className,
  ...props
}: ChatMessageProps) {
  const name = author ?? ROLE_LABEL[from];
  const isUser = from === "user";

  return (
    <div
      data-slot="chat-message"
      data-role={from}
      role="group"
      aria-label={name}
      className={cn("group/message flex flex-col gap-1.5", isUser ? "items-end" : "items-start", className)}
      {...props}
    >
      <div className={cn("flex items-center gap-1.5 px-1", isUser && "flex-row-reverse")}>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full text-micro",
            isUser ? "bg-surface-interactive text-fg-secondary" : "bg-surface-selected text-fg-accent",
          )}
        >
          {avatar ?? roleGlyph[from]}
        </span>
        <Text variant="micro" tone="muted">
          {name}
        </Text>
        {timestamp ? (
          <Text variant="micro" tone="muted" className="luc-numeric">
            {timestamp}
          </Text>
        ) : null}
      </div>

      <div
        className={cn(
          "luc-transition relative max-w-[min(46rem,92%)] rounded-lg px-3.5 py-2.5 text-body",
          isUser
            ? "bg-accent-default text-fg-on-accent shadow-rest"
            : "border border-line-subtle bg-surface-default text-fg-primary luc-rest",
          status === "error" && "border-negative-line bg-negative-soft",
          status === "pending" && "opacity-80",
        )}
      >
        {children}
      </div>

      {footer ? <div className="w-full max-w-[min(46rem,92%)]">{footer}</div> : null}

      {actions ? (
        <div
          className={cn(
            "flex items-center gap-1 px-1 opacity-0 luc-transition",
            "group-hover/message:opacity-100 group-focus-within/message:opacity-100",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export interface MessageListProps extends React.ComponentPropsWithRef<"div"> {
  label?: string;
  /** Keep the newest message in view as it grows. Default `true`. */
  autoScroll?: boolean;
  /** How the log announces arrivals. Default `polite`. */
  live?: "off" | "polite";
}

export function MessageList({
  label = "Conversation",
  autoScroll = true,
  live = "polite",
  className,
  children,
  ...props
}: MessageListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Follow the tail only while the reader is already at the tail. Scrolling up
  // to re-read an earlier answer must not be yanked back down by a new token.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || !autoScroll || !pinned.current) return;
    node.scrollTop = node.scrollHeight;
  });

  return (
    <div
      ref={ref}
      data-slot="message-list"
      role="log"
      aria-label={label}
      aria-live={live}
      aria-relevant="additions text"
      onScroll={(event) => {
        const node = event.currentTarget;
        pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
      }}
      className={cn("flex flex-col gap-4 overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PromptComposer                                                              */
/* -------------------------------------------------------------------------- */

export interface PromptComposerLabels {
  send?: string;
  stop?: string;
  hint?: string;
}

export interface PromptComposerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the trimmed value on Enter or the send button. */
  onSubmit: (value: string) => void;
  /** Shown while a response is in flight; swaps send for stop. */
  busy?: boolean;
  onStop?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  /** Slot for model pickers, attachments, token counters. */
  toolbar?: ReactNode;
  /** Slot rendered above the field, e.g. an attachment tray. */
  leading?: ReactNode;
  maxLength?: number;
  /** Send on Enter without Shift. Default `true`. */
  submitOnEnter?: boolean;
  labels?: PromptComposerLabels;
  className?: string;
}

export function PromptComposer({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  busy = false,
  onStop,
  placeholder = "Ask anything…",
  label = "Prompt",
  disabled = false,
  toolbar,
  leading,
  maxLength,
  submitOnEnter = true,
  labels,
  className,
}: PromptComposerProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const text = controlled ? (value as string) : internal;
  const fieldId = `${label.replace(/\s+/g, "-").toLowerCase()}-field`;

  const update = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || busy) return;
    onSubmit(trimmed);
    update("");
  }, [busy, disabled, onSubmit, text, update]);

  return (
    <form
      data-slot="prompt-composer"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(
        "luc-transition flex flex-col gap-2 rounded-lg border border-line-default bg-surface-overlay p-2.5 luc-float",
        "focus-within:border-line-accent",
        disabled && "opacity-60",
        className,
      )}
    >
      {leading}
      <label className="sr-only" htmlFor={fieldId}>
        {label}
      </label>
      <textarea
        id={fieldId}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={1}
        onChange={(event) => update(event.target.value)}
        onKeyDown={(event) => {
          if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        className={cn(
          "max-h-40 min-h-11 w-full resize-none bg-transparent px-1.5 py-2 text-body text-fg-primary",
          "outline-none placeholder:text-fg-muted",
        )}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">{toolbar}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          {labels?.hint ? (
            <Text variant="micro" tone="muted" className="hidden sm:block">
              {labels.hint}
            </Text>
          ) : null}
          {busy && onStop ? (
            <IconButton
              type="button"
              variant="ghost"
              size="md"
              label={labels?.stop ?? "Stop generating"}
              icon={<RiStopCircleLine />}
              onClick={onStop}
            />
          ) : (
            <IconButton
              type="submit"
              variant="accent"
              size="md"
              disabled={disabled || text.trim().length === 0}
              label={labels?.send ?? "Send prompt"}
              icon={<RiSendPlaneLine />}
            />
          )}
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* ToolCallTimeline                                                            */
/* -------------------------------------------------------------------------- */

export type ToolCallStatus = "pending" | "running" | "done" | "error";

export interface ToolCall {
  id: string;
  /** The tool or function name, exactly as the application calls it. */
  name: string;
  status: ToolCallStatus;
  /** Already-formatted arguments. Rendered verbatim. */
  input?: ReactNode;
  /** Already-formatted result. Rendered verbatim. */
  output?: ReactNode;
  /** Pre-formatted duration, e.g. `412 ms`. */
  duration?: ReactNode;
  error?: ReactNode;
}

export interface ToolCallTimelineProps extends React.ComponentPropsWithRef<"ol"> {
  calls: readonly ToolCall[];
  label?: string;
  /** Start with every row expanded. Default `false`. */
  defaultOpen?: boolean;
}

const toolStatusTone: Record<ToolCallStatus, string> = {
  pending: "text-fg-muted",
  running: "text-fg-accent",
  done: "text-positive",
  error: "text-negative",
};

export function ToolCallTimeline({
  calls,
  label = "Tool calls",
  defaultOpen = false,
  className,
  ...props
}: ToolCallTimelineProps) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(calls.map((call) => [call.id, defaultOpen])),
  );

  return (
    <ol data-slot="tool-call-timeline" aria-label={label} className={cn("flex flex-col gap-1.5", className)} {...props}>
      {calls.map((call) => {
        const expanded = open[call.id] ?? defaultOpen;
        const hasDetail = Boolean(call.input ?? call.output ?? call.error);
        return (
          <li key={call.id} className="luc-transition overflow-hidden rounded-md border border-line-subtle bg-surface-sunken">
            <button
              type="button"
              aria-expanded={hasDetail ? expanded : undefined}
              disabled={!hasDetail}
              onClick={() => setOpen((current) => ({ ...current, [call.id]: !expanded }))}
              className={cn(
                "luc-focus-inset flex w-full items-center gap-2 px-2.5 py-2 text-left",
                hasDetail && "hover:bg-surface-interactive-hover",
              )}
            >
              <span aria-hidden="true" className={cn("grid size-3.5 shrink-0 place-items-center", toolStatusTone[call.status])}>
                {call.status === "done" ? (
                  <RiCheckLine className="size-3.5" />
                ) : call.status === "error" ? (
                  <RiAlertLine className="size-3.5" />
                ) : call.status === "running" ? (
                  <RiLoaderLine className="size-3.5 animate-spin" />
                ) : (
                  <RiToolsLine className="size-3.5" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-caption text-fg-primary">{call.name}</span>
              {call.duration ? (
                <span className="shrink-0 text-micro text-fg-muted luc-numeric">{call.duration}</span>
              ) : null}
              {hasDetail ? (
                <RiArrowRightSLine
                  aria-hidden="true"
                  className={cn("size-4 shrink-0 text-fg-muted luc-transition", expanded && "rotate-90")}
                />
              ) : null}
            </button>
            {expanded && hasDetail ? (
              <div className="flex flex-col gap-2 border-t border-line-subtle px-2.5 py-2">
                {call.input ? (
                  <Detail label="Input">
                    <pre className="luc-table-scroll overflow-x-auto font-mono text-caption text-fg-secondary">{call.input}</pre>
                  </Detail>
                ) : null}
                {call.output ? (
                  <Detail label="Result">
                    <pre className="luc-table-scroll overflow-x-auto font-mono text-caption text-fg-secondary">{call.output}</pre>
                  </Detail>
                ) : null}
                {call.error ? (
                  <Detail label="Error">
                    <p className="font-mono text-caption text-negative">{call.error}</p>
                  </Detail>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Text variant="micro" tone="muted">
        {label}
      </Text>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* AgentActivity                                                               */
/* -------------------------------------------------------------------------- */

export type AgentStepStatus = "pending" | "active" | "done" | "error";

export interface AgentStep {
  id: string;
  label: ReactNode;
  detail?: ReactNode;
  status: AgentStepStatus;
}

export interface AgentActivityProps extends Omit<React.ComponentPropsWithRef<"div">, "title"> {
  steps: readonly AgentStep[];
  /** What the agent is doing, in the application's own words. */
  title?: ReactNode;
  /** Pre-formatted elapsed time. */
  elapsed?: ReactNode;
  label?: string;
  /** Collapse to a one-line summary. Default `false`. */
  compact?: boolean;
}

/**
 * `AgentActivity` renders the steps the application *declares*. It has no
 * concept of hidden reasoning and no affordance for revealing any — the only
 * text it can show is text its caller passed in.
 */
export function AgentActivity({
  steps,
  title = "Working",
  elapsed,
  label = "Agent activity",
  compact = false,
  className,
  ...props
}: AgentActivityProps) {
  const active = steps.find((step) => step.status === "active");
  const done = steps.filter((step) => step.status === "done").length;
  const last = steps[steps.length - 1];

  return (
    <div
      data-slot="agent-activity"
      aria-label={label}
      className={cn(
        "luc-transition flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-sunken p-3 luc-well",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-full bg-surface-selected text-fg-accent",
            active && "animate-pulse-soft",
          )}
        >
          <RiSparklingLine className="size-3" />
        </span>
        <Text variant="label" className="min-w-0 flex-1 truncate text-fg-primary">
          {title}
        </Text>
        <Text variant="micro" tone="muted" className="shrink-0 luc-numeric">
          {elapsed ?? `${done}/${steps.length}`}
        </Text>
      </div>

      {compact ? (
        <Text variant="caption" tone="muted" className="truncate">
          {active?.label ?? last?.label}
        </Text>
      ) : (
        <ol aria-live="polite" className="flex flex-col gap-1.5 pl-0.5">
          {steps.map((step) => (
            <li key={step.id} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-[3px] grid size-3.5 shrink-0 place-items-center rounded-full border",
                  step.status === "done" && "border-positive bg-positive text-fg-on-accent",
                  step.status === "active" && "border-fg-accent bg-surface-selected text-fg-accent",
                  step.status === "error" && "border-negative bg-negative text-fg-on-accent",
                  step.status === "pending" && "border-line-default bg-surface-default",
                )}
              >
                {step.status === "done" ? <RiCheckLine className="size-2.5" /> : null}
                {step.status === "error" ? <RiAlertLine className="size-2.5" /> : null}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-caption",
                    step.status === "pending" ? "text-fg-muted" : "text-fg-secondary",
                    step.status === "active" && "text-fg-primary",
                  )}
                >
                  {step.label}
                </span>
                {step.detail ? <span className="text-micro text-fg-muted">{step.detail}</span> : null}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
