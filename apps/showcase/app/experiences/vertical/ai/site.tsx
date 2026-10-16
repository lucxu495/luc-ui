"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentActivity,
  Badge,
  Button,
  Card,
  CardContent,
  ChatMessage,
  Field,
  MessageList,
  NativeSelect,
  PromptComposer,
  StreamingText,
  ToolCallTimeline,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

// Copilot desk — an agent session.
//
// This is the provider-neutral half of an AI interface: the library renders what
// the application supplies and never talks to a model. The canned answers below
// exist because a demo has to show something, and they are marked as canned in
// the page copy so nobody mistakes them for a model.
//
// Streaming is derived from the text that has arrived rather than stored as a
// flag (the pattern Phase 7 settled on), so the mount effect subscribes to one
// timer and writes no state of its own.

interface Turn {
  id: string;
  from: "user" | "assistant";
  body: string;
  tools?: Array<{ id: string; name: string; status: "done"; duration: string; output: string }>;
}

const ANSWERS: Array<{ match: RegExp; text: string; tools: Turn["tools"] }> = [
  {
    match: /vol|volatility|波动/i,
    text: "Realised volatility over the last twenty sessions is 18.4 %, against a sixty-session median of 14.1 %. The term structure is upward-sloping at the front: 17.1 % at one month, 19.8 % at twelve. That combination usually means the market is pricing a near-term event rather than a change in regime, so I would look at the event calendar before adjusting exposure.",
    tools: [
      {
        id: "t1",
        name: "metrics.realised_volatility",
        status: "done",
        duration: "84 ms",
        output: '{ "value": 0.184, "median60": 0.141 }',
      },
      {
        id: "t2",
        name: "series.term_structure",
        status: "done",
        duration: "112 ms",
        output: "[0.171, 0.178, 0.186, 0.198]",
      },
    ],
  },
  {
    match: /drawdown|underwater|回撤/i,
    text: "The current drawdown is 6.2 % from the running peak, reached eleven sessions ago, and the curve has not yet made a higher low. Two of the four factors are underwater; the momentum factor is carrying the book.",
    tools: [
      {
        id: "t1",
        name: "series.drawdown",
        status: "done",
        duration: "61 ms",
        output: '{ "current": -0.062, "trough": -0.062, "age": 11 }',
      },
    ],
  },
];

const FALLBACK = {
  text: "I can answer from two prepared sources in this demonstration: realised volatility and the current drawdown. Ask about either, and the tool calls that produced the numbers will appear under the answer.",
  tools: [] as Turn["tools"],
};

export function CopilotDesk() {
  const { tcs } = useI18n();
  const [turns, setTurns] = useState<Turn[]>([
    { id: "seed", from: "user", body: "How is realised volatility versus its sixty-session median?" },
  ]);
  const [streamed, setStreamed] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState("local-small");
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    setStreaming(false);
  }, []);

  const ask = useCallback(
    (value: string) => {
      const question = value.trim();
      if (!question) return;
      if (timer.current !== null) window.clearInterval(timer.current);
      const answer = ANSWERS.find((entry) => entry.match.test(question)) ?? FALLBACK;
      setTurns((current) => [
        ...current,
        { id: `u-${current.length}`, from: "user", body: question },
        { id: `a-${current.length}`, from: "assistant", body: answer.text, tools: answer.tools },
      ]);
      setStreamed("");
      setStreaming(true);
      let index = 0;
      timer.current = window.setInterval(() => {
        index += 6;
        setStreamed(answer.text.slice(0, index));
        if (index >= answer.text.length) {
          if (timer.current !== null) window.clearInterval(timer.current);
          timer.current = null;
          setStreaming(false);
        }
      }, 24);
    },
    [],
  );

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
    },
    [],
  );

  const lastAssistant = [...turns].reverse().find((turn) => turn.from === "assistant");

  return (
    <div data-slot="copilot-desk" data-streaming={streaming ? "true" : "false"} className="flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-6 py-4">
        <div className="flex flex-col">
          <h2 className="font-display text-heading-sm font-semibold text-fg-primary">Copilot desk</h2>
          <p className="text-caption text-fg-muted">
            {tcs("A research assistant that shows the calls behind every number.")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={streaming ? "info" : "neutral"} size="sm" dot>
            {streaming ? tcs("Streaming") : tcs("Idle")}
          </Badge>
          <NativeSelect
            aria-label={tcs("Model")}
            size="sm"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            options={[
              { value: "local-small", label: tcs("Local · small") },
              { value: "local-large", label: tcs("Local · large") },
              { value: "none", label: tcs("No model (dry run)") },
            ]}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-5 px-6 py-6">
        <AgentActivity
          label={tcs("Agent activity")}
          title={tcs("Retrieving the series before answering")}
          elapsed={streaming ? tcs("running") : "212 ms"}
          steps={[
            {
              id: "s1",
              label: tcs("Resolve the instrument"),
              detail: tcs("BTCUSD from the workspace default watchlist."),
              status: "done",
            },
            {
              id: "s2",
              label: tcs("Fetch the volatility window"),
              detail: tcs("Twenty and sixty sessions, daily close."),
              status: streaming ? "active" : "done",
            },
            {
              id: "s3",
              label: tcs("Write the answer"),
              detail: tcs("Only the numbers the two calls returned."),
              status: streaming ? "pending" : "done",
            },
          ]}
        />

        <Card variant="default">
          <CardContent className="p-5">
            <MessageList label={tcs("Conversation")} className="max-h-[26rem] gap-5">
              {turns.map((turn) => (
                <ChatMessage
                  key={turn.id}
                  from={turn.from}
                  timestamp={turn.from === "user" ? "09:41" : "09:41"}
                  status={
                    turn.id === lastAssistant?.id
                      ? streaming
                        ? "streaming"
                        : "complete"
                      : "complete"
                  }
                  footer={
                    turn.tools && turn.tools.length > 0 ? (
                      <ToolCallTimeline label={tcs("Tool calls")} calls={turn.tools} />
                    ) : null
                  }
                >
                  {turn.id === lastAssistant?.id && streamed ? (
                    <StreamingText text={streamed} streaming={streaming} />
                  ) : (
                    <p className="text-pretty">{tcs(turn.body)}</p>
                  )}
                </ChatMessage>
              ))}
            </MessageList>
          </CardContent>
        </Card>

        <PromptComposer
          label={tcs("Ask about the book")}
          placeholder={tcs("Ask about volatility or the current drawdown…")}
          busy={streaming}
          onStop={stop}
          onSubmit={ask}
          toolbar={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => ask("What is the current drawdown?")}
                disabled={streaming}
              >
                {tcs("Try the drawdown question")}
              </Button>
              <span className="text-micro text-fg-muted">
                {tcs("Answers in this demo are prepared, not generated.")}
              </span>
            </div>
          }
        />

        <Field
          label={tcs("What this demonstrates")}
          description={tcs(
            "Provider-neutral primitives: a message list that announces arrivals politely, a streamed answer with a caret, tool calls with durations, and a composer that swaps send for stop while a response is in flight.",
          )}
        >
          <span className="text-caption text-fg-muted">
            {tcs("Nothing here contacts a model. The library never has and never will.")}
          </span>
        </Field>
      </div>
    </div>
  );
}
