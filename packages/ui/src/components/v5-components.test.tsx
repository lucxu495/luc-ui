import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AgentActivity,
  ChatMessage,
  FileUpload,
  GuidedTour,
  ImageCompare,
  ImageGallery,
  KanbanBoard,
  Lightbox,
  MessageList,
  NotificationCenter,
  PromptComposer,
  SortableList,
  StreamingText,
  ToolCallTimeline,
  TransferList,
  TreeView,
} from "../index";
import { parseHexColor, hsvToRgb, rgbToHsv, formatHexColor, contrastRatio } from "../utils/color";

describe("colour maths", () => {
  it("round-trips hex through HSV without drifting", () => {
    const parsed = parseHexColor("#3b6ef5");
    expect(parsed).not.toBeNull();
    expect(formatHexColor(hsvToRgb(rgbToHsv(parsed!)))).toBe("#3b6ef5");
  });

  it("returns null for anything that is not a hex colour", () => {
    expect(parseHexColor("rebeccapurple")).toBeNull();
    expect(parseHexColor("#12")).toBeNull();
  });

  it("orders contrast the way WCAG does", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});

describe("TreeView", () => {
  const nodes = [
    {
      id: "market",
      label: "Market",
      children: [
        { id: "equities", label: "Equities" },
        { id: "rates", label: "Rates" },
      ],
    },
    { id: "research", label: "Research" },
  ];

  it("states the shape of the tree to assistive technology", () => {
    render(<TreeView nodes={nodes} defaultExpandedIds={["market"]} label="Sections" />);
    const items = screen.getAllByRole("treeitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveAttribute("aria-expanded", "true");
    expect(items[0]).toHaveAttribute("aria-level", "1");
    expect(items[0]).toHaveAttribute("aria-setsize", "2");
    expect(items[1]).toHaveAttribute("aria-level", "2");
  });

  it("walks the visible rows with the arrow keys", async () => {
    render(<TreeView nodes={nodes} label="Sections" />);
    const market = screen.getAllByRole("treeitem")[0]!;
    market.focus();
    await userEvent.keyboard("{ArrowRight}");
    const rows = screen.getAllByRole("treeitem");
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    // The next ArrowRight steps into the first child.
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getAllByRole("treeitem")[1]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("treeitem")[0]).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getAllByRole("treeitem")[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("reports selection with the node it belongs to", async () => {
    const onSelect = vi.fn();
    render(<TreeView nodes={nodes} label="Sections" onSelect={onSelect} />);
    await userEvent.click(screen.getByText("Research"));
    expect(onSelect).toHaveBeenCalledWith("research", expect.objectContaining({ id: "research" }));
    expect(screen.getByText("Research").closest("[role=treeitem]")).toHaveAttribute("aria-selected", "true");
  });

  /*
   * The roving Tab stop is the one invariant a tree cannot lose: this is a single
   * stop for the whole control, so if no *visible* row holds it, the tree has no
   * keyboard way in at all. These three cases are the ways the Navigation review
   * found it being lost or wasted.
   */
  it("keeps exactly one visible row in the tab order when a controlled collapse hides the focused one", () => {
    const { rerender } = render(<TreeView nodes={nodes} expandedIds={["market"]} label="Sections" />);
    const child = screen.getAllByRole("treeitem")[1]!;
    child.focus();
    expect(child).toHaveFocus();

    rerender(<TreeView nodes={nodes} expandedIds={[]} label="Sections" />);
    const stops = screen.getAllByRole("treeitem").filter((row) => row.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveTextContent("Market");
  });

  it("hands the stop back to the branch when its chevron collapses it", async () => {
    render(<TreeView nodes={nodes} defaultExpandedIds={["market"]} label="Sections" />);
    const market = screen.getAllByRole("treeitem")[0]!;
    screen.getAllByRole("treeitem")[1]!.focus();

    /* The chevron is `aria-hidden` and outside the tab order, so it is reached
     * through the row rather than by accessible name — which is exactly why the
     * focus has to be put back on the row after the click. */
    const chevron = market.querySelector("button")!;
    await userEvent.click(chevron);

    expect(market).toHaveFocus();
    expect(market).toHaveAttribute("aria-expanded", "false");
    const stops = screen.getAllByRole("treeitem").filter((row) => row.getAttribute("tabindex") === "0");
    expect(stops).toHaveLength(1);
  });

  it("expands only the focused row's siblings with *", () => {
    /* ARIA's `*` is level-scoped, which is what this module's contract and the
     * CHANGELOG have always said; it used to open every branch in the tree. */
    const deep = [
      { id: "a", label: "A", children: [{ id: "a1", label: "A1", children: [{ id: "a1x", label: "A1X" }] }] },
      { id: "b", label: "B", children: [{ id: "b1", label: "B1" }] },
    ];
    render(<TreeView nodes={deep} label="Sections" />);
    const first = screen.getAllByRole("treeitem")[0]!;
    first.focus();
    fireEvent.keyDown(first, { key: "*" });

    const rows = screen.getAllByRole("treeitem");
    /* Both level-1 branches open, so their children are visible; the level-2
     * branch A1 does not, so A1X is not. */
    expect(rows.map((row) => row.textContent)).toEqual(["A", "A1", "B", "B1"]);
    expect(rows[0]).toHaveAttribute("aria-expanded", "true");
    expect(rows[1]).toHaveAttribute("aria-expanded", "false");
  });

  it("renders a disabled node instead of deleting it, and steps over it", async () => {
    const withDisabled = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    render(<TreeView nodes={withDisabled} label="Sections" />);
    const rows = screen.getAllByRole("treeitem");
    expect(rows.map((row) => row.textContent)).toEqual(["A", "B", "C"]);
    expect(rows[1]).toHaveAttribute("aria-disabled", "true");

    rows[0]!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getAllByRole("treeitem")[2]).toHaveFocus();
    expect(screen.getAllByRole("treeitem")[1]).toHaveAttribute("tabindex", "-1");
  });
});

describe("TransferList", () => {
  const items = [
    { id: "a", label: "Alpha" },
    { id: "b", label: "Beta" },
    { id: "c", label: "Gamma" },
  ];

  it("moves the selected options between panes", async () => {
    const onValueChange = vi.fn();
    render(<TransferList items={items} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("option", { name: "Alpha" }));
    await userEvent.click(screen.getByRole("button", { name: /Move selected to Selected/ }));
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
  });

  it("selects everything in the focused pane with Ctrl+A", async () => {
    render(<TransferList items={items} defaultValue={["a"]} />);
    const available = screen.getByRole("listbox", { name: "Available" });
    available.focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(within(available).getByRole("option", { name: "Beta" })).toHaveAttribute("aria-selected", "true");
    expect(within(available).getByRole("option", { name: "Gamma" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("SortableList", () => {
  const items = [
    { id: "one", label: "One" },
    { id: "two", label: "Two" },
    { id: "three", label: "Three" },
  ];

  it("reorders with the keyboard and narrates the move", async () => {
    const onReorder = vi.fn();
    render(<SortableList items={items} onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reorder One" });
    handle.focus();
    await userEvent.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(onReorder).toHaveBeenLastCalledWith(["two", "one", "three"]);
    await userEvent.keyboard(" ");
    expect(handle).toHaveAttribute("aria-pressed", "false");
  });

  it("leaves the order alone when a move is cancelled", async () => {
    const onReorder = vi.fn();
    render(<SortableList items={items} onReorder={onReorder} />);
    const handle = screen.getByRole("button", { name: "Reorder Two" });
    handle.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{ArrowDown}");
    expect(onReorder).not.toHaveBeenCalled();
  });
});

describe("KanbanBoard", () => {
  const columns = [
    { id: "todo", title: "To do", cards: [{ id: "c1", title: "Ship it" }] },
    { id: "doing", title: "Doing", cards: [{ id: "c2", title: "Review" }] },
  ];

  it("carries a lifted card into the next column", async () => {
    const onMove = vi.fn();
    render(<KanbanBoard columns={columns} onMove={onMove} />);
    const handle = screen.getByRole("button", { name: "Move Ship it" });
    handle.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowRight}");
    expect(onMove).toHaveBeenCalledWith({ cardId: "c1", from: "todo", to: "doing", index: 0 });
  });
});

describe("FileUpload", () => {
  /*
   * The picker is an `sr-only` input opened by the visible button, so its name
   * has to come from the component: without it the input is announced as
   * "button" and axe reports a critical `label` violation on the page that
   * documents it.
   */
  it("names the hidden file input, and lets the caller override the name", () => {
    const { unmount } = render(<FileUpload items={[]} onFiles={() => {}} />);
    expect(document.querySelector("input[type=file]")).toHaveAccessibleName("Drop files here");
    unmount();

    render(<FileUpload items={[]} onFiles={() => {}} title="Attach a statement" inputLabel="Statement file" />);
    expect(document.querySelector("input[type=file]")).toHaveAccessibleName("Statement file");
  });

  it("reports a rejected file rather than dropping it silently", async () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(<FileUpload items={[]} onFiles={onFiles} onReject={onReject} maxSize={10} />);
    const input = document.querySelector("input[type=file]") as HTMLInputElement;
    const big = new File(["0123456789abcdef"], "big.csv", { type: "text/csv" });
    await userEvent.upload(input, big);
    expect(onFiles).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "size" })]);
  });

  it("renders per-file progress and offers retry only on failure", () => {
    render(
      <FileUpload
        items={[
          { id: "1", name: "prices.csv", status: "uploading", progress: 40, size: 2048 },
          { id: "2", name: "notes.md", status: "error", error: "Network error" },
        ]}
        onFiles={() => {}}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByLabelText("Uploading prices.csv")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry notes.md" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry prices.csv" })).not.toBeInTheDocument();
  });
});

describe("NotificationCenter", () => {
  const items = [
    { id: "n1", title: "Backfill finished", description: "4 symbols", timestamp: "2m", tone: "positive" as const },
    { id: "n2", title: "Data stale", timestamp: "1h", read: true, tone: "warning" as const },
  ];

  it("announces the unread count on the trigger", () => {
    render(<NotificationCenter items={items} />);
    expect(screen.getByRole("button", { name: "Notifications, 1 unread" })).toBeInTheDocument();
  });

  it("opens an inbox and marks everything read", async () => {
    const onReadAll = vi.fn();
    render(<NotificationCenter items={items} onReadAll={onReadAll} />);
    await userEvent.click(screen.getByRole("button", { name: /Notifications/ }));
    expect(await screen.findByRole("list", { name: "Notifications" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(onReadAll).toHaveBeenCalled();
  });
});

describe("GuidedTour", () => {
  function Harness() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <button type="button" id="anchor">
          Anchor
        </button>
        <GuidedTour
          open={open}
          onOpenChange={setOpen}
          steps={[
            { id: "one", title: "First", description: "Look here", target: "#anchor" },
            { id: "two", title: "Second", description: "Then here" },
          ]}
          labels={{ counter: (index, total) => `Step ${index + 1} of ${total}` }}
        />
      </>
    );
  }

  it("is a modal dialog that walks forward, back and out", async () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveFocus();
    expect(within(dialog).getByText("Step 1 of 2")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Second");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Back/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("First");
    // "Back" is now disabled, so focus sits on the dialog itself; Escape is the
    // promise the tour makes from any step.
    screen.getByRole("dialog").focus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ImageGallery and Lightbox", () => {
  const images = [
    { id: "i1", src: "/a.png", alt: "Alpha chart" },
    { id: "i2", src: "/b.png", alt: "Beta chart" },
  ];

  it("opens the viewer on the activated image and walks with the arrow keys", async () => {
    render(<ImageGallery images={images} label="Shots" />);
    await userEvent.click(screen.getByRole("button", { name: "Alpha chart" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("1 / 2")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(within(screen.getByRole("dialog")).getByText("2 / 2")).toBeInTheDocument();
  });

  it("renders standalone without the gallery", () => {
    render(
      <Lightbox images={images} index={1} open onOpenChange={() => {}} onIndexChange={() => {}} />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Beta chart");
  });
});

describe("ImageCompare", () => {
  it("is a labelled range control, not a custom pointer surface", async () => {
    const onValueChange = vi.fn();
    render(
      <ImageCompare
        before={{ src: "/before.png", alt: "Before" }}
        after={{ src: "/after.png", alt: "After" }}
        onValueChange={onValueChange}
      />,
    );
    const slider = screen.getByRole("slider", { name: "Compare images" });
    expect(slider).toHaveValue("50");
    slider.focus();
    // jsdom does not implement arrow-key stepping for range inputs, so the
    // change event the control actually owns is what gets exercised here.
    fireEvent.change(slider, { target: { value: "60" } });
    expect(onValueChange).toHaveBeenCalledWith(60);
  });
});

describe("AI surface", () => {
  it("reveals the whole string immediately when it is not streaming", () => {
    render(<StreamingText text="Finished answer" />);
    expect(screen.getByText("Finished answer")).toBeInTheDocument();
  });

  /*
   * An empty, finished stream paints nothing.
   *
   * The pattern this protects is "seeded thread, stream starts on mount": the
   * first commit has `text=""` and `streaming === false`. Returning an empty
   * span left `ChatMessage`'s bubble painted around no content, which reads as
   * a broken message rather than one that has not started.
   */
  it("renders nothing when there is no text and no stream in progress", () => {
    const { container } = render(<StreamingText text="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("still paints the caret while waiting for the first token", () => {
    const { container } = render(<StreamingText text="" streaming />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it("keeps one text node while streaming so nothing is spelled out twice", () => {
    render(<StreamingText text="Partly there" streaming caret />);
    expect(screen.getByText("Partly there", { exact: false })).toBeInTheDocument();
  });

  it("labels a turn by its author and exposes the role", () => {
    render(
      <ChatMessage from="assistant" author="Analyst">
        Numbers look right.
      </ChatMessage>,
    );
    expect(screen.getByRole("group", { name: "Analyst" })).toHaveAttribute("data-role", "assistant");
  });

  it("gives the conversation a log region", () => {
    render(
      <MessageList label="Thread">
        <ChatMessage from="user">Hi</ChatMessage>
      </MessageList>,
    );
    expect(screen.getByRole("log", { name: "Thread" })).toHaveAttribute("aria-live", "polite");
  });

  it("sends on Enter and clears the field", async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} label="Prompt" />);
    const field = screen.getByRole("textbox", { name: "Prompt" });
    await userEvent.type(field, "Summarise this{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Summarise this");
    expect(field).toHaveValue("");
  });

  it("will not send an empty prompt", async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Prompt" }), "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("expands a tool call to its arguments and result", async () => {
    render(
      <ToolCallTimeline
        calls={[
          { id: "t1", name: "search_documents", status: "done", input: '{"q":"risk"}', output: "3 hits", duration: "120 ms" },
        ]}
      />,
    );
    const row = screen.getByRole("button", { name: /search_documents/ });
    expect(row).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(row);
    expect(screen.getByText('{"q":"risk"}')).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-expanded", "true");
  });

  it("shows only the steps the application declared", () => {
    render(
      <AgentActivity
        title="Analysing"
        steps={[
          { id: "s1", label: "Read the brief", status: "done" },
          { id: "s2", label: "Fetch data", status: "active", detail: "12 of 40 symbols" },
          { id: "s3", label: "Write the summary", status: "pending" },
        ]}
      />,
    );
    expect(screen.getByLabelText("Agent activity")).toHaveTextContent("Read the brief");
    expect(screen.getByText("12 of 40 symbols")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });
});
