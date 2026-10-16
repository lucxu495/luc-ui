import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { BorderTrail } from "./border-trail";
import { ClickBurst } from "./click-burst";
import { GlareSurface } from "./glare-surface";
import { IconMorph } from "./icon-morph";
import { MotionIntensityProvider, useMotionProfile } from "./intensity";
import { InteractiveGrid } from "./interactive-grid";
import { Magnetic } from "./magnetic";
import {
  MorphingDialog,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogTrigger,
} from "./morphing-dialog";
import { MorphingPopover, MorphingPopoverContent, MorphingPopoverTrigger } from "./morphing-popover";
import { NumberTicker } from "./number-ticker";
import { Pressable } from "./pressable";
import { ScrambleText, TextReveal } from "./text-reveal";
import { TiltSurface } from "./tilt-surface";
import { TransitionPanel } from "./transition-panel";
import { ambient, intensityProfiles, pointer, surfaceResponse } from "./tokens";

afterEach(() => {
  delete document.documentElement.dataset.motion;
});

function forceReducedMotion() {
  document.documentElement.dataset.motion = "reduced";
}

describe("V1.2 motion tokens", () => {
  it("keeps the intensity profiles monotonic", () => {
    const levels = ["none", "functional", "expressive", "showcase"] as const;
    for (let index = 1; index < levels.length; index += 1) {
      const previous = intensityProfiles[levels[index - 1]!];
      const current = intensityProfiles[levels[index]!];
      expect(current.travel).toBeGreaterThanOrEqual(previous.travel);
      expect(current.glow).toBeGreaterThanOrEqual(previous.glow);
      expect(current.depth).toBeGreaterThanOrEqual(previous.depth);
    }
    expect(intensityProfiles.none.pointer).toBe(false);
    expect(intensityProfiles.functional.pointer).toBe(false);
    expect(intensityProfiles.expressive.pointer).toBe(true);
  });

  it("publishes pointer, surface and ambient geometry", () => {
    expect(pointer.tiltMaxAngle).toBeLessThanOrEqual(10);
    expect(pointer.magneticStrength).toBeLessThan(1);
    expect(surfaceResponse.pressScale).toBeLessThan(surfaceResponse.hoverScale);
    expect(ambient.trail).toBeGreaterThan(ambient.shimmer);
  });
});

describe("MotionIntensityProvider", () => {
  function Probe() {
    const profile = useMotionProfile();
    return <span data-testid="profile">{`${profile.intensity}:${profile.pointer ? "pointer" : "static"}`}</span>;
  }

  it("defaults to expressive and lets a scope quieten down", () => {
    const { unmount } = render(<Probe />);
    expect(screen.getByTestId("profile")).toHaveTextContent("expressive:pointer");
    unmount();
    render(
      <MotionIntensityProvider intensity="functional">
        <Probe />
      </MotionIntensityProvider>,
    );
    expect(screen.getByTestId("profile")).toHaveTextContent("functional:static");
  });

  it("collapses every scope to `none` under reduced motion", () => {
    forceReducedMotion();
    render(
      <MotionIntensityProvider intensity="showcase">
        <Probe />
      </MotionIntensityProvider>,
    );
    expect(screen.getByTestId("profile")).toHaveTextContent("none:static");
  });
});

describe("cursor-reactive primitives", () => {
  it("renders the magnetic wrapper inert when reduced motion is forced", () => {
    forceReducedMotion();
    const { container } = render(
      <Magnetic>
        <button type="button">Go</button>
      </Magnetic>,
    );
    const root = container.querySelector('[data-slot="magnetic"]');
    expect(root).toHaveAttribute("data-enabled", "false");
    // The child is still reachable: the wrapper must never hide or block it.
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });

  it("keeps tilt and glare flat under reduced motion", () => {
    forceReducedMotion();
    const { container } = render(
      <TiltSurface>
        <GlareSurface>
          <span>surface</span>
        </GlareSurface>
      </TiltSurface>,
    );
    expect(container.querySelector('[data-slot="tilt-surface"]')).toHaveAttribute("data-enabled", "false");
    expect(container.querySelector('[data-slot="glare-surface"]')).toHaveAttribute("data-enabled", "false");
    expect(screen.getByText("surface")).toBeInTheDocument();
  });
});

describe("BorderTrail", () => {
  it("draws a single travelling segment on a normalised path", () => {
    const { container } = render(
      <BorderTrail variant="active">
        <span>card</span>
      </BorderTrail>,
    );
    const segment = container.querySelector('[data-slot="border-trail-segment"]');
    expect(segment).not.toBeNull();
    expect(segment).toHaveAttribute("pathLength", "100");
    expect(segment?.getAttribute("stroke-dasharray")).toBe("18 82");
  });
});

describe("ClickBurst", () => {
  it("spawns nothing when reduced motion is forced", async () => {
    forceReducedMotion();
    const user = userEvent.setup();
    const { container } = render(
      <ClickBurst>
        <button type="button">Copy</button>
      </ClickBurst>,
    );
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(container.querySelectorAll('[data-slot="click-burst"] ~ * span').length).toBe(0);
    expect(container.querySelectorAll(".absolute.block.rounded-full").length).toBe(0);
  });
});

