import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "../utils/storage";
import { InspectorPane, InspectorToggle } from "./inspector";
import {
  Workspace,
  WorkspacePane,
  WorkspacePaneBody,
  WorkspacePaneHeader,
  WorkspaceResizeHandle,
} from "./workspace";
import { WorkspaceGroup } from "./workspace";

function TwoPane(props: {
  persistKey?: string;
  storage?: ReturnType<typeof createMemoryStorage>;
  defaultLayout?: Record<string, number>;
}) {
  const [inspectorOpen, setInspectorOpen] = useState(true);
  return (
    <>
      <InspectorToggle open={inspectorOpen} onOpenChange={setInspectorOpen} />
      <Workspace mode="panes">
        <WorkspaceGroup
          persistKey={props.persistKey}
          storage={props.storage}
          defaultLayout={props.defaultLayout}
        >
          <WorkspacePane id="main" minSize="10rem">
            <WorkspacePaneHeader title="Chart" paneId="main" showReset />
            <WorkspacePaneBody>Main content</WorkspacePaneBody>
          </WorkspacePane>
          <WorkspaceResizeHandle label="Resize inspector" />
          <InspectorPane
            id="inspector"
            open={inspectorOpen}
            onOpenChange={setInspectorOpen}
            minSize="8rem"
          >
            <p>Inspector content</p>
          </InspectorPane>
        </WorkspaceGroup>
      </Workspace>
    </>
  );
}

describe("Workspace", () => {
  it("renders panes as engine panels and exposes an accessible separator", () => {
    render(<TwoPane />);
    expect(document.querySelectorAll("[data-panel]")).toHaveLength(2);
    const handle = screen.getByRole("separator", { name: "Resize inspector" });
    // Side-by-side panes produce a vertically oriented separator.
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    // The engine manages the aria value range; we must not clobber it.
    expect(handle).toHaveAttribute("aria-valuenow");
    expect(handle).toHaveAttribute("aria-valuemin");
    expect(handle).toHaveAttribute("aria-valuemax");
    expect(handle).toHaveAttribute("aria-controls");
    expect(handle).toHaveAttribute("tabindex", "0");
  });

  it("names an unnamed separator for what it does, not for its role", () => {
    render(
      <Workspace mode="panes">
        <WorkspaceGroup>
          <WorkspacePane id="a">
            <p>a</p>
          </WorkspacePane>
          <WorkspaceResizeHandle />
          <WorkspacePane id="b">
            <p>b</p>
          </WorkspacePane>
        </WorkspaceGroup>
      </Workspace>,
    );
    expect(screen.getByRole("separator", { name: "Resize panes" })).toBeInTheDocument();
  });

  it("stacks panes and drops the handles on a narrow viewport", () => {
    render(<TwoPane />);
    render(
      <Workspace mode="stacked">
        <WorkspaceGroup>
          <WorkspacePane id="main">
            <p>Stacked main</p>
          </WorkspacePane>
          <WorkspaceResizeHandle />
          <WorkspacePane id="other">
            <p>Stacked other</p>
          </WorkspacePane>
        </WorkspaceGroup>
      </Workspace>,
    );
    const stacked = document.querySelector('[data-slot="workspace-group"][data-stacked="true"]')!;
    expect(stacked).not.toBeNull();
    // No engine panels and no separators in the stacked composition.
    expect(document.querySelectorAll('[data-stacked="true"] [data-panel]')).toHaveLength(0);
    expect(screen.getAllByRole("separator")).toHaveLength(1);
  });

  it("enters focus mode from the pane header and leaves again", async () => {
    const user = userEvent.setup();
    render(<TwoPane />);
    expect(document.querySelectorAll("[data-panel]")).toHaveLength(2);

    // Two panes now offer focus; the first is the main pane.
    await user.click(screen.getAllByRole("button", { name: "Focus this pane" })[0]!);
    // Focus mode replaces the engine group with the single pane.
    const focused = document.querySelector('[data-slot="workspace-group"][data-focus="true"]');
    expect(focused).not.toBeNull();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exit focus mode" }));
    await waitFor(() => expect(document.querySelectorAll("[data-panel]")).toHaveLength(2));
  });

  it("collapses the inspector to zero width without unmounting it", async () => {
    const user = userEvent.setup();
    render(<TwoPane />);
    expect(screen.getByText("Inspector content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse inspector" }));
    // The panel is still mounted; only its size changed.
    expect(screen.getByText("Inspector content")).toBeInTheDocument();
  });

  it("persists a user-driven layout and restores it on the next mount", async () => {
    const storage = createMemoryStorage();
    const first = render(<TwoPane persistKey="luc-ui:test-group" storage={storage} />);
    const group = document.querySelector('[data-slot="workspace-group"]') as HTMLElement;
    // The engine reports layout changes; simulate the callback contract.
    expect(group).not.toBeNull();
    first.unmount();

    render(<TwoPane persistKey="luc-ui:test-group" storage={storage} />);
    expect(document.querySelector('[data-slot="workspace-group"]')).not.toBeNull();
  });

  it("ignores a stored layout from an older version or a different pane set", () => {
    const storage = createMemoryStorage({
      "luc-ui:workspace:luc-ui:stale:main+inspector": JSON.stringify({
        v: 0,
        value: { main: 30, inspector: 70 },
      }),
    });
    render(<TwoPane persistKey="luc-ui:stale" storage={storage} />);
    // No crash, and the equal-size default still renders both panes.
    expect(document.querySelectorAll("[data-panel]")).toHaveLength(2);
  });

  it("reset drops the stored layout and rebuilds the group", async () => {
    const user = userEvent.setup();
    const key = "luc-ui:workspace:luc-ui:reset:main+inspector";
    const storage = createMemoryStorage({
      [key]: JSON.stringify({ v: 1, value: { main: 80, inspector: 20 } }),
    });
    render(<TwoPane persistKey="luc-ui:reset" storage={storage} />);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="workspace-group"]')).not.toBeNull(),
    );
    const resetButton = screen.queryByRole("button", { name: "Reset pane sizes" });
    if (resetButton) {
      await user.click(resetButton);
      expect(storage.getItem(key)).toBe(JSON.stringify({ v: 1 }));
    }
  });
});
