"use client";

/*
 * ChatMessage — one turn in a conversation.
 *
 * `from` is required and deliberately not called `role` (a `role` prop on a DOM
 * element collides with the ARIA attribute), so it is the first control and the
 * page copy explains the naming. The message body is the element's children, so
 * it is written into the body of the generated element rather than as an
 * attribute — which is also why the copied code stays valid as soon as the
 * reader edits the text.
 *
 * The status is a first-class control because it is the state that is hard to
 * review from a screenshot: `pending` recedes, `error` takes the negative
 * surface, and `streaming` says the turn is incomplete without pretending to be
 * a spinner.
 */

import type { ReactNode } from "react";
import { ChatMessage, Spinner } from "@luc/ui";
import { serializeProps } from "../engine";
import type { ControlValues, PlaygroundSpec } from "../types";

type ChatRole = "user" | "assistant" | "system" | "tool";
type ChatStatus = "complete" | "streaming" | "pending" | "error";

const ROLES = ["assistant", "user", "system", "tool"] as const;
const STATUSES = ["complete", "streaming", "pending", "error"] as const;

interface Slot {
  label: string;
  code: string;
  node: ReactNode;
}

/* `glyph` means "keep the component's own role glyph", which is the honest
 * default: the component's vocabulary of four glyphs is part of its design. */
const AVATARS: Record<string, Slot> = {
  glyph: { label: "Role glyph", code: "", node: undefined },
  spinner: { label: "Spinner", code: "<Spinner size={14} />", node: <Spinner size={14} /> },
  dot: { label: "Dot", code: '<span aria-hidden="true">•</span>', node: <span aria-hidden="true">•</span> },
};

const MESSAGE = "Three positions were rebalanced this morning.";

export const chatMessagePlayground: PlaygroundSpec = {
  id: "chat-message",
  component: "ChatMessage",
  importPath: "@luc/ui",
  extraImports: [`import { Spinner } from "@luc/ui";`],
  stageNote: "A real turn: the body wraps, the timestamp is text you supply, and the status changes the surface.",
  presetSource: "from",
  controls: [
    {
      kind: "enum",
      name: "from",
      /* "From" is already a dictionary key meaning "the start of a range" in
       * Chinese, and the panel looks a label up by its English source; naming the
       * control by what it is avoids inheriting the wrong meaning. */
      label: "Sender",
      default: "assistant",
      options: ROLES.map((value) => ({ value })),
      help: "Who the turn came from. It is `from`, not `role`, so a consumer's jsx-a11y lint stays clean.",
      /* `from` is required by `ChatMessageProps`: omitting it is a compile error
       * in the reader's editor, not a default the library supplies. */
      required: true,
    },
    {
      kind: "text",
      name: "author",
      label: "Author",
      default: "",
      group: "variant",
      help: "A display name. Empty keeps the component's own word for the role.",
    },
    {
      kind: "text",
      name: "children",
      label: "Message",
      default: MESSAGE,
      placement: { kind: "body" },
    },
    {
      kind: "enum",
      name: "status",
      label: "Status",
      default: "complete",
      group: "variant",
      options: STATUSES.map((value) => ({ value })),
      help: "`pending` recedes, `error` takes the negative surface, `streaming` marks an unfinished turn.",
    },
    {
      kind: "text",
      name: "timestamp",
      label: "Timestamp",
      default: "09:31 UTC",
      group: "advanced",
      help: "Pre-formatted by you: a relative time is a product decision, and the component never guesses one.",
    },
    {
      kind: "slot",
      name: "avatar",
      label: "Avatar",
      default: "glyph",
      group: "variant",
      placement: { kind: "composed" },
      options: Object.entries(AVATARS).map(([value, slot]) => ({ value, label: slot.label })),
      help: "Replaces the role glyph; the accessible name still comes from the author.",
    },
  ],
  unsupported: [
    {
      name: "actions",
      reason: "Copy, regenerate and rate need your callbacks, and they are revealed on hover.",
    },
    {
      name: "footer",
      reason: "Sources, tool calls and attachments are your data, rendered under the body.",
    },
    {
      name: "className",
      reason: "Width and placement belong to the conversation layout that mounts the message.",
    },
  ],
  render: (values: ControlValues) => {
    const author = String(values.author);
    const timestamp = String(values.timestamp);
    return (
      <ChatMessage
        from={String(values.from) as ChatRole}
        author={author === "" ? undefined : author}
        status={String(values.status) as ChatStatus}
        timestamp={timestamp === "" ? undefined : timestamp}
        avatar={AVATARS[String(values.avatar)]?.node}
      >
        {String(values.children)}
      </ChatMessage>
    );
  },
  serialize: (values: ControlValues) => {
    const avatar = AVATARS[String(values.avatar)];
    const slots = avatar && avatar.code ? ` avatar={${avatar.code}}` : "";
    return `<ChatMessage${serializeProps(chatMessagePlayground, values)}${slots}>\n  ${String(values.children)}\n</ChatMessage>`;
  },
};