describe("InteractiveGrid", () => {
  it("renders a base field and a reactive layer", () => {
    const { container } = render(<InteractiveGrid cell={24} />);
    const root = container.querySelector('[data-slot="interactive-grid"]');
    const base = container.querySelector('[data-slot="interactive-grid-base"]');
    const active = container.querySelector('[data-slot="interactive-grid-active"]');
    expect(root).not.toBeNull();
    expect(base?.getAttribute("style")).toContain("24px 24px");
    // The reactive layer is masked to the pointer position written by the tracker.
    expect(active?.getAttribute("style")).toContain("--grid-x");
  });
});

describe("Pressable", () => {
  it("stays inert (same semantics, no motion) under reduced motion", () => {
    forceReducedMotion();
    const { container } = render(
      <Pressable as="a" href="/research">
        Research
      </Pressable>,
    );
    const root = container.querySelector('[data-slot="pressable"]');
    expect(root).toHaveAttribute("data-enabled", "false");
    expect(screen.getByRole("link", { name: "Research" })).toHaveAttribute("href", "/research");
  });
});

describe("IconMorph", () => {
  it("exposes the active state and swaps the glyph in place", () => {
    const icons = { copy: <svg data-testid="copy" />, done: <svg data-testid="done" /> };
    const { rerender, container } = render(<IconMorph state="copy" icons={icons} size={16} />);
    expect(container.querySelector('[data-slot="icon-morph"]')).toHaveAttribute("data-state", "copy");
    expect(screen.getByTestId("copy")).toBeInTheDocument();
    rerender(<IconMorph state="done" icons={icons} size={16} />);
    expect(container.querySelector('[data-slot="icon-morph"]')).toHaveAttribute("data-state", "done");
    expect(screen.getByTestId("done")).toBeInTheDocument();
  });
});

describe("TransitionPanel", () => {
  it("shows the active panel and keeps a stable slot", async () => {
    const { rerender, container } = render(
      <TransitionPanel activeIndex="a" direction={1}>
        <p>Panel A</p>
      </TransitionPanel>,
    );
    expect(screen.getByText("Panel A")).toBeInTheDocument();
    rerender(
      <TransitionPanel activeIndex="b" direction={-1}>
        <p>Panel B</p>
      </TransitionPanel>,
    );
    expect(await screen.findByText("Panel B")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="transition-panel"]')).not.toBeNull();
  });
});

describe("TextReveal", () => {
  it("keeps the headline readable as real text", () => {
    const { container } = render(<TextReveal text="Kinetic research" mode="word" />);
    const root = container.querySelector('[data-slot="text-reveal"]');
    expect(root).toHaveAttribute("data-mode", "word");
    expect(root?.textContent?.replace(/\u00A0/g, " ").trim()).toBe("Kinetic research");
  });

  it("prints ScrambleText immediately under reduced motion with a correct name", () => {
    forceReducedMotion();
    render(<ScrambleText text="SIGNAL ACTIVE" />);
    const node = screen.getByLabelText("SIGNAL ACTIVE");
    expect(node).toHaveTextContent("SIGNAL ACTIVE");
  });
});

describe("NumberTicker digits", () => {
  it("renders a digit column per digit and reserves width with the final string", () => {
    const { container } = render(<NumberTicker value={72104.87} variant="digits" minimumFractionDigits={2} />);
    const ticker = container.querySelector('[data-slot="number-ticker"]');
    expect(ticker).toHaveAttribute("data-variant", "digits");
    expect(ticker?.querySelector(".invisible")?.textContent).toBe("72,104.87");
    expect(container.querySelectorAll('[data-slot="digit-column"]').length).toBe(7);
    expect(ticker?.querySelector(".sr-only")?.textContent).toBe("72,104.87");
  });
});

describe("MorphingDialog", () => {
  it("keeps the Radix dialog contract while bridging the geometry", async () => {
    const user = userEvent.setup();
    render(
      <MorphingDialog>
        <MorphingDialogTrigger>
          <span>Open study</span>
        </MorphingDialogTrigger>
        <MorphingDialogContent>
          <MorphingDialogTitle>Forward returns</MorphingDialogTitle>
          <p>prepared statistics</p>
        </MorphingDialogContent>
      </MorphingDialog>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getAllByRole("button", { name: "Open study" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Open study" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Forward returns");

    await user.keyboard("{Escape}");
    expect(await screen.findByText("Open study")).toBeInTheDocument();
    // The panel animates out, so removal is asynchronous by design.
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("tracks open state when controlled", async () => {
    const { rerender } = render(
      <MorphingDialog open={false}>
        <MorphingDialogTrigger>
          <span>Open</span>
        </MorphingDialogTrigger>
        <MorphingDialogContent>
          <MorphingDialogTitle>Panel</MorphingDialogTitle>
        </MorphingDialogContent>
      </MorphingDialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => {
      rerender(
        <MorphingDialog open>
          <MorphingDialogTrigger>
            <span>Open</span>
          </MorphingDialogTrigger>
          <MorphingDialogContent>
            <MorphingDialogTitle>Panel</MorphingDialogTitle>
          </MorphingDialogContent>
        </MorphingDialog>,
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("MorphingPopover", () => {
  it("opens a labelled popover from its trigger", async () => {
    const user = userEvent.setup();
    render(
      <MorphingPopover>
        <MorphingPopoverTrigger>
          <span>Detail</span>
        </MorphingPopoverTrigger>
        <MorphingPopoverContent>Sharpe 0.94</MorphingPopoverContent>
      </MorphingPopover>,
    );
    expect(screen.getAllByRole("button", { name: "Detail" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Detail" }));
    expect(await screen.findByText("Sharpe 0.94")).toBeInTheDocument();
  });
});
