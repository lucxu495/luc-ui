import type { Metadata } from "next";
import { AppShellContent } from "@luc/ui";
import { ExperienceFrame } from "../../frame";
import { CopilotDesk } from "./site";

export const metadata: Metadata = { title: "AI workspace" };

export default function AiExperiencePage() {
  return (
    <AppShellContent width="bleed" className="min-h-screen px-4 py-8 sm:px-8">
      <ExperienceFrame
        kind="vertical"
        product="Copilot desk"
        title="An agent session that shows its work"
        lead="A message list that announces arrivals, an answer that streams with a caret, tool calls with their durations and outputs, agent steps that move from running to done, and a composer that swaps send for stop."
        components={["MessageList", "ChatMessage", "StreamingText", "ToolCallTimeline", "AgentActivity", "PromptComposer", "NativeSelect"]}
        journey="Ask about volatility, watch the answer stream while the tool timeline appears, press Stop mid-stream, then ask the drawdown question and get the prepared fallback when the question is off-script."
        appearance="Cobalt with the technical mono face — the type voice that says “this output is literal”."
        scope={{ palette: "cobalt", typeface: "technical" }}
      >
        <CopilotDesk />
      </ExperienceFrame>
    </AppShellContent>
  );
}
