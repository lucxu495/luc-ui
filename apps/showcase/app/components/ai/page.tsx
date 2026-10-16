"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentActivity,
  Button,
  Card,
  ChatMessage,
  MessageList,
  PromptComposer,
  Section,
  StreamingText,
  Text,
  ToolCallTimeline,
} from "@luc/ui";
import { RiRefreshLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Example } from "@/components/docs/example";
import { EntryFooter } from "@/components/docs/entry-footer";
import { FamilyImports } from "@/components/docs/family-imports";
import { PropsTable } from "@/components/docs/tables";
import { PlaygroundSection } from "@/components/docs/playground-section";
import { useI18n } from "@/lib/i18n/provider";

// The "model" is a fixed string written out on a timer. Nothing here calls a
// provider: the point of the page is the surface, and a canned sentence is a
// more honest fixture than a demo that needs an API key to render.
const ANSWER =
  "The 20-day realised volatility is 18.4%, against a 60-day median of 14.1%. The move is concentrated in the last three sessions, and the term structure is still upward sloping, so nothing in the supplied data points to a regime break yet.";

export default function AiPage() {
  const { tc, tcs } = useI18n();
  const [streamed, setStreamed] = useState("");
  const [prompt, setPrompt] = useState("");
  const timer = useRef<number | null>(null);

  /*
   * Streaming is derived, not stored.
   *
   * The demo used to keep a `streaming` flag that had to be set synchronously
   * when the stream started, which meant the mount effect wrote state and React
   * (correctly) objected: an effect that calls `setState` in its body is a
   * cascading render. Deriving it from the text that has arrived removes the
   * flag, keeps the caret honest, and lets the mount effect do exactly one
   * thing — subscribe to a timer.
   */
  const streaming = streamed.length > 0 && streamed.length < ANSWER.length;

  /**
   * Subscribe to the timer that writes the canned answer out one tick at a time.
   *
   * It touches a ref and a timer and nothing else — no state is written here, so
   * the mount effect below is a real subscription rather than a cascading
   * render. `replay` is this plus the reset.
   */
  const startStream = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current);
    let index = 0;
    timer.current = window.setInterval(() => {
      index += 3;
      setStreamed(ANSWER.slice(0, index));
      if (index >= ANSWER.length) {
        if (timer.current !== null) window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 30);
  }, []);

  const replay = useCallback(() => {
    setStreamed("");
    startStream();
  }, [startStream]);

  useEffect(() => {
    /*
     * Start the stream on mount.
     *
     * The page's whole subject is the streaming surface, and a first paint with
     * an empty assistant turn (the answer only ever arrived after a click) read
     * as a broken message bubble. The first tick lands 30 ms later, so the
     * opening frame is "nothing to show yet", not an empty bubble.
     */
    startStream();
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    };
  }, [startStream]);

  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Components")} title="AI surface" lead={tc("components.ai.lead")} />

      <Example
        title={tc("components.ai.thread.title")}
        description={tc("components.ai.thread.lead")}
        layout="block"
        code={'<MessageList><ChatMessage from="assistant">…</ChatMessage></MessageList>'}
      >

        <Card variant="outline" className="p-4">
          <MessageList label={tc("components.ai.thread.label")} className="max-h-[420px] gap-5">
            <ChatMessage from="user" timestamp="09:41">
              {tc("components.ai.thread.question")}
            </ChatMessage>
            <ChatMessage
              from="assistant"
              timestamp="09:41"
              status={streaming ? "streaming" : "complete"}
              footer={
                <ToolCallTimeline
                  label={tc("components.ai.tools.label")}
                  calls={[
                    {
                      id: "t1",
                      name: "metrics.realised_volatility",
                      status: "done",
                      duration: "84 ms",
                      input: '{ "symbol": "BTCUSD", "window": 20 }',
                      output: '{ "value": 0.184, "median60": 0.141 }',
                    },
                    {
                      id: "t2",
                      name: "series.term_structure",
                      status: "done",
                      duration: "112 ms",
                      output: "[0.171, 0.178, 0.186, 0.198]",
                    },
                  ]}
                />
              }
            >
              <StreamingText text={streamed} streaming={streaming} />
            </ChatMessage>
            <ChatMessage from="assistant" status="error" author={tc("components.ai.thread.errorAuthor")}>
              <Text variant="caption">{tc("components.ai.thread.error")}</Text>
            </ChatMessage>
          </MessageList>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={replay} disabled={streaming}>
              <RiRefreshLine aria-hidden="true" className="size-4" />
              {tc("components.ai.thread.replay")}
            </Button>
            <Text variant="caption" tone="muted">
              {tc("components.ai.thread.replayHint")}
            </Text>
          </div>
        </Card>
      </Example>

      {/* UX-003: the specimen first, the configuration form after it. */}
      <PlaygroundSection entryId="ai" />

      <Example
        title={tc("components.ai.agent.title")}
        description={tc("components.ai.agent.lead")}
        layout="grid"
        code={"<AgentActivity steps={steps} />"}
      >

        <AgentActivity
          title={tc("components.ai.agent.running")}
          elapsed="6.2s"
          steps={[
            { id: "s1", label: tc("components.ai.agent.s1"), status: "done" },
            { id: "s2", label: tc("components.ai.agent.s2"), status: "done", detail: tc("components.ai.agent.s2d") },
            { id: "s3", label: tc("components.ai.agent.s3"), status: "active" },
            { id: "s4", label: tc("components.ai.agent.s4"), status: "pending" },
          ]}
        />
        <AgentActivity
          compact
          title={tc("components.ai.agent.compact")}
          steps={[
            { id: "c1", label: tc("components.ai.agent.s1"), status: "done" },
            { id: "c2", label: tc("components.ai.agent.s2"), status: "active" },
          ]}
        />
      </Example>

      <Example
        title={tc("components.ai.composer.title")}
        description={tc("components.ai.composer.lead")}
        layout="block"
        code={"<PromptComposer onSubmit={send} busy={busy} onStop={stop} />"}
      >

        <PromptComposer
          value={prompt}
          onValueChange={setPrompt}
          onSubmit={() => setPrompt("")}
          label={tc("components.ai.composer.label")}
          placeholder={tc("components.ai.composer.placeholder")}
          labels={{ hint: tc("components.ai.composer.hint"), send: tc("components.ai.composer.send") }}
          toolbar={
            <Text variant="micro" tone="muted">
              {tc("components.ai.composer.model")}
            </Text>
          }
        />
      </Example>

      {/* UX-003: the family pages had no installation guidance at all — the
        * generated one is built from a single registry entry, and these pages
        * document a set of exports. This states the imports the specimens above
        * actually use and points at the real package setup. */}
      <Section title={tcs("Import")}>
        <FamilyImports
          imports={[
            'import { MessageList, ChatMessage, StreamingText, ToolCallTimeline } from "@luc/ui";',
            'import { PromptComposer, AgentActivity } from "@luc/ui";',
          ]}
        />
      </Section>

      <Section title={tc("components.ai.api.title")} description={tc("components.ai.api.lead")}>
        <PropsTable
          rows={[
            {
              name: "ChatMessage.from",
              type: '"user" | "assistant" | "system" | "tool"',
              description: tc("components.ai.api.from"),
            },
            {
              name: "ChatMessage.status",
              type: '"complete" | "streaming" | "pending" | "error"',
              description: tc("components.ai.api.status"),
            },
            { name: "StreamingText.speed", type: "number", description: tc("components.ai.api.speed") },
            { name: "PromptComposer.onSubmit", type: "(value: string) => void", description: tc("components.ai.api.submit") },
            { name: "ToolCallTimeline.calls", type: "ToolCall[]", description: tc("components.ai.api.calls") },
          ]}
        />
        <Text variant="caption" tone="muted">
          {tc("components.ai.api.note")}
        </Text>
      </Section>

      <EntryFooter entryId="ai" />
    </DocPage>
  );
}
