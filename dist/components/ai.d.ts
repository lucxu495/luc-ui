import { ReactNode } from "react";
//#region src/components/ai.d.ts
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
export declare function StreamingText({ text, streaming, speed, caret, className, onComplete }: StreamingTextProps): import("react").JSX.Element | null;
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
export declare function ChatMessage({ from, author, timestamp, status, avatar, actions, footer, children, className, ...props }: ChatMessageProps): import("react").JSX.Element;
export interface MessageListProps extends React.ComponentPropsWithRef<"div"> {
  label?: string;
  /** Keep the newest message in view as it grows. Default `true`. */
  autoScroll?: boolean;
  /** How the log announces arrivals. Default `polite`. */
  live?: "off" | "polite";
}
export declare function MessageList({ label, autoScroll, live, className, children, ...props }: MessageListProps): import("react").JSX.Element;
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
export declare function PromptComposer({ value, defaultValue, onValueChange, onSubmit, busy, onStop, placeholder, label, disabled, toolbar, leading, maxLength, submitOnEnter, labels, className }: PromptComposerProps): import("react").JSX.Element;
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
export declare function ToolCallTimeline({ calls, label, defaultOpen, className, ...props }: ToolCallTimelineProps): import("react").JSX.Element;
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
export declare function AgentActivity({ steps, title, elapsed, label, compact, className, ...props }: AgentActivityProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=ai.d.ts.map