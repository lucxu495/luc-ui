import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("keeps a semantic font size and a text colour together", () => {
    // Regression: tailwind-merge used to treat `text-label` as a colour and
    // drop `text-accent-on-accent`, which made primary buttons unreadable.
    expect(cn("text-accent-on-accent", "text-label")).toBe("text-accent-on-accent text-label");
    expect(cn("text-fg-positive", "text-caption")).toBe("text-fg-positive text-caption");
    expect(cn("text-fg-muted", "text-micro")).toBe("text-fg-muted text-micro");
  });

  it("still resolves real conflicts", () => {
    expect(cn("text-label", "text-body")).toBe("text-body");
    expect(cn("text-fg-muted", "text-fg-primary")).toBe("text-fg-primary");
    expect(cn("bg-surface-default", "bg-surface-raised")).toBe("bg-surface-raised");
  });

  it("handles conditional input", () => {
    expect(cn("p-2", false && "p-4", undefined, ["rounded-md"])).toBe("p-2 rounded-md");
  });
});
