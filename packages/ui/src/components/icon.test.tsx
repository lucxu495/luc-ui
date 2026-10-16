import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon, iconFor, iconNames, iconSet, searchIcons } from "./icon";

describe("Icon", () => {
  it("draws a glyph passed as a component", () => {
    render(<Icon icon={iconFor("play")!} data-testid="icon-host" />);
    expect(screen.getByTestId("icon-host").querySelector("svg")).toBeInTheDocument();
  });

  it("draws the same glyph addressed by name", () => {
    render(<Icon name="play" data-testid="icon-host" />);
    const slot = screen.getByTestId("icon-host");
    expect(slot).toHaveAttribute("data-name", "play");
    expect(slot.querySelector("svg")).toBeInTheDocument();
  });

  it("is decoration by default and an image when it is named", () => {
    const { unmount } = render(<Icon name="close" data-testid="icon-host" />);
    const silent = screen.getByTestId("icon-host");
    expect(silent).toHaveAttribute("aria-hidden", "true");
    expect(silent).not.toHaveAttribute("aria-label");
    unmount();
    render(<Icon name="close" label="Close the panel" />);
    expect(screen.getByRole("img", { name: "Close the panel" })).toBeInTheDocument();
  });

  it("carries size and tone as classes rather than a pixel prop", () => {
    render(<Icon name="user" size="xl" tone="positive" data-testid="icon-host" />);
    const slot = screen.getByTestId("icon-host");
    expect(slot.className).toContain("size-6");
    expect(slot.className).toContain("text-fg-positive");
  });

  it("refuses a name it does not ship, instead of rendering nothing", () => {
    /* A silent empty glyph is the failure this replaces: the page keeps working
     * and one picture is simply missing. */
    expect(() => render(<Icon name="not-an-icon" />)).toThrow(/not in the LUC icon set/);
    expect(() => render(<Icon />)).toThrow(/pass `icon`/);
  });
});

describe("the icon set", () => {
  it("has one name per glyph, and no duplicates", () => {
    const names = iconSet.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length);
    expect(iconNames).toEqual(names);
  });

  it("resolves every curated name", () => {
    const missing = iconNames.filter((name) => iconFor(name) === undefined);
    expect(missing).toEqual([]);
  });

  it("searches names and keywords in both languages", () => {
    expect(searchIcons("play")).toContain("play");
    expect(searchIcons("run")).toContain("play");
    expect(searchIcons("刷新")).toEqual(["refresh"]);
    expect(searchIcons("  ")).toEqual(iconNames);
    expect(searchIcons("down")).toEqual(expect.arrayContaining(["download", "arrow-down"]));
    expect(searchIcons("nothing-matches-this")).toEqual([]);
  });
});
